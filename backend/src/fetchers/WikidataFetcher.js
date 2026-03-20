const HistoricalEventFetcher = require('./HistoricalEventFetcher');
const RawEvent = require('../models/RawEvent');

class WikidataFetcher extends HistoricalEventFetcher {
  constructor(source) {
    super(source);
    // Explicitly configure headers required universally by Wikidata's strict SPARQL server
    this.axiosInstance.defaults.headers.common['User-Agent'] = 'ChronoLens/1.0';
    this.axiosInstance.defaults.headers.common['Accept'] = 'application/sparql-results+json';
    this.API_URL = 'https://query.wikidata.org/sparql';
  }

  /**
   * Helper extracting GPS structures efficiently using regex constraints securely.
   * Parse WKT: "Point(73.85 18.52)" → { lng: 73.85, lat: 18.52 }
   */
  parseWkt(wkt) {
    if (!wkt) return null;
    const match = wkt.match(/Point\(([^ ]+) ([^)]+)\)/);
    return match ? { lng: parseFloat(match[1]), lat: parseFloat(match[2]) } : null;
  }

  /**
   * Translates exact geocoordinates dynamically bridging to native Wikidata mappings.
   * @param {number} lat 
   * @param {number} lng 
   * @param {number} radiusKm 
   * @returns {Promise<RawEvent[]>}
   */
  async fetchByCoordinates(lat, lng, radiusKm) {
    if (!this.isAvailable()) return [];

    const query = `
      SELECT ?event ?eventLabel ?date ?coords ?description WHERE {
        SERVICE wikibase:around {
          ?event wdt:P625 ?coords .
          bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral .
          bd:serviceParam wikibase:radius "${radiusKm}" .
        }
        OPTIONAL { ?event wdt:P585 ?date. }
        OPTIONAL { ?event schema:description ?description FILTER(LANG(?description) = "en") }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 50
    `;

    try {
      // Leverages the exponential backoff architecture internally programmed in the Strategy class
      const data = await this.fetchWithRetry(this.API_URL, { query });
      return this.parseResponse(data);
    } catch (err) {
      console.error(`🔴 WikidataFetcher failed fetching events for [${lat}, ${lng}]:`, err.message);
      return [];
    }
  }

  /**
   * Validates internal structure explicitly translating array constraints natively minimizing unmapped entity identifiers linearly.
   */
  parseResponse(data) {
    if (!data || !data.results || !Array.isArray(data.results.bindings)) {
      return [];
    }

    const bindings = data.results.bindings;
    const rawEvents = [];

    for (const b of bindings) {
      const title = b.eventLabel?.value || null;
      
      // Skip empty or purely URI-named items (which means Wikidata holds no label correctly natively)
      if (!title || title.startsWith('http://')) continue;

      const description = b.description?.value || null;
      const dateStr = b.date?.value || null; // Natively captures ISO-8601 values explicitly
      const coordsStr = b.coords?.value || null;
      const eventUri = b.event?.value || null;
      
      let pLat = null;
      let pLng = null;
      const parsedCoords = this.parseWkt(coordsStr);
      if (parsedCoords) {
        pLat = parsedCoords.lat;
        pLng = parsedCoords.lng;
      }

      const rawEvent = new RawEvent({
        rawTitle: title,
        rawDescription: description,
        rawDate: dateStr, 
        rawLat: pLat,
        rawLng: pLng,
        sourceApiName: 'Wikidata',
        metadata: {
          uri: eventUri
        }
      });

      rawEvents.push(rawEvent);
    }

    return rawEvents;
  }
}

module.exports = WikidataFetcher;
