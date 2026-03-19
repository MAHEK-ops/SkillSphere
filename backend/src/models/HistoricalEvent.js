const Category = require('../constants/Category');
const Era = require('../constants/Era');

class HistoricalEvent {
  constructor({
    id = null,
    locationId = null,
    title = null,
    description = null,
    year = null,
    dateDisplay = null,
    category = Category.UNKNOWN,
    era = Era.UNKNOWN,
    latitude = null,
    longitude = null,
    sourceUrl = null,
    sourceName = null,
    confidenceScore = 0,
    sourceCount = 1,
  } = {}) {
    this.id = id;
    this.locationId = locationId;
    this.title = title;
    this.description = description;
    this.year = year;
    this.dateDisplay = dateDisplay;
    this.category = category;
    this.era = era;
    this.latitude = latitude;
    this.longitude = longitude;
    this.sourceUrl = sourceUrl;
    this.sourceName = sourceName;
    this.confidenceScore = confidenceScore;
    this.sourceCount = sourceCount;
  }

  getSummary() {
    if (!this.description) return null;
    return this.description.length > 150 ? this.description.substring(0, 150) + '...' : this.description;
  }

  isValid() {
    return typeof this.title === 'string' && this.title.trim().length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      locationId: this.locationId,
      title: this.title,
      description: this.description,
      year: this.year,
      dateDisplay: this.dateDisplay,
      category: this.category,
      era: this.era,
      latitude: this.latitude,
      longitude: this.longitude,
      sourceUrl: this.sourceUrl,
      sourceName: this.sourceName,
      confidenceScore: this.confidenceScore,
      sourceCount: this.sourceCount,
      summary: this.getSummary(),
    };
  }
}

module.exports = HistoricalEvent;
