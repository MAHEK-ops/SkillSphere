# ChronoLens

> Drop a pin anywhere on Earth. See what history happened there.

ChronoLens takes a location — an address, a city, or raw GPS coordinates — and returns a structured historical timeline of events that occurred at or near that place. It pulls from multiple open data sources, cleans and merges the results, categorizes each event, and scores them by confidence.

On the frontend, events appear as pins on an interactive map. Click a pin, read the event. Pan the map, new events load for the visible area. Filter by era, category, or keyword. Read the timeline as a narrative. Bookmark places. Compare two locations side by side.

---

## Prerequisites

- Node.js v18+
- PostgreSQL v14+ with PostGIS extension enabled
- Redis v6+
- A free [GeoNames account](http://www.geonames.org/login) for the GeoNames API username

---

## Setup

**1. Clone the repository**
```bash
git clone https://github.com/MAHEK-ops/ChronoLens.git
cd ChronoLens
```

**2. Install backend dependencies**
```bash
cd backend
npm install
cp .env.example .env
```
Fill in your credentials in `.env` — see the environment variables section below.

**3. Run database migrations**
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

**4. Add PostGIS spatial columns**
```bash
npm run migrate:postgis
```

**5. Install frontend dependencies**
```bash
cd ../frontend
npm install
cp .env.example .env
```
Set `VITE_API_BASE_URL=http://localhost:3000/api` in `frontend/.env`.

**6. Start both servers**

Terminal 1 — backend:
```bash
cd backend
npm run dev
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev
```

Backend runs at `http://localhost:3000`. Frontend runs at `http://localhost:5173`.

---

## Environment Variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | API port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string — `postgresql://user:password@localhost:5432/chronolens` |
| `REDIS_URL` | Redis connection string — `redis://localhost:6379` |
| `GEONAMES_USERNAME` | Your GeoNames account username |
| `NODE_ENV` | Set to `production` to suppress stack traces in error responses |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (default: `http://localhost:3000/api`) |

---

## How It Works

1. User enters an address or drops a pin on the map
2. Backend geocodes the address to coordinates via Nominatim
3. Cache is checked — if this location was searched before, return instantly from Redis
4. If not cached, three fetchers run in parallel — Wikipedia, Wikidata, GeoNames
5. Raw results are merged and deduplicated
6. Each event is extracted into a structured object (title, year, description, coordinates)
7. Events are categorized and assigned an era
8. Each event gets a confidence score based on source count and reliability weight
9. Timeline is built, cached in Redis, saved to PostgreSQL
10. Frontend renders the timeline list and map pins simultaneously

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma |
| Cache | Redis |
| HTTP Client | Axios |
| Frontend | React.js |
| Map | React Leaflet |

---

## Architecture

```
Controllers  →  Services  →  Repositories  →  PostgreSQL + PostGIS
                   |
             External APIs
     (Wikipedia · Wikidata · GeoNames · Nominatim)
```

**Controllers** handle incoming HTTP requests and send responses. No logic lives here.

**Services** hold all business logic — aggregation, deduplication, categorization, scoring, caching. Design patterns are applied here.

**Repositories** are the only layer that talks to the database. Everything goes through Prisma.

---

## Features

**Core**
- Location input via address or GPS coordinates
- Geocoding and reverse geocoding via Nominatim
- Multi-source aggregation — Wikipedia, Wikidata, GeoNames running in parallel
- Deduplication using title similarity and coordinate proximity
- Event extraction — title, year, description, coordinates
- Auto-categorization — War/Battle, Politics, Science, Culture, Disaster, Births/Deaths
- Era classification — Ancient, Medieval, Colonial, Modern, Contemporary
- Confidence scoring per event based on source reliability and data completeness
- Chronological timeline with sort and group options
- Filter by category, era, keyword, year range
- Redis caching — repeated searches return instantly
- Graceful degradation — if one API is down, the others continue

**Advanced**
- Interactive map with clustered event pins (React Leaflet)
- Viewport-aware loading — PostGIS `ST_Within` fetches only events visible on screen
- Radius search — PostGIS `ST_DWithin` for precise km-based queries
- Story mode — timeline narrated as a readable historical paragraph
- Bookmark locations
- Compare two locations side by side with richness scores
- Trend analysis — category and era breakdown per location

---

## Design Patterns

| Pattern | Where it is used |
|---|---|
| **Strategy** | `WikipediaFetcher`, `WikidataFetcher`, `GeoNamesFetcher` all extend `HistoricalEventFetcher` — swappable at runtime |
| **Adapter** | Each API returns different JSON — adapters normalize all of them into one `HistoricalEvent` shape |
| **Factory** | `EventFactory` creates event objects from raw data, picks the correct adapter automatically |
| **Decorator** | `ScoredEvent` wraps `HistoricalEvent` and adds a confidence score without modifying the base class |
| **Template Method** | Base fetcher defines the pipeline (build params → call API → parse) — subclasses override only what differs |

---

## API Reference

All endpoints are prefixed with `/api`.

### `POST /api/timeline`
Get the historical timeline for a location.

```json
// request
{ "address": "Pune", "radiusKm": 10, "sortOrder": "ASC" }

// response
{
  "success": true,
  "cached": false,
  "location": { "id": 1, "placeName": "Pune", "latitude": 18.5204, "longitude": 73.8567 },
  "timeline": {
    "totalCount": 24,
    "dominantCategory": "WAR_BATTLE",
    "generatedAt": "2026-04-20T10:00:00.000Z",
    "events": [
      {
        "id": 5,
        "title": "Battle of Poona",
        "year": 1817,
        "category": "WAR_BATTLE",
        "era": "MODERN",
        "description": "The Battle of Poona occurred during...",
        "confidenceScore": 89.2
      }
    ]
  }
}
```

### `GET /api/timeline/:locationId/story`
Get the timeline as a readable historical narrative.

```json
// response
{
  "success": true,
  "locationId": 1,
  "placeName": "Pune",
  "story": "Pune has a recorded history spanning 356 years, with 25 significant events documented across 4 domains. Militarily, the region saw 12 conflicts. The earliest was 'Siege of Purandar' in 1665..."
}
```

### `GET /api/events`
Get filtered events for a saved location.

```
GET /api/events?locationId=1&category=WAR_BATTLE&era=MODERN&keyword=battle&yearFrom=1600&yearTo=1900&sortOrder=DESC
```

```json
// response
{ "success": true, "count": 5, "events": [...] }
```

### `GET /api/events/viewport`
Get events within a map bounding box (used when panning the map).

```
GET /api/events/viewport?north=19.123&south=18.012&east=74.321&west=72.829
```

```json
// response
{ "success": true, "count": 15, "events": [...] }
```

### `GET /api/compare`
Compare the historical richness of two saved locations.

```
GET /api/compare?location1=1&location2=2
```

```json
// response
{
  "success": true,
  "comparison": {
    "location1": {
      "placeName": "Pune", "totalEvents": 24,
      "dominantCategory": "WAR_BATTLE", "dominantEra": "MODERN",
      "categoryBreakdown": { "WAR_BATTLE": 10, "POLITICS": 6 },
      "averageConfidenceScore": 71.4, "richnessScore": 82
    },
    "location2": {
      "placeName": "Mumbai", "totalEvents": 50,
      "dominantCategory": "CULTURE_ART", "dominantEra": "MODERN",
      "categoryBreakdown": { "CULTURE_ART": 20, "POLITICS": 18 },
      "averageConfidenceScore": 78.5, "richnessScore": 95
    }
  }
}
```

### `GET /api/trends/:locationId`
Get category and era breakdown for a location.

```json
// response
{
  "success": true,
  "locationId": 1,
  "placeName": "Pune",
  "dominantCategory": "WAR_BATTLE",
  "dominantEra": "MODERN",
  "categoryBreakdown": [{ "category": "WAR_BATTLE", "count": 10, "percentage": 41.7 }],
  "eraBreakdown": [{ "era": "MODERN", "count": 12, "percentage": 50.0 }],
  "timespan": { "earliest": 1192, "latest": 1947, "spanYears": 755 }
}
```

### Bookmarks — `POST` / `GET` / `DELETE`

```json
// POST /api/bookmarks
{ "userId": 1, "locationId": 12, "label": "Vacation Spot" }

// GET /api/bookmarks/1
{
  "success": true,
  "bookmarks": [
    {
      "id": 5, "label": "Vacation Spot", "savedAt": "2026-04-20T10:00:00.000Z",
      "location": { "placeName": "Kyoto", "latitude": 35.0116, "longitude": 135.7681 }
    }
  ]
}

// DELETE /api/bookmarks/5
// body: { "userId": 1 }
{ "success": true, "message": "Bookmark deleted successfully." }
```

---

## Project Structure

```
ChronoLens/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── src/
│       ├── adapters/          <- normalize each API response (Adapter Pattern)
│       ├── constants/         <- Category and Era enums
│       ├── controllers/       <- request/response handling
│       ├── db/                <- Prisma client, Redis client
│       ├── factory/           <- EventFactory (Factory Pattern)
│       ├── fetchers/          <- Wikipedia, Wikidata, GeoNames (Strategy Pattern)
│       ├── middleware/        <- error handler, rate limiter, validation
│       ├── models/            <- domain classes (Location, HistoricalEvent, etc.)
│       ├── repositories/      <- all database access
│       ├── routes/            <- Express route bindings
│       ├── services/          <- business logic
│       ├── utils/             <- AppError, extractYear, eraFromYear
│       ├── validation/        <- Joi schemas
│       └── app.js
├── frontend/
│   └── src/
│       ├── api/               <- Axios client and endpoint functions
│       ├── components/
│       │   ├── EventCard/
│       │   ├── Filters/
│       │   ├── Map/
│       │   ├── SearchBar/
│       │   └── Timeline/
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Compare.jsx
│       │   └── Bookmarks.jsx
│       ├── App.jsx
│       └── main.jsx
├── idea.md
├── useCaseDiagram.md
├── sequenceDiagram.md
├── classDiagram.md
├── ErDiagram.md
└── README.md
```

---

## Diagrams

| Diagram | File |
|---|---|
| Use Case | [useCaseDiagram.md](./useCaseDiagram.md) |
| Sequence | [sequenceDiagram.md](./sequenceDiagram.md) |
| Class | [classDiagram.md](./classDiagram.md) |
| ER | [ErDiagram.md](./ErDiagram.md) |

---

## Screenshots

*Will be added after deployment.*