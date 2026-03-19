class Location {
  constructor({ id = null, latitude = null, longitude = null, address = null, placeName = null, country = null } = {}) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.placeName = placeName;
    this.country = country;
  }

  getCoordinateKey() {
    if (this.latitude == null || this.longitude == null) return null;
    return `${Number(this.latitude).toFixed(4)}_${Number(this.longitude).toFixed(4)}`;
  }

  isValid() {
    if (typeof this.latitude !== 'number' || typeof this.longitude !== 'number') return false;
    if (this.latitude < -90 || this.latitude > 90) return false;
    if (this.longitude < -180 || this.longitude > 180) return false;
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      latitude: this.latitude,
      longitude: this.longitude,
      address: this.address,
      placeName: this.placeName,
      country: this.country,
      coordinateKey: this.getCoordinateKey(),
    };
  }
}

module.exports = Location;
