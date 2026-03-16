# ChronoLens

> Drop a pin anywhere on Earth. See what history happened there.

ChronoLens takes a location - an address, a city, or raw GPS coordinates - and returns a structured historical timeline of events that occurred at or near that place. It pulls from multiple open data sources, cleans and merges the results, categorizes each event, and scores them by confidence.

On the frontend, events appear as pins on an interactive map. Click a pin, read the event. Pan the map, new events load for the visible area. Filter by era, category, or keyword. Read the timeline as a narrative. Bookmark places. Compare two locations side by side.

---

## Demo

> Coming soon - screenshots and live link will be added after deployment.

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

The backend follows a strict layered structure - no layer reaches past its neighbor.

```
Controllers  →  Services  →  Repositories  →  PostgreSQL + PostGIS
                   ↓
             External APIs
     (Wikipedia · Wikidata · GeoNames · Nominatim)
```

**Controllers** handle incoming HTTP requests and send responses. They don't contain logic.

**Services** hold all the business logic - aggregation, deduplication, categorization, scoring, caching. This is where the design patterns live.

**Repositories** are the only layer that talks to the database. Everything goes through Prisma.

---

## How It Works

1. User enters an address or drops a pin on the map
2. Backend geocodes the address to coordinates (Nominatim)
3. Cache is checked - if this location was searched before, return instantly
4. If not cached, three fetchers run in parallel - Wikipedia, Wikidata, GeoNames
5. Raw results are merged and deduplicated
6. Each event is extracted into a structured object (title, year, description, coordinates)
7. Events are categorized (war, science, culture, disaster, etc.) and assigned an era
8. Each event gets a confidence score based on how many sources confirmed it
9. Timeline is built, sorted, cached in Redis, saved to PostgreSQL
10. Frontend renders the timeline list + map pins simultaneously

---

## Data Sources

All free. No billing. No API keys required for core features.

| Source | What it provides |
|---|---|
| Wikipedia GeoSearch | Articles and summaries near a coordinate |
| Wikidata SPARQL | Structured events with dates, categories, coordinates |
| GeoNames | Georeferenced entries across 240 languages |
| Nominatim (OSM) | Address → coordinates, coordinates → place name |

---

## Features

**Core**
- Location input via address or GPS coordinates
- Geocoding and reverse geocoding
- Multi-source data aggregation with 3 APIs running in parallel
- Deduplication and normalization
- Event extraction - title, year, description, location
- Auto-categorization - War/Battle, Politics, Science, Culture, Disaster, Births/Deaths
- Era classification - Ancient, Medieval, Colonial, Modern, Contemporary
- Confidence scoring per event
- Chronological timeline with sort and group options
- Filter by category, era, keyword
- Redis caching - repeated searches return instantly
- Graceful degradation - if one API is down, the rest continue

**Advanced**
- Interactive map with clustered event pins (React Leaflet)
- Viewport-aware loading - only fetch events visible on screen (PostGIS)
- Radius search powered by PostGIS ST_DWithin
- Story mode - timeline narrated as a readable paragraph
- Bookmark locations
- Compare two locations side by side
- Trend analysis - dominant event category per location

---

## Design Patterns

| Pattern | Where it is used |
|---|---|
| **Strategy** | WikipediaFetcher, WikidataFetcher, GeoNamesFetcher all extend HistoricalEventFetcher - swappable at runtime |
| **Adapter** | Each API returns different JSON shapes - adapters normalize all of them into one HistoricalEvent object |
| **Factory** | EventFactory creates event objects from raw data and picks the correct adapter automatically |
| **Decorator** | ScoredEvent wraps HistoricalEvent and adds a confidence score without modifying the base class |
| **Template Method** | Base fetcher defines the pipeline (build params → call API → parse) - subclasses override only what differs |

---

## Project Structure

```
chronolens/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── LocationController.js
│   │   │   ├── EventController.js
│   │   │   └── BookmarkController.js
│   │   ├── services/
│   │   │   ├── EventAggregatorService.js
│   │   │   ├── CategorizationService.js
│   │   │   ├── ScoringService.js
│   │   │   ├── TimelineBuilder.js
│   │   │   ├── LocationService.js
│   │   │   ├── GeocodingService.js
│   │   │   ├── CacheService.js
│   │   │   └── DeduplicationService.js
│   │   ├── fetchers/
│   │   │   ├── HistoricalEventFetcher.js
│   │   │   ├── WikipediaFetcher.js
│   │   │   ├── WikidataFetcher.js
│   │   │   └── GeoNamesFetcher.js
│   │   ├── adapters/
│   │   │   ├── WikipediaAdapter.js
│   │   │   ├── WikidataAdapter.js
│   │   │   └── GeoNamesAdapter.js
│   │   ├── factory/
│   │   │   └── EventFactory.js
│   │   ├── repositories/
│   │   │   ├── LocationRepository.js
│   │   │   ├── EventRepository.js
│   │   │   └── BookmarkRepository.js
│   │   ├── models/
│   │   │   ├── Location.js
│   │   │   ├── HistoricalEvent.js
│   │   │   ├── ScoredEvent.js
│   │   │   ├── Timeline.js
│   │   │   ├── EventSource.js
│   │   │   └── RawEvent.js
│   │   ├── constants/
│   │   │   ├── Category.js
│   │   │   └── Era.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   ├── Timeline/
│   │   │   ├── Filters/
│   │   │   ├── EventCard/
│   │   │   ├── StoryMode/
│   │   │   └── SearchBar/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Compare.jsx
│   │   │   └── Bookmarks.jsx
│   │   ├── hooks/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
│
├── idea.md
├── useCaseDiagram.md
├── sequenceDiagram.md
├── classDiagram.md
├── ErDiagram.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ with PostGIS extension
- Redis
- A GeoNames free account (for the GeoNames API username)

### Setup

```bash
# clone the repo
git clone https://github.com/your-username/chronolens.git
cd chronolens

# backend
cd backend
npm install
cp .env.example .env
# fill in your DB credentials and GeoNames username in .env

# run database migrations
npx prisma migrate dev

# start the backend
npm run dev

# frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chronolens
REDIS_URL=redis://localhost:6379
GEONAMES_USERNAME=your_geonames_username
PORT=3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/timeline` | Get historical timeline for a location |
| GET | `/api/events` | Get filtered events for a saved location |
| GET | `/api/events/viewport` | Get events within a map bounding box |
| POST | `/api/bookmarks` | Save a bookmark |
| GET | `/api/bookmarks/:userId` | Get all bookmarks for a user |
| DELETE | `/api/bookmarks/:id` | Delete a bookmark |
| GET | `/api/compare` | Compare two locations |

---

## Diagrams

| Diagram | File |
|---|---|
| Use Case | [useCaseDiagram.md](./usecaseDiagram.md) |
| Sequence | [sequenceDiagram.md](./sequenceDiagram.md) |
| Class | [classDiagram.md](./classDiagram.md) |
| ER | [ErDiagram.md](./erDiagram.md) |