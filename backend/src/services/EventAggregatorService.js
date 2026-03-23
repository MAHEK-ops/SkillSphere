class EventAggregatorService {
  /**
   * Initializes the central orchestrator aggregating domains across independent API structures.
   */
  constructor(fetchers = [], eventFactory, deduplicationService, categorizationService, scoringService) {
    this.fetchers = fetchers;
    this.eventFactory = eventFactory;
    this.deduplicationService = deduplicationService;
    this.categorizationService = categorizationService;
    this.scoringService = scoringService;
  }

  /**
   * Processes arrays recursively hitting isolated endpoints running heavily parallel iterations natively cleanly!
   * @param {Location} location 
   * @param {number} radiusKm 
   * @returns {Promise<RawEvent[]>}
   */
  async fetchAll(location, radiusKm) {
    const promises = this.fetchers.map(fetcher => 
      fetcher.fetchByCoordinates(location.latitude, location.longitude, radiusKm)
    );

    const results = await Promise.allSettled(promises);

    const rawEvents = [];
    let successCount = 0;
    let failCount = 0;

    results.forEach((res, index) => {
      const fetcherName = this.fetchers[index].constructor.name || `Fetcher_${index}`;
      
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        successCount++;
        rawEvents.push(...res.value);
        console.log(`✅ [${fetcherName}] succeeded targeting ${res.value.length} events natively.`);
      } else {
        failCount++;
        const reason = res.reason ? res.reason.message : 'Unknown rejection';
        console.warn(`⚠️ [${fetcherName}] explicitly fault explicitly blocked natively: ${reason}`);
      }
    });

    console.log(`📡 FetchAll Execution Completed: ${successCount} successfully matched endpoints vs ${failCount} faults.`);

    if (successCount === 0 && this.fetchers.length > 0) {
      throw new Error('All data sources failed. Please try again.');
    }

    return rawEvents;
  }

  /**
   * Translates unorganized payload parameters structuring exact sequences chronologically.
   * Pipeline rules: Fetch -> Dedupe -> ObjectMap -> Categorize -> Score -> Filter(<20)
   * @param {Location} location 
   * @param {number} radiusKm 
   */
  async aggregate(location, radiusKm) {
    if (!location || location.latitude == null || location.longitude == null) {
        throw new Error('Valid Location coordinates required reliably for aggregations natively expected');
    }

    console.log('🔄 Starting Event Aggregation Pipeline...');

    // 1. Parallel structural extractions
    const allRaw = await this.fetchAll(location, radiusKm);
    console.log(`✅ Pipeline Phase 1: Fetched ${allRaw.length} raw datasets.`);

    // 2. Deduplication scaling structural redundancies
    const dedupedRaw = this.deduplicationService.deduplicate(allRaw);
    console.log(`✅ Pipeline Phase 2: Deduplication constrained array targeting ${dedupedRaw.length} distinct results securely.`);

    // 3. Normalization tracking JSON back resolving natively to internal logic models
    const historicalEvents = this.eventFactory.createEvents(dedupedRaw);
    console.log(`✅ Pipeline Phase 3: Constructed ${historicalEvents.length} distinct HistoricalEvent domains.`);

    // 4. Intelligence binding arrays seamlessly converting matching textual boundaries explicitly dynamically
    const categorized = this.categorizationService.categorize(historicalEvents);
    console.log('✅ Pipeline Phase 4: Categorizations mapping seamlessly executed arrays identically.');

    // 5. Quantitative Analytics isolating scoring logic predictably explicitly!
    const scoredOptions = this.scoringService.score(categorized);
    console.log('✅ Pipeline Phase 5: Confidence weights structurally calculated efficiently.');

    // 6. Execution Limit Filtering (< 20 dropping directly dynamically mapping)
    const finalEvents = scoredOptions.filter(se => se.confidenceScore >= 20);
    const droppedCount = scoredOptions.length - finalEvents.length;
    
    console.log(`🧹 Aggregation Complete: Filtered down ${droppedCount} arrays (Score < 20). Returns exactly ${finalEvents.length} top-tier instances flawlessly!`);
    
    return finalEvents;
  }
}

module.exports = EventAggregatorService;
