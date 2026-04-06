# ChronoLens

ChronoLens is a full-stack Historical Location Intelligence Engine built with Express.js, PostgreSQL/PostGIS, Redis, and React. It takes natural language locations or spatial coordinates, gathers aggregated historical data utilizing geospatial logic, and presents an interactive and filterable visual pipeline charting the chronological events that forged regions around the world.

## 🚀 Features

- **Spatial Geocoding Pipelines**: Cross-references raw text or coordinates natively through GeoNames and Wikipedia bounds.
- **Deduplicated History Sets**: Aggregates overlapping chronological items intelligently through multi-factor similarity arrays.
- **Narrative Story Generation**: Synthesizes pure API data automatically down into readable historical paragraph modes locally.
- **Category Trends**: Builds native distribution analysis blocks identifying core locational contexts and dominant historical eras.
- **Interactive Map Exploration**: Drags and zooms smoothly fetching new coordinates efficiently through PostGIS bounding boxes.
- **Rich Comparisons**: Mount dual search logic evaluating regional history footprints against each other side-by-side cleanly.

---

## 🛠 Prerequisites

- Node.js `v18+`
- PostgreSQL `v14+` *(must have PostGIS extension enabled)*
- Redis `v6+`
- A free [GeoNames](http://www.geonames.org/login) account

---

## 💻 Setup & Installation

Follow these steps precisely to spin up the entire application locally.

**1. Clone the repository**
```bash
git clone https://github.com/MAHEK-ops/ChronoLens.git
cd ChronoLens
```

**2. Setup Backend**
```bash
cd backend
npm install
```

**3. Configure Environment Variables**
Copy the `.env.example` file to create your own configuration.
```bash
cp .env.example .env
```
*(See [Environment Variables](#environment-variables) reference below to fill standard credentials)*

**4. Run Database Migrations**
Executes Prisma setup and configures schema mappings formatting database rows.
```bash
npx prisma migrate dev --name init
```

**5. Initialize Spatial PostGIS Bounds**
Executes explicit schema attachments generating PostGIS columns into mapping indexes dynamically.
```bash
npm run migrate:postgis
```

**6. Setup Frontend**
Boot terminal on root repository and initialize React/Vite dependencies cleanly.
```bash
cd ../frontend
npm install
cp .env.example .env # Ensure VITE_API_BASE_URL=http://localhost:3000/api
```

**7. Run Both Servers Locally**
Fire up both endpoints cleanly bridging your stack.

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

---

## 🔐 Environment Variables

### Backend (`/backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | API execution port *(Default: 3000)* |
| `DATABASE_URL` | PostGIS database connection string `postgresql://user:password@localhost:5432/chronolens` |
| `REDIS_URL` | Redis caching connection string `redis://localhost:6379` |
| `GEONAMES_USERNAME` | Valid active GeoNames account username | 
| `NODE_ENV` | Toggle to `production` to suppress controller stack traces |

### Frontend (`/frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Path routing pointing to backend location *(Default: `http://localhost:3000/api`)* |

---

## 📚 API Reference

The core logic uses `/api` prefix mounted within Express.

### 1. `POST /api/timeline`
Retrieves bounded chronology via unified address search bounds or direct coordinate maps.
```json
// Request Body
{
  "address": "Pune",
  "radiusKm": 10,
  "sortOrder": "ASC" 
}

// Successful Response (200)
{
  "success": true,
  "location": {
    "id": 1,
    "placeName": "Pune",
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "timeline": {
    "events": [
      {
        "id": "event_uuid",
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

### 2. `GET /api/timeline/:locationId/story`
Reads a database-cached location id and translates all underlying history into a semantic readable string.
```json
// Successful Response (200)
{
  "success": true,
  "locationId": 1,
  "placeName": "Pune",
  "story": "Pune has a recorded history spanning 356 years, with 25 significant events documented across 4 domains. Militarily, the region saw 12 conflicts. The earliest was 'Siege of Purandar' in 1665..."
}
```

### 3. `GET /api/events`
Direct event querying dynamically fetching history lists attached exactly via `locationId`, matching internal query attributes.
```json
// Request URL
// GET /api/events?locationId=1&category=WAR_BATTLE&sortOrder=DESC

// Successful Response (200)
{
  "success": true,
  "count": 1,
  "events": [
    {
      "id": "event_uuid",
      "title": "Battle of Poona",
      "year": 1817,
      "category": "WAR_BATTLE",
      "era": "MODERN"
    }
  ]
}
```

### 4. `GET /api/events/viewport`
Explores geometry lookups evaluating events bounding exact raw geographic spans.
```json
// Request URL
// GET /api/events/viewport?north=19.123&south=18.012&east=74.321&west=72.829

// Successful Response (200)
{
  "success": true,
  "count": 15,
  "events": [
    {
      "id": "event_uuid",
      "latitude": 18.520,
      "longitude": 73.856,
      "title": "..."
    }
  ]
}
```

### 5. `GET /api/compare`
Cross-references dual locations dynamically matching metrics.
```json
// Request URL
// GET /api/compare?location1=1&location2=2

// Successful Response (200)
{
  "success": true,
  "comparison": {
    "location1": {
      "placeName": "Pune", 
      "totalEvents": 24,
      "dominantCategory": "WAR_BATTLE", 
      "dominantEra": "MODERN",
      "categoryBreakdown": { "WAR_BATTLE": 10, "POLITICS": 6 },
      "averageConfidenceScore": 71.4, 
      "richnessScore": 82
    },
    "location2": {
      "placeName": "Mumbai",
      "totalEvents": 50,
      "dominantCategory": "CULTURE_ART", 
      "dominantEra": "MODERN",
      "categoryBreakdown": { "CULTURE_ART": 20, "POLITICS": 18 },
      "averageConfidenceScore": 78.5, 
      "richnessScore": 95
    }
  }
}
```

### 6. `GET /api/trends/:locationId`
Builds quantitative trend analyses bounding exactly the spread distributions matching category vectors correctly.
```json
// Successful Response (200)
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

### 7. Bookmarks / Collections (`POST` / `GET` / `DELETE`)
Stores or retrieves historical user tracking nodes.
```json
// POST /api/bookmarks
// Request Body: { "userId": 1, "locationId": 12, "label": "Vacation Spot" }

// GET /api/bookmarks/1 (Successful Response)
{
  "success": true,
  "count": 1,
  "bookmarks": [
    {
       "id": 5,
       "userId": 1,
       "locationId": 12,
       "label": "Vacation Spot",
       "createdAt": "2026-04-20T10:00:00.000Z",
       "location": { "placeName": "Kyoto", "latitude": 35.0116, "longitude": 135.7681 }
    }
  ]
}

// DELETE /api/bookmarks/5
// Request Body: { "userId": 1 }
// Successful Response: { "success": true, "message": "Bookmark deleted successfully." }
```

---

## 📁 Architecture

```text
ChronoLens/
├── backend/
│   ├── prisma/
│   │   ├── migrations/      # Database migrations
│   │   └── schema.prisma    # Data models
│   ├── src/
│   │   ├── adapters/        # Standardization from APIs
│   │   ├── api/             # Standalone endpoint refs
│   │   ├── components/      # (React frontend context, unused in pure backend)
│   │   ├── constants/       # Internal enums/dictionaries
│   │   ├── controllers/     # Route logic
│   │   ├── db/              # Redis and Postgres config
│   │   ├── fetchers/        # GeoNames / Wikidata APIs
│   │   ├── middleware/      # Rate limits & AppError
│   │   ├── models/          # Service layer models
│   │   ├── repositories/    # Database query abstractions
│   │   ├── routes/          # Express route bindings
│   │   ├── services/        # Deduplication, location parsing
│   │   └── validation/      # Joi schemas
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/             # Axios singletons
    │   ├── components/      # React functional building blocks
    │   ├── pages/           # Page rendering layouts
    │   ├── App.jsx          # Router wrapping elements
    │   └── main.jsx         # Dom injections
    └── .env
```

---

## 📸 Screenshots

*(Replace placeholders with deployed screenshots before push)*

### Main Timeline View
`[Insert Screenshot Here]`

### Side-by-Side Validation 
`[Insert Screenshot Here]`

### Geographic Trend Markers
`[Insert Screenshot Here]`

---
🚀 *Happy Exploring!*