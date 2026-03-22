const HistoricalEvent = require('../models/HistoricalEvent');
const Category = require('../constants/Category');
const Era = require('../constants/Era');

class WikidataAdapter {
  /**
   * Safely interpolates "1857-05-10T00:00:00Z" strings accurately parsing cleanly resolving back Integers.
   */
  parseDateToYear(isoDate) {
    if (!isoDate) return null;
    const d = new Date(isoDate);
    if (!isNaN(d.getTime())) return d.getUTCFullYear();
    
    // Strict regex fallback ensuring pure string patterns map correctly if JS Datetime faults
    const match = isoDate.toString().match(/^(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Cleans ugly SPARQL identifier payloads parsing out mapping "(Q12345)" artifacts sequentially.
   */
  cleanLabel(label) {
    if (!label) return 'Untitled Event';
    return label.replace(/\s*\(Q\d+\)$/i, '').trim() || 'Untitled Event';
  }

  adapt(rawEvent) {
    try {
      let rawTitle = this.cleanLabel(rawEvent.rawTitle);
      const cleanTitle = rawTitle.length > 200 ? rawTitle.substring(0, 197) + '...' : rawTitle;
      
      let description = rawEvent.rawDescription || null;
      if (description && description.length > 500) {
        description = description.substring(0, 497) + '...';
      }

      const year = this.parseDateToYear(rawEvent.rawDate);

      let sourceUrl = null;
      if (rawEvent.metadata && rawEvent.metadata.uri) {
        sourceUrl = rawEvent.metadata.uri;
      }

      return new HistoricalEvent({
        title: cleanTitle,
        description: description,
        year: year,
        latitude: rawEvent.rawLat !== undefined ? rawEvent.rawLat : null,
        longitude: rawEvent.rawLng !== undefined ? rawEvent.rawLng : null,
        sourceUrl: sourceUrl,
        sourceName: rawEvent.sourceApiName || 'Wikidata',
        category: Category.UNKNOWN,
        era: Era.UNKNOWN,
        confidenceScore: 0,
        sourceCount: 1
      });
    } catch (e) {
      console.error('⚠️ WikidataAdapter caught unhandled fault mapped cleanly:', e);
      return new HistoricalEvent({ title: 'Untitled Event', sourceName: 'Wikidata' });
    }
  }
}

module.exports = WikidataAdapter;
