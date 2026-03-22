const WikipediaAdapter = require('../adapters/WikipediaAdapter');
const WikidataAdapter = require('../adapters/WikidataAdapter');
const GeoNamesAdapter = require('../adapters/GeoNamesAdapter');

class EventFactory {
  constructor() {
    this.adapters = new Map([
      ['Wikipedia', new WikipediaAdapter()],
      ['Wikidata',  new WikidataAdapter()],
      ['GeoNames',  new GeoNamesAdapter()]
    ]);
  }

  /**
   * Overrides or adds structural runtime adapters dynamically natively.
   */
  registerAdapter(sourceType, adapter) {
    this.adapters.set(sourceType, adapter);
  }

  /**
   * Exposes mapped instances accurately.
   */
  getAdapter(sourceType) {
    if (!this.adapters.has(sourceType)) return null;
    return this.adapters.get(sourceType);
  }

  /**
   * Executes adaptation pipeline automatically determining explicit Source interfaces natively.
   * Logs warnings resolving correctly back to null.
   * @param {Object} rawEvent 
   * @returns {HistoricalEvent|null}
   */
  createEvent(rawEvent) {
    if (!rawEvent || !rawEvent.sourceApiName) return null;
    
    const adapter = this.getAdapter(rawEvent.sourceApiName);
    
    // Boundary explicitly requested trapping unknown parameters elegantly
    if (!adapter) {
      console.warn(`⚠️ EventFactory Warning: No explicit adapter configured natively masking source => ${rawEvent.sourceApiName}`);
      return null;
    }

    try {
      return adapter.adapt(rawEvent);
    } catch (e) {
      console.error(`🔴 EventFactory structured mapping failed executing bounds against [${rawEvent.sourceApiName}]:`, e);
      return null;
    }
  }

  /**
   * Structurally maps arrays filtering seamlessly avoiding dirty lists dropping explicitly null validations.
   * @param {Object[]} rawEvents 
   * @returns {HistoricalEvent[]}
   */
  createEvents(rawEvents) {
    if (!Array.isArray(rawEvents)) return [];
    
    // Execute cleanly mapping explicit nodes into domains
    const derived = rawEvents.map(r => this.createEvent(r));
    
    // Scrub empty items correctly returning cleanly validated boundaries
    return derived.filter(e => e !== null);
  }
}

module.exports = new EventFactory();
