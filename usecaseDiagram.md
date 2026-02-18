# Use Case Diagram — ChronoLens

```mermaid
graph TD
    User((User))
    Admin((Admin))

    subgraph ChronoLens System

        subgraph Location Input
            UC1[Enter Address]
            UC2[Enter GPS Coordinates]
            UC3[Use Current Location]
        end

        subgraph Timeline Features
            UC4[View Historical Timeline]
            UC5[Filter by Category]
            UC6[Filter by Time Period]
            UC7[Search by Keyword]
            UC8[Sort by Date]
            UC9[Group by Era]
        end

        subgraph Event Details
            UC10[View Event Details]
            UC11[View Confidence Score]
            UC12[View Source References]
        end

        subgraph Advanced Features
            UC13[Read Story Mode Narrative]
            UC14[Bookmark Location]
            UC15[Compare Two Locations]
            UC16[View Trend Analysis]
            UC17[View Events on Map]
        end

        subgraph Admin Panel
            UC18[Monitor API Usage]
            UC19[View Cache Stats]
            UC20[Manage Rate Limits]
        end

    end

    User --> UC1
    User --> UC2
    User --> UC3

    UC1 --> UC4
    UC2 --> UC4
    UC3 --> UC4

    UC4 --> UC5
    UC4 --> UC6
    UC4 --> UC7
    UC4 --> UC8
    UC4 --> UC9
    UC4 --> UC10
    UC4 --> UC13
    UC4 --> UC16
    UC4 --> UC17

    UC10 --> UC11
    UC10 --> UC12

    User --> UC14
    User --> UC15
    UC15 --> UC4

    Admin --> UC18
    Admin --> UC19
    Admin --> UC20
```

---

## Actor Descriptions

| Actor | Description |
|---|---|
| **User** | Any person who interacts with the app — enters a location, explores the timeline, bookmarks places, reads story mode |
| **Admin** | System administrator who monitors external API health, cache hit rates, and rate limit usage |

---

## Use Case Descriptions

| Use Case | Description |
|---|---|
| Enter Address | User types a city, landmark, or address — system geocodes it to lat/lng via Nominatim |
| Enter GPS Coordinates | User provides lat/lng directly — skips geocoding step |
| Use Current Location | Browser Geolocation API provides coordinates automatically |
| View Historical Timeline | Core use case — backend fetches, aggregates, cleans, scores, and returns sorted events |
| Filter by Category | Narrow results to War, Science, Culture, Disaster, Politics, or Births/Deaths |
| Filter by Time Period | Restrict to Ancient / Medieval / Colonial / Modern or a custom year range |
| Search by Keyword | Full-text search across event titles and descriptions |
| View Confidence Score | Each event shows a 0–100 reliability score based on source count and weight |
| View Story Mode | Backend narrates the location's history as a flowing readable paragraph |
| Bookmark Location | Save a location to personal history for later retrieval |
| Compare Two Locations | Side-by-side historical event count and category breakdown of two places |
| View Trend Analysis | Visual breakdown of which event categories dominate this location |
| View Events on Map | React Leaflet map with clustered pins — click a pin to see event details |