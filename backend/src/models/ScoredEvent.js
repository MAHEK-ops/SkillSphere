class ScoredEvent {
  constructor({ event = null, confidenceScore = 0, sourceCount = 1, contributingSources = [] } = {}) {
    this.event = event;
    this.confidenceScore = confidenceScore;
    this.sourceCount = sourceCount;
    this.contributingSources = contributingSources;
  }

  getEvent() {
    return this.event;
  }

  getScore() {
    return this.confidenceScore;
  }

  toJSON() {
    const eventData = this.event && typeof this.event.toJSON === 'function' ? this.event.toJSON() : this.event || {};
    return {
      ...eventData,
      confidenceScore: this.confidenceScore,
      sourceCount: this.sourceCount,
      contributingSources: this.contributingSources,
    };
  }
}

module.exports = ScoredEvent;
