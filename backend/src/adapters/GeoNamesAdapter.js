const extractYear = require('../utils/extractYear');
const HistoricalEvent = require('../models/HistoricalEvent');
const Category = require('../constants/Category');
const Era = require('../constants/Era');

class GeoNamesAdapter {
  parseYear(text) {
    return extractYear(text);
  }

  adapt(rawEvent) {
    try {
      const rawTitle = rawEvent.rawTitle || 'Untitled Event';
      const cleanTitle = rawTitle.length > 200 ? rawTitle.substring(0, 197) + '...' : rawTitle;
      
      let description = rawEvent.rawDescription || null;
      if (description && description.length > 500) {
        description = description.substring(0, 497) + '...';
      }

      const year = this.parseYear(description);

      let sourceUrl = null;
      if (rawEvent.metadata && rawEvent.metadata.wikipediaUrl) {
        sourceUrl = rawEvent.metadata.wikipediaUrl;
        if (sourceUrl && sourceUrl.startsWith('http://')) {
            sourceUrl = sourceUrl.replace('http://', 'https://');
        } else if (sourceUrl && !sourceUrl.startsWith('http')) {
            sourceUrl = 'https://' + sourceUrl;
        }
      }

      return new HistoricalEvent({
        title: cleanTitle,
        description: description,
        year: year,
        latitude: rawEvent.rawLat !== undefined ? rawEvent.rawLat : null,
        longitude: rawEvent.rawLng !== undefined ? rawEvent.rawLng : null,
        sourceUrl: sourceUrl,
        sourceName: rawEvent.sourceApiName || 'GeoNames',
        category: Category.UNKNOWN,
        era: Era.UNKNOWN,
        confidenceScore: 0,
        sourceCount: 1
      });
    } catch (e) {
      console.error('⚠️ GeoNamesAdapter caught unhandled fault mapped cleanly:', e);
      return new HistoricalEvent({ title: 'Untitled Event', sourceName: 'GeoNames' });
    }
  }
}

module.exports = GeoNamesAdapter;
