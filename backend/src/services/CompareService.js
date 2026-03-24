const EventRepository = require('../repositories/EventRepository');

// ─── CompareService ─────────────────────────────────────────────
// Computes side-by-side historical richness statistics for two
// locations based on their persisted event data.

class CompareService {
  /**
   * Build a comparison stats object for a single location's events.
   * @param {HistoricalEvent[]} events
   * @returns {Object} Location stats including breakdowns and richness score
   */
  static computeStats(events) {
    const totalEvents = events.length;

    // ── Category breakdown ──
    const categoryBreakdown = {};
    for (const event of events) {
      const cat = event.category || 'UNKNOWN';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    // ── Era breakdown ──
    const eraBreakdown = {};
    for (const event of events) {
      const era = event.era || 'UNKNOWN';
      eraBreakdown[era] = (eraBreakdown[era] || 0) + 1;
    }

    // ── Dominant category (highest count) ──
    const dominantCategory = CompareService._getDominant(categoryBreakdown);

    // ── Dominant era (highest count) ──
    const dominantEra = CompareService._getDominant(eraBreakdown);

    // ── Average confidence score ──
    const avgScore = totalEvents > 0
      ? events.reduce((sum, e) => sum + (e.confidenceScore || 0), 0) / totalEvents
      : 0;

    // ── Unique categories (excluding UNKNOWN) ──
    const uniqueCategories = Object.keys(categoryBreakdown).filter(c => c !== 'UNKNOWN').length;

    // ── Richness score: min(100, (totalEvents * 2) + (uniqueCategories * 10) + (avgScore * 0.3)) ──
    const rawRichness = (totalEvents * 2) + (uniqueCategories * 10) + (avgScore * 0.3);
    const richnessScore = Math.round(Math.min(100, rawRichness) * 10) / 10;

    return {
      totalEvents,
      dominantCategory,
      dominantEra,
      categoryBreakdown,
      eraBreakdown,
      averageConfidenceScore: Math.round(avgScore * 10) / 10,
      richnessScore,
    };
  }

  /**
   * Compare two locations by their event statistics.
   * @param {number} locationId1
   * @param {number} locationId2
   * @returns {Promise<{ location1: Object, location2: Object }>}
   */
  static async compare(locationId1, locationId2) {
    const [events1, events2] = await Promise.all([
      EventRepository.findByLocationId(locationId1),
      EventRepository.findByLocationId(locationId2),
    ]);

    return {
      location1: CompareService.computeStats(events1),
      location2: CompareService.computeStats(events2),
    };
  }

  /**
   * Get the key with the highest value from a breakdown map.
   * @param {Object} breakdown - e.g. { WAR_BATTLE: 10, POLITICS: 6 }
   * @returns {string|null}
   */
  static _getDominant(breakdown) {
    let dominant = null;
    let max = 0;

    for (const [key, count] of Object.entries(breakdown)) {
      if (count > max) {
        max = count;
        dominant = key;
      }
    }

    return dominant;
  }
}

module.exports = CompareService;
