const HistoricalEventFetcher = require('./HistoricalEventFetcher');
const RawEvent = require('../models/RawEvent');

class WikipediaFetcher extends HistoricalEventFetcher {
  constructor(source) {
    super(source);
    // Bind explicit Wikipedia User-Agent constraint dynamically to the axios configuration mapped by strategy super
    this.axiosInstance.defaults.headers.common['User-Agent'] = 'ChronoLens/1.0';
    this.API_URL = 'https://en.wikipedia.org/w/api.php';
  }

  /**
   * Invokes 2-part extraction from Wikipedia seamlessly limiting explicit bounds preventing timeout blocks.
   * @param {number} lat 
   * @param {number} lng 
   * @param {number} radiusKm 
   * @returns {Promise<RawEvent[]>}
   */
  async fetchByCoordinates(lat, lng, radiusKm) {
    if (!this.isAvailable()) return [];

    try {
      // Step 1: Perform the bounding geo-box boundary search locating relevant Page IDs natively
      const geoParams = {
        action: 'query',
        list: 'geosearch',
        gscoord: `${lat}|${lng}`,
        gsradius: Math.floor(radiusKm * 1000), // Enforce metrics in meters mathematically
        gslimit: 50,
        format: 'json'
      };

      const geoData = await this.fetchWithRetry(this.API_URL, geoParams);
      
      const geosearch = geoData?.query?.geosearch;
      if (!geosearch || !Array.isArray(geosearch) || geosearch.length === 0) {
        return [];
      }

      // Security Constraint: Cap absolute process load limiting purely down to 30 instances total
      const pageIds = geosearch.map(g => g.pageid).slice(0, 30);
      
      // Wikipedia restricts "pageids" param blocks locally. Slice to iterations of exactly 10.
      const chunks = [];
      for (let i = 0; i < pageIds.length; i += 10) {
        chunks.push(pageIds.slice(i, i + 10));
      }

      const rawEvents = [];
      
      // Step 2: Cascade and hydrate explicit contextual elements (extracts, categories)
      for (const chunk of chunks) {
        const detailParams = {
          action: 'query',
          pageids: chunk.join('|'),
          prop: 'extracts|coordinates|categories',
          exintro: true,
          explaintext: true, // Only return raw formatting (stripping out Wikipedia HTML blocks)
          format: 'json'
        };

        const detailData = await this.fetchWithRetry(this.API_URL, detailParams);
        const pages = detailData?.query?.pages;

        if (pages) {
          for (const pageId of Object.keys(pages)) {
            const page = pages[pageId];
            
            // Validation: Skip meaningless unmapped results immediately per criteria!
            if (!page.extract || page.extract.trim() === '') {
              continue;
            }

            let pLat = null;
            let pLng = null;
            if (page.coordinates && Array.isArray(page.coordinates) && page.coordinates.length > 0) {
              pLat = parseFloat(page.coordinates[0].lat);
              pLng = parseFloat(page.coordinates[0].lon);
            }

            const cats = (page.categories || []).map(c => c.title);

            const rawEvent = new RawEvent({
              rawTitle: page.title,
              rawDescription: page.extract.trim(),
              rawDate: null, 
              rawLat: pLat,
              rawLng: pLng,
              sourceApiName: 'Wikipedia',
              metadata: {
                pageId: page.pageid,
                categories: cats
              }
            });

            rawEvents.push(rawEvent);
          }
        }
      }

      return rawEvents;

    } catch (error) {
      // Catch exceptions silently routing to secure logging returning [] exactly per requirements preventing downtime.
      console.error(`🔴 WikipediaFetcher extraction failed structurally for bounds [${lat}, ${lng}]:`, error.message);
      return [];
    }
  }

  /**
   * Inherited bypass interface requirement natively.
   */
  parseResponse(data) {
    return data;
  }
}

module.exports = WikipediaFetcher;
