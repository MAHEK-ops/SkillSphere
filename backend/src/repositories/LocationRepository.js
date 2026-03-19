const prisma = require('../db/prisma');
const LocationModel = require('../models/Location');

class LocationRepository {
  /**
   * Finds a location by its deterministic 4-decimal coordinate key
   * @param {string} key 
   * @returns {Promise<LocationModel|null>}
   */
  async findByCoordinateKey(key) {
    const raw = await prisma.location.findUnique({
      where: { coordinateKey: key },
    });
    return raw ? new LocationModel(raw) : null;
  }

  /**
   * Finds a location securely via primary ID
   * @param {number} id 
   * @returns {Promise<LocationModel|null>}
   */
  async findById(id) {
    const raw = await prisma.location.findUnique({
      where: { id },
    });
    return raw ? new LocationModel(raw) : null;
  }

  /**
   * Upserts the Location record logically.
   * NOTE: The raw PostGIS coordinates column MUST be synchronized afterward!
   * @param {LocationModel} locationData 
   * @returns {Promise<LocationModel>}
   */
  async save(locationData) {
    const key = locationData.coordinateKey || locationData.getCoordinateKey();

    const raw = await prisma.location.upsert({
      where: { coordinateKey: key },
      update: {
        address: locationData.address || null,
        placeName: locationData.placeName || null,
        country: locationData.country || null,
      },
      create: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address || null,
        placeName: locationData.placeName || null,
        country: locationData.country || null,
        coordinateKey: key,
      },
    });

    return new LocationModel(raw);
  }

  /**
   * Fetches Locations actively intersecting the 4326 geodata coordinate radius
   * Maps results back dynamically into Memory Domain Models
   */
  async findNearby(lat, lng, radiusKm) {
    // PostGIS raw string query mapping
    const rows = await prisma.$queryRaw`
      SELECT * FROM "Location"
      WHERE ST_DWithin(
        coordinates::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}
      )
    `;

    return rows.map(r => new LocationModel(r));
  }
}

module.exports = new LocationRepository();
