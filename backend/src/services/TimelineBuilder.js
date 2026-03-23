const Timeline = require('../models/Timeline');
const Era = require('../constants/Era');
const Category = require('../constants/Category');

class TimelineBuilder {
  /**
   * Safe extraction reliably pulling .year from unwrapped historical templates or structured ScoredEvents directly.
   */
  static getYear(e) {
    if (e && e.event) return e.event.year !== undefined ? e.event.year : null;
    if (e) return e.year !== undefined ? e.year : null;
    return null;
  }

  /**
   * Sorts algorithmically resolving null inputs exclusively mapping mathematically downwards enforcing DESC / ASC correctly.
   * @param {ScoredEvent[]} events 
   * @param {string} order 'ASC' or 'DESC'
   */
  static sortByDate(events, order = 'ASC') {
    if (!Array.isArray(events)) return [];
    
    return [...events].sort((a, b) => {
      const yearA = this.getYear(a);
      const yearB = this.getYear(b);

      // Null mapping rule enforces nulls explicitly resolve exactly to the end index sequentially ALWAYS.
      if (yearA === null && yearB === null) return 0;
      if (yearA === null) return 1;
      if (yearB === null) return -1;

      if (order.toUpperCase() === 'DESC') {
        return yearB - yearA; // Newest first
      }

      return yearA - yearB; // Oldest first
    });
  }

  /**
   * Explicitly organizes parameters explicitly conforming inside 6 hardcoded literal domains mapping natively.
   */
  static groupByEra(events) {
    const grouped = {
      [Era.ANCIENT]: [],
      [Era.MEDIEVAL]: [],
      [Era.COLONIAL]: [],
      [Era.MODERN]: [],
      [Era.CONTEMPORARY]: [],
      [Era.UNKNOWN]: []
    };

    if (!Array.isArray(events)) return grouped;

    for (const e of events) {
      const era = (e.event ? e.event.era : e.era) || Era.UNKNOWN;
      if (grouped[era]) {
        grouped[era].push(e);
      } else {
        grouped[Era.UNKNOWN].push(e);
      }
    }

    return grouped;
  }

  /**
   * Structurally maps 7 category mappings consistently correctly initializing empty lists per literal constants securely.
   */
  static groupByCategory(events) {
    const grouped = {
      [Category.WAR_BATTLE]: [],
      [Category.POLITICS]: [],
      [Category.SCIENCE_INNOVATION]: [],
      [Category.CULTURE_ART]: [],
      [Category.DISASTER]: [],
      [Category.FAMOUS_BIRTH_DEATH]: [],
      [Category.UNKNOWN]: []
    };

    if (!Array.isArray(events)) return grouped;

    for (const e of events) {
      const cat = (e.event ? e.event.category : e.category) || Category.UNKNOWN;
      if (grouped[cat]) {
        grouped[cat].push(e);
      } else {
        grouped[Category.UNKNOWN].push(e);
      }
    }

    return grouped;
  }

  /**
   * Primary entry point correctly normalizing logic into explicit Timeline outputs without altering immutable logic.
   * @param {ScoredEvent[]} events 
   * @param {Location} location 
   * @param {Object} options 
   * @returns {Timeline}
   */
  static build(events, location, options = {}) {
    const { sortOrder = 'ASC', groupBy = null } = options;
    const sorted = this.sortByDate(events, sortOrder);

    return new Timeline({
      location: location,
      events: sorted,
      sortOrder: sortOrder,
      groupBy: groupBy,
      generatedAt: new Date()
    });
  }
}

module.exports = TimelineBuilder;
