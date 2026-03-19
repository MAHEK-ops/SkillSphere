class RawEvent {
  constructor({ rawTitle = null, rawDescription = null, rawDate = null, rawLat = null, rawLng = null, sourceApiName = null, metadata = {} } = {}) {
    this.rawTitle = rawTitle;
    this.rawDescription = rawDescription;
    this.rawDate = rawDate;
    this.rawLat = rawLat;
    this.rawLng = rawLng;
    this.sourceApiName = sourceApiName;
    this.metadata = metadata;
  }

  hasCoordinates() {
    return typeof this.rawLat === 'number' && typeof this.rawLng === 'number' && !isNaN(this.rawLat) && !isNaN(this.rawLng);
  }

  toJSON() {
    return {
      rawTitle: this.rawTitle,
      rawDescription: this.rawDescription,
      rawDate: this.rawDate,
      rawLat: this.rawLat,
      rawLng: this.rawLng,
      sourceApiName: this.sourceApiName,
      metadata: this.metadata,
    };
  }
}

module.exports = RawEvent;
