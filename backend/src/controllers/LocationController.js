const LocationService = require('../services/LocationService');
const CacheService = require('../services/CacheService');
const TimelineBuilder = require('../services/TimelineBuilder');
const StoryModeService = require('../services/StoryModeService');
const EventRepository = require('../repositories/EventRepository');
const LocationRepository = require('../repositories/LocationRepository');
const prisma = require('../db/prisma');

// ─── Service Wiring ─────────────────────────────────────────────
// Fetchers and services export classes — instantiate once here.
const WikipediaFetcher = require('../fetchers/WikipediaFetcher');
const WikidataFetcher = require('../fetchers/WikidataFetcher');
const GeoNamesFetcher = require('../fetchers/GeoNamesFetcher');
const EventFactory = require('../factory/EventFactory');
const DeduplicationService = require('../services/DeduplicationService');
const CategorizationService = require('../services/CategorizationService');
const ScoringService = require('../services/ScoringService');
const EventAggregatorService = require('../services/EventAggregatorService');

const fetchers = [
  new WikipediaFetcher('Wikipedia'),
  new WikidataFetcher('Wikidata'),
  new GeoNamesFetcher('GeoNames'),
];

const deduplicationService = new DeduplicationService();
const categorizationService = new CategorizationService();
const scoringService = new ScoringService();

const aggregatorService = new EventAggregatorService(
  fetchers,
  EventFactory,
  deduplicationService,
  categorizationService,
  scoringService
);

// ─── LocationController ─────────────────────────────────────────
// Main API controller handling the POST /api/timeline endpoint.
// Orchestrates the full pipeline: validate → resolve → cache →
// aggregate → build → persist → cache → log → respond.

class LocationController {
  /**
   * POST /api/timeline
   * Full pipeline from address/coordinates input to timeline response.
   *
   * Request body:
   *   { address: string, radiusKm?: number, sortOrder?: string, groupBy?: string|null }
   *
   * Response:
   *   { success, cached, location, timeline }
   */
  async getTimeline(req, res) {
    const startTime = Date.now();

    try {
      const { address, latitude, longitude, radiusKm = 10, sortOrder = 'ASC', groupBy = null } = req.body;

      // ── 1. Validate — address or coordinates required ──
      const hasAddress = address && typeof address === 'string' && address.trim().length > 0;
      const hasCoords = latitude != null && longitude != null;

      if (!hasAddress && !hasCoords) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed: "address" or "latitude"/"longitude" coordinates are required.',
        });
      }

      // ── 2. Resolve location via LocationService ──
      let locationData;
      try {
        if (hasAddress) {
          locationData = await LocationService.resolveLocation(address.trim());
        } else {
          // Build a minimal Location object from raw coordinates
          const LocationModel = require('../models/Location');
          locationData = new LocationModel({ latitude, longitude });
        }
      } catch (geoErr) {
        console.error('❌ Geocoding failed:', geoErr.message);
        return res.status(404).json({
          success: false,
          error: `Location not found for input: "${address || `${latitude},${longitude}`}"`,
        });
      }

      if (!locationData || locationData.latitude == null || locationData.longitude == null) {
        return res.status(404).json({
          success: false,
          error: `Could not resolve location for: "${address || `${latitude},${longitude}`}"`,
        });
      }

      // Persist / retrieve the location record with PostGIS sync
      const savedLocation = await LocationService.getOrSave(locationData);

      // ── 3. Check cache → return early with cached: true if hit ──
      const cacheKey = CacheService.buildKey(savedLocation.latitude, savedLocation.longitude, radiusKm);
      const cachedTimeline = await CacheService.get(cacheKey);

      if (cachedTimeline) {
        console.log(`⚡ Cache HIT for key: ${cacheKey}`);

        // Log the search even on cache hit
        await LocationController._logSearch(savedLocation.id, radiusKm, null, cachedTimeline.totalCount, Date.now() - startTime);

        return res.status(200).json({
          success: true,
          cached: true,
          location: LocationController._formatLocation(savedLocation),
          timeline: cachedTimeline,
        });
      }

      console.log(`🔍 Cache MISS for key: ${cacheKey} — running aggregation pipeline…`);

      // ── 4. Aggregate events via full pipeline ──
      let scoredEvents;
      try {
        scoredEvents = await aggregatorService.aggregate(savedLocation, radiusKm);
      } catch (aggErr) {
        console.error('❌ Aggregation pipeline failed:', aggErr.message);

        if (aggErr.message.includes('All data sources failed')) {
          return res.status(503).json({
            success: false,
            error: 'All external data sources are currently unavailable. Please try again later.',
          });
        }

        throw aggErr; // Re-throw unexpected errors to the outer catch
      }

      // ── 5. Build timeline ──
      const timeline = TimelineBuilder.build(scoredEvents, savedLocation, { sortOrder, groupBy });
      const timelineJSON = timeline.toJSON();

      // ── 6. Persist events to database ──
      const eventsToSave = scoredEvents.map(se => se.event || se);
      await EventRepository.saveAll(eventsToSave, savedLocation.id);

      // ── 7. Cache the timeline with 1-hour TTL ──
      await CacheService.set(cacheKey, timelineJSON, 3600);

      // ── 8. Log to SearchLog ──
      const responseTimeMs = Date.now() - startTime;
      await LocationController._logSearch(savedLocation.id, radiusKm, null, timelineJSON.totalCount, responseTimeMs);

      // ── 9. Return response ──
      return res.status(200).json({
        success: true,
        cached: false,
        location: LocationController._formatLocation(savedLocation),
        timeline: timelineJSON,
      });

    } catch (err) {
      console.error('🔴 LocationController.getTimeline unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  }

  /**
   * GET /api/timeline/:locationId/story
   * Generate a readable historical narrative for a location's timeline.
   *
   * Response: { success, locationId, placeName, narrative }
   */
  async getStory(req, res) {
    try {
      const { locationId } = req.params;
      const parsedId = parseInt(locationId, 10);

      if (isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          success: false,
          error: '"locationId" must be a positive integer.',
        });
      }

      // Verify location exists
      const location = await LocationRepository.findById(parsedId);
      if (!location) {
        return res.status(404).json({
          success: false,
          error: `Location with id ${parsedId} not found.`,
        });
      }

      // Fetch persisted events and build a timeline
      const events = await EventRepository.findByLocationId(parsedId);
      const timeline = TimelineBuilder.build(events, location, { sortOrder: 'ASC' });

      // Generate narrative
      const narrative = StoryModeService.generateNarrative(timeline);

      return res.status(200).json({
        success: true,
        locationId: parsedId,
        placeName: location.placeName || location.address || null,
        narrative,
      });

    } catch (err) {
      console.error('🔴 LocationController.getStory unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while generating the story.',
      });
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  /**
   * Format location for API response.
   */
  static _formatLocation(loc) {
    return {
      id: loc.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      placeName: loc.placeName || loc.address || null,
      address: loc.address || null,
      country: loc.country || null,
    };
  }

  /**
   * Log search request to the SearchLog table (fire-and-forget).
   */
  static async _logSearch(locationId, radiusKm, userId, resultCount, responseTimeMs) {
    try {
      await prisma.searchLog.create({
        data: {
          locationId,
          userId: userId || null,
          radiusKm: radiusKm || null,
          resultCount: resultCount || 0,
          responseTimeMs: responseTimeMs || null,
        },
      });
    } catch (logErr) {
      // Search logging should never break the main flow
      console.warn('⚠️ Failed to log search:', logErr.message);
    }
  }
}

module.exports = new LocationController();
