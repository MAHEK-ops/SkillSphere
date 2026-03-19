const axios = require('axios');
const Location = require('../models/Location');

// Regex to detect if an input is explicitly coordinates: "18.5204, 73.8567"
const COORDS_REGEX = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
const USER_AGENT = 'ChronoLens/1.0';

class GeocodingService {
  constructor() {
    this.lastCallTime = 0;
  }

  /**
   * Internal mechanism enforcing Nominatim's 1100ms rate limit exactly
   */
  async _enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < 1100) {
      const waitTime = 1100 - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastCallTime = Date.now();
  }

  /**
   * Geocode a plain text address (or raw coordinates string) into a Location model.
   * @param {string} address - The query string
   * @returns {Promise<Location>}
   */
  async geocode(address) {
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new Error('Address is required');
    }

    const cleanAddress = address.trim();

    // Edge Case: If it's already "lat, lng", parse natively bypassing API usage
    if (COORDS_REGEX.test(cleanAddress)) {
      const [latStr, lngStr] = cleanAddress.split(',').map(s => s.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      return new Location({ latitude: lat, longitude: lng, address: cleanAddress });
    }

    await this._enforceRateLimit();

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        headers: {
          'User-Agent': USER_AGENT,
        },
        params: {
          q: cleanAddress,
          format: 'json',
          limit: 1,
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`Location not found: ${cleanAddress}`);
      }

      const result = response.data[0];
      return new Location({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: cleanAddress,
        placeName: result.name || result.display_name,
        country: null // Country parsing requires more detailed nominatim flags, leaving null conventionally
      });
    } catch (err) {
      // Re-throw standardized format errors directly
      if (err.message.startsWith('Location not found')) {
        throw err;
      }
      throw new Error(`Geocoding API failed: ${err.message}`);
    }
  }

  /**
   * Resolves Coordinates directly into a human readable place name string.
   * @param {number|string} lat
   * @param {number|string} lng
   * @returns {Promise<string>}
   */
  async reverseGeocode(lat, lng) {
    if (lat == null || lng == null) {
      return 'Unknown location';
    }

    await this._enforceRateLimit();

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        headers: {
          'User-Agent': USER_AGENT,
        },
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lng),
          format: 'json',
        },
      });

      if (!response.data || response.data.error) {
        return 'Unknown location';
      }

      return response.data.display_name || response.data.name || 'Unknown location';
    } catch (err) {
      return 'Unknown location';
    }
  }
}

// Export as singleton to maintain rate limiting boundaries correctly across system
module.exports = new GeocodingService();
