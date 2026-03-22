const extractYear = require('../utils/extractYear');
const HistoricalEvent = require('../models/HistoricalEvent');
const Category = require('../constants/Category');
const Era = require('../constants/Era');

class WikipediaAdapter {
  parseYear(text) {
    return extractYear(text);
  }

  cleanDescription(text) {
    if (!text) return null;
    // Strip possible standard HTML artifacts mapping strictly to 500 capacity
    let clean = text.replace(/<[^>]+>/g, '').trim();
    if (clean.length > 500) {
      clean = clean.substring(0, 497) + '...';
    }
    return clean;
  }

  adapt(rawEvent) {
    try {
      const rawTitle = rawEvent.rawTitle || 'Untitled Event';
      const cleanTitle = rawTitle.length > 200 ? rawTitle.substring(0, 197) + '...' : rawTitle;
      const description = this.cleanDescription(rawEvent.rawDescription);
      
      // Wikipedia extraction derives historical bounds organically scanning its own mapped description strings natively
      const year = this.parseYear(description);

      // Interpolate Wikipedia exact standard domain pointer implicitly
      let sourceUrl = null;
      if (rawEvent.metadata && rawEvent.metadata.pageId) {
        sourceUrl = `https://en.wikipedia.org/?curid=${rawEvent.metadata.pageId}`;
      }

      return new HistoricalEvent({
        title: cleanTitle,
        description: description || null,
        year: year,
        latitude: rawEvent.rawLat !== undefined ? rawEvent.rawLat : null,
        longitude: rawEvent.rawLng !== undefined ? rawEvent.rawLng : null,
        sourceUrl: sourceUrl,
        sourceName: rawEvent.sourceApiName || 'Wikipedia',
        category: Category.UNKNOWN,
        era: Era.UNKNOWN,
        confidenceScore: 0,
        sourceCount: 1
      });
    } catch (e) {
      // Gracefully map error fallback preventing node termination natively
      console.error('⚠️ WikipediaAdapter caught unhandled fault mapped cleanly:', e);
      return new HistoricalEvent({ title: 'Untitled Event', sourceName: 'Wikipedia' });
    }
  }
}

module.exports = WikipediaAdapter;
