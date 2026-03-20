const HistoricalEventFetcher = require('./HistoricalEventFetcher');
const RawEvent = require('../models/RawEvent');

class GeoNamesFetcher extends HistoricalEventFetcher {
  constructor(source) {
    super(source);
    this.API_URL = 'http://api.geonames.org/findNearbyWikipediaJSON';
  }

  /**
   * Translates exact geocoordinates dynamically bridging to native GeoNames mappings.
   * @param {number} lat 
   * @param {number} lng 
   * @param {number} radiusKm 
   * @returns {Promise<RawEvent[]>}
   */
  async fetchByCoordinates(lat, lng, radiusKm) {
    if (!this.isAvailable()) return [];

    const username = process.env.GEONAMES_USERNAME;
    
    // Explicit Validation Constraint: GeoNames silently fails without this parameter
    if (!username) {
      console.warn('⚠️ GeoNames Fetcher aborted: Environment variable GEONAMES_USERNAME is missing');
      return [];
    }

    const params = {
      lat,
      lng,
      radius: radiusKm,
      maxRows: 50,
      username
    };

    try {
      const data = await this.fetchWithRetry(this.API_URL, params);
      return this.parseResponse(data);
    } catch (err) {
      console.error(`🔴 GeoNamesFetcher failed fetching events for [${lat}, ${lng}]:`, err.message);
      return [];
    }
  }

  /**
   * Iterates mapped outputs extracting metadata structurally conforming cleanly to core parameters natively
   */
  parseResponse(data) {
    if (!data || !data.geonames || !Array.isArray(data.geonames)) {
      return [];
    }

    return data.geonames.map(entry => {
      // Avoid populating unmapped geometry crashes
      const pLat = entry.lat !== undefined ? parseFloat(entry.lat) : null;
      const pLng = entry.lng !== undefined ? parseFloat(entry.lng) : null;

      return new RawEvent({
        rawTitle: entry.title || null,
        rawDescription: entry.summary || null,
        rawDate: null, 
        rawLat: pLat,
        rawLng: pLng,
        sourceApiName: 'GeoNames',
        metadata: {
          wikipediaUrl: entry.wikipediaUrl || null,
          rank: entry.rank || null
        }
      });
    });
  }
}

module.exports = GeoNamesFetcher;
