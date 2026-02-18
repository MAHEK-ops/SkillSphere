# Sequence Diagram - ChronoLens

## Main Flow: User Searches a Location → Gets Historical Timeline

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant LocationController
    participant LocationService
    participant GeocodingService
    participant CacheService
    participant EventAggregatorService
    participant WikipediaFetcher
    participant WikidataFetcher
    participant GeoNamesFetcher
    participant EventFactory
    participant CategorizationService
    participant ScoringService
    participant TimelineBuilder
    participant DB as PostgreSQL + PostGIS

    User->>Frontend: Enter address "Pune, India" + radius 10km
    Frontend->>LocationController: POST /api/timeline { address, radius }

    LocationController->>LocationService: resolveLocation("Pune, India")
    LocationService->>GeocodingService: geocode("Pune, India")
    GeocodingService->>GeocodingService: call Nominatim API
    GeocodingService-->>LocationService: { lat: 18.52, lng: 73.85, placeName: "Pune" }
    LocationService-->>LocationController: Location object

    LocationController->>CacheService: get("18.52_73.85_10km")

    alt Cache HIT
        CacheService-->>LocationController: Cached Timeline (Redis)
        LocationController-->>Frontend: 200 OK { timeline }
        Frontend-->>User: Display Timeline instantly
    else Cache MISS
        CacheService-->>LocationController: null

        LocationController->>EventAggregatorService: aggregate(location, radius)

        par Fetch Wikipedia
            EventAggregatorService->>WikipediaFetcher: fetchByCoordinates(18.52, 73.85, 10)
            WikipediaFetcher->>WikipediaFetcher: call Wikipedia GeoSearch API
            WikipediaFetcher-->>EventAggregatorService: List of RawEvents
        and Fetch Wikidata
            EventAggregatorService->>WikidataFetcher: fetchByCoordinates(18.52, 73.85, 10)
            WikidataFetcher->>WikidataFetcher: execute SPARQL query
            WikidataFetcher-->>EventAggregatorService: List of RawEvents
        and Fetch GeoNames
            EventAggregatorService->>GeoNamesFetcher: fetchByCoordinates(18.52, 73.85, 10)
            GeoNamesFetcher->>GeoNamesFetcher: call GeoNames API
            GeoNamesFetcher-->>EventAggregatorService: List of RawEvents
        end

        EventAggregatorService->>EventAggregatorService: merge + deduplicate all raw events

        EventAggregatorService->>EventFactory: createEvents(mergedRawEvents)
        EventFactory->>EventFactory: pick correct Adapter per source
        EventFactory->>EventFactory: normalize each RawEvent → HistoricalEvent
        EventFactory-->>EventAggregatorService: List of HistoricalEvents

        EventAggregatorService->>CategorizationService: categorize(events)
        CategorizationService->>CategorizationService: keyword matching → assign Category + Era
        CategorizationService-->>EventAggregatorService: events with categories

        EventAggregatorService->>ScoringService: score(events)
        ScoringService->>ScoringService: calculate confidence per event
        ScoringService-->>EventAggregatorService: List of ScoredEvents

        EventAggregatorService-->>LocationController: List of ScoredEvents

        LocationController->>TimelineBuilder: build(events, sortOrder, groupBy)
        TimelineBuilder-->>LocationController: Timeline object

        LocationController->>DB: save location + events (upsert)
        LocationController->>CacheService: set("18.52_73.85_10km", timeline, TTL=1hr)

        LocationController-->>Frontend: 200 OK { timeline }
        Frontend-->>User: Show timeline list + map pins
    end
```

---

## Secondary Flow: Filter Events Within a Timeline

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant EventController
    participant EventService
    participant DB as PostgreSQL

    User->>Frontend: Select filter - Category: WAR, Era: MEDIEVAL
    Frontend->>EventController: GET /api/events?locationId=42&category=WAR&era=MEDIEVAL

    EventController->>EventService: getFilteredEvents(locationId, filters)
    EventService->>DB: SELECT * FROM events WHERE location_id=42 AND category='WAR' AND era='MEDIEVAL' ORDER BY year ASC
    DB-->>EventService: filtered event rows
    EventService-->>EventController: List of HistoricalEvents
    EventController-->>Frontend: 200 OK { events }
    Frontend-->>User: Timeline updates in place
```

---

## Secondary Flow: Map Viewport Fetch (PostGIS)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant EventController
    participant EventService
    participant DB as PostgreSQL + PostGIS

    User->>Frontend: Pan the map to a new area
    Frontend->>EventController: GET /api/events/viewport?north=19.0&south=18.0&east=74.5&west=73.0

    EventController->>EventService: getEventsInViewport(bbox)
    EventService->>DB: SELECT * FROM events WHERE ST_Within(coordinates, ST_MakeEnvelope(73.0, 18.0, 74.5, 19.0, 4326))
    DB-->>EventService: events within bounding box
    EventService-->>EventController: List of events
    EventController-->>Frontend: 200 OK { events }
    Frontend-->>User: New pins appear on map
```

---

## Flow Design Decisions

| Decision | Reason |
|---|---|
| Parallel fetching with `Promise.all` | All 3 fetchers run concurrently - faster than sequential calls |
| Cache checked before any external call | Avoids all API calls for repeated locations |
| Graceful degradation | Each fetcher is wrapped in try/catch - if one fails, aggregator logs it and continues with the rest |
| Deduplication before extraction | Removes duplicate raw events first so the extraction step does less work |
| PostGIS for viewport fetch | Spatial query in DB is far more efficient than fetching all events and filtering in Node.js |