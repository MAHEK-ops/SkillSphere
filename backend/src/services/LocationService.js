const prisma = require('../db/prisma');
const LocationRepository = require('../repositories/LocationRepository');
const GeocodingService = require('./GeocodingService');

class LocationService {
  /**
   * Translates unstructured search inputs dynamically into validated Location objects.
   * Leverages GeocodingService directly.
   * @param {string} input 
   * @returns {Promise<Location>}
   */
  async resolveLocation(input) {
    return await GeocodingService.geocode(input);
  }

  /**
   * Orchestrates Upsert persistence directly syncing Prisma records alongside underlying PostGIS coordinates natively.
   * @param {Location} locationData 
   * @returns {Promise<Location>}
   */
  async getOrSave(locationData) {
    const key = locationData.coordinateKey || locationData.getCoordinateKey();

    // Fast-path: Check if already correctly synchronized avoiding overhead
    const existing = await LocationRepository.findByCoordinateKey(key);
    if (existing && existing.id) {
      return existing;
    }

    // Persist via standard repository upserting
    const savedLocation = await LocationRepository.save(locationData);

    // Hard sync PostGIS native coordinates column directly into DB
    await prisma.$executeRaw`
      UPDATE "Location"
      SET coordinates = ST_SetSRID(ST_MakePoint(${savedLocation.longitude}, ${savedLocation.latitude}), 4326)
      WHERE id = ${savedLocation.id}
    `;

    return savedLocation;
  }
}

module.exports = new LocationService();
