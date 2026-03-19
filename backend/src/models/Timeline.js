class Timeline {
  constructor({ location = null, events = [], sortOrder = 'ASC', groupBy = null, generatedAt = null } = {}) {
    this.location = location;
    this.events = events;
    this.sortOrder = sortOrder;
    this.groupBy = groupBy;
    this.generatedAt = generatedAt || new Date();
  }

  getByCategory(category) {
    if (!this.events || !Array.isArray(this.events)) return [];
    // Accommodate ScoredEvents which flatten cleanly OR HistoricalEvents directly
    return this.events.filter((e) => {
      const cat = e.event ? e.event.category : e.category;
      return cat === category;
    });
  }

  getByEra(era) {
    if (!this.events || !Array.isArray(this.events)) return [];
    return this.events.filter((e) => {
      const eEra = e.event ? e.event.era : e.era;
      return eEra === era;
    });
  }

  getTotalCount() {
    return Array.isArray(this.events) ? this.events.length : 0;
  }

  getDominantCategory() {
    if (!this.events || !Array.isArray(this.events) || this.events.length === 0) return null;

    const counts = {};
    for (const e of this.events) {
      const cat = e.event ? e.event.category : e.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    let dominant = null;
    let max = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        dominant = cat;
      }
    }
    return dominant;
  }

  toJSON() {
    const locData = this.location && typeof this.location.toJSON === 'function' ? this.location.toJSON() : this.location;
    const evData = Array.isArray(this.events)
      ? this.events.map((e) => (typeof e.toJSON === 'function' ? e.toJSON() : e))
      : [];

    return {
      location: locData,
      generatedAt: this.generatedAt,
      totalCount: this.getTotalCount(),
      dominantCategory: this.getDominantCategory(),
      sortOrder: this.sortOrder,
      groupBy: this.groupBy,
      events: evData,
    };
  }
}

module.exports = Timeline;
