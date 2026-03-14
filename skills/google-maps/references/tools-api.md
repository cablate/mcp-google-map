# Google Maps Tools - Parameter & Response Reference

## geocode

Convert an address or landmark name to GPS coordinates.

```bash
exec geocode '{"address": "Tokyo Tower"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| address | string | yes | Address or landmark name |

Response:
```json
{
  "success": true,
  "data": {
    "location": { "lat": 35.6585805, "lng": 139.7454329 },
    "formatted_address": "4-chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan",
    "place_id": "ChIJCewJkL2LGGAR3Qmk0vCTGkg"
  }
}
```

---

## reverse-geocode

Convert GPS coordinates to a street address.

```bash
exec reverse-geocode '{"latitude": 35.6586, "longitude": 139.7454}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| latitude | number | yes | Latitude |
| longitude | number | yes | Longitude |

Response:
```json
{
  "success": true,
  "data": {
    "formatted_address": "...",
    "place_id": "ChIJ...",
    "address_components": [...]
  }
}
```

---

## search-nearby

Find places near a location by type.

```bash
exec search-nearby '{"center": {"value": "35.6586,139.7454", "isCoordinates": true}, "keyword": "restaurant", "radius": 500}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| center | object | yes | `{ value: string, isCoordinates: boolean }` — address or `lat,lng` |
| keyword | string | no | Place type (restaurant, cafe, hotel, gas_station, hospital, etc.) |
| radius | number | no | Search radius in meters (default: 1000) |
| openNow | boolean | no | Only show currently open places |
| minRating | number | no | Minimum rating (0-5) |

Response: `{ success, location, data: [{ name, place_id, formatted_address, geometry, rating, user_ratings_total, opening_hours }] }`

---

## search-places

Free-text place search. More flexible than search-nearby.

```bash
exec search-places '{"query": "ramen in Tokyo"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | yes | Natural language search query |
| locationBias | object | no | `{ latitude, longitude, radius? }` to bias results toward |
| openNow | boolean | no | Only show currently open places |
| minRating | number | no | Minimum rating (1.0-5.0) |
| includedType | string | no | Place type filter |

Response: `{ success, data: [{ name, place_id, address, location, rating, total_ratings, open_now }] }`

---

## place-details

Get full details for a place by its place_id (from search results). Returns reviews, phone, website, hours, photos.

```bash
exec place-details '{"placeId": "ChIJCewJkL2LGGAR3Qmk0vCTGkg"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| placeId | string | yes | Google Maps place ID (from search results) |

---

## directions

Get step-by-step navigation between two points.

```bash
exec directions '{"origin": "Tokyo Tower", "destination": "Shibuya Station", "mode": "transit"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| origin | string | yes | Starting point (address or landmark) |
| destination | string | yes | End point (address or landmark) |
| mode | string | no | Travel mode: driving, walking, bicycling, transit |
| departure_time | string | no | Departure time (ISO 8601 or "now") |
| arrival_time | string | no | Desired arrival time (transit only) |

---

## distance-matrix

Calculate travel distances and times between multiple origins and destinations.

```bash
exec distance-matrix '{"origins": ["Tokyo Tower"], "destinations": ["Shibuya Station", "Shinjuku Station"], "mode": "driving"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| origins | string[] | yes | List of origin addresses |
| destinations | string[] | yes | List of destination addresses |
| mode | string | no | Travel mode: driving, walking, bicycling, transit |

---

## elevation

Get elevation data for geographic coordinates.

```bash
exec elevation '{"locations": [{"latitude": 35.6586, "longitude": 139.7454}]}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| locations | object[] | yes | Array of `{ latitude, longitude }` |

Response:
```json
[{ "elevation": 17.23, "location": { "lat": 35.6586, "lng": 139.7454 }, "resolution": 610.81 }]
```

---

## timezone

Get timezone and local time for coordinates.

```bash
exec timezone '{"latitude": 35.6586, "longitude": 139.7454}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| latitude | number | yes | Latitude |
| longitude | number | yes | Longitude |
| timestamp | number | no | Unix timestamp in ms (defaults to now) |

Response:
```json
{ "timeZoneId": "Asia/Tokyo", "timeZoneName": "Japan Standard Time", "utcOffset": 32400, "dstOffset": 0, "localTime": "2026-03-14T16:19:16.000" }
```

---

## weather

Get current weather or forecast. Coverage: most regions, but China, Japan, South Korea, Cuba, Iran, North Korea, Syria are unsupported.

```bash
exec weather '{"latitude": 37.4220, "longitude": -122.0841}'
exec weather '{"latitude": 37.4220, "longitude": -122.0841, "type": "forecast_daily", "forecastDays": 3}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| latitude | number | yes | Latitude |
| longitude | number | yes | Longitude |
| type | string | no | `current` (default), `forecast_daily`, `forecast_hourly` |
| forecastDays | number | no | 1-10, for forecast_daily (default: 5) |
| forecastHours | number | no | 1-240, for forecast_hourly (default: 24) |

---

## explore-area (composite)

Explore a neighborhood in one call. Internally chains geocode → search-nearby (per type) → place-details (top N).

```bash
exec explore-area '{"location": "Tokyo Tower", "types": ["restaurant", "cafe"], "topN": 2}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| location | string | yes | Address or landmark |
| types | string[] | no | Place types to search (default: restaurant, cafe, attraction) |
| radius | number | no | Search radius in meters (default: 1000) |
| topN | number | no | Top results per type to get details for (default: 3) |

---

## plan-route (composite)

Plan an optimized multi-stop route. Internally chains geocode → distance-matrix → nearest-neighbor → directions.

```bash
exec plan-route '{"stops": ["Tokyo Tower", "Shibuya Station", "Shinjuku Station", "Ueno Park"], "mode": "driving"}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| stops | string[] | yes | Addresses or landmarks (min 2) |
| mode | string | no | driving, walking, bicycling, transit (default: driving) |
| optimize | boolean | no | Auto-optimize visit order (default: true) |

---

## compare-places (composite)

Compare places side-by-side. Internally chains search-places → place-details → distance-matrix.

```bash
exec compare-places '{"query": "ramen near Shibuya", "limit": 3}'
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | yes | Search query |
| userLocation | object | no | `{ latitude, longitude }` — adds distance/drive time |
| limit | number | no | Max places to compare (default: 5) |

---

## Chaining Patterns

### Basic Patterns

**Search → Details** — Find places, then get full info on the best ones.
```
search-places {"query":"Michelin restaurants in Taipei"}
place-details {"placeId":"ChIJ..."}  ← use place_id from results
```

**Geocode → Nearby** — Turn a landmark into coordinates, then explore the area.
```
geocode {"address":"Taipei 101"}
search-nearby {"center":{"value":"25.033,121.564","isCoordinates":true},"keyword":"cafe","radius":500}
```

**Multi-point Comparison** — Compare distances across multiple origins and destinations in one call.
```
distance-matrix {"origins":["Taipei Main Station","Banqiao Station"],"destinations":["Taoyuan Airport","Songshan Airport"],"mode":"driving"}
```

---

## Scenario Recipes

Use these recipes when the user's question maps to a multi-step workflow. Think of each recipe as a **decision tree**, not a script — adapt based on what the user actually needs.

### Recipe 1: Trip Planning ("Plan a day in Tokyo")

This is the most common complex scenario. The goal is a time-ordered itinerary with routes between stops.

**Steps:**
1. `geocode` — Resolve all mentioned landmarks to coordinates
2. `search-nearby` — Find restaurants/attractions near each landmark (use coordinates from step 1)
3. `place-details` — Get ratings, hours, reviews for top candidates (use place_id from step 2)
4. `distance-matrix` — Compare travel times between all candidate stops to find the optimal order
5. `directions` — Generate turn-by-turn routes between stops in the final order

**Key decisions:**
- If the user says "near X", use `search-nearby`. If they say "best Y in Z", use `search-places`.
- Always check `opening_hours` from `place-details` before including in itinerary.
- Use `distance-matrix` to order stops efficiently, THEN use `directions` for the final route.

**Example output shape:**
```
Morning: Tokyo Tower (9:00) → 12 min walk → Zojoji Temple (9:30)
Lunch: Sushi Dai (11:30) ★4.6 — 2.1 km, 8 min by transit
Afternoon: TeamLab (14:00) → Odaiba area
```

---

### Recipe 2: "What's nearby?" / Local Discovery

User asks about places around a location. May or may not specify what type.

**Steps:**
1. `geocode` — Resolve the location (skip if user gave coordinates)
2. `search-nearby` — Search with keyword + radius. Use `openNow: true` if the user implies "right now"
3. `place-details` — Get details for the top 3-5 results (ratings, reviews, hours)

**Key decisions:**
- If no keyword specified, search multiple types: restaurant, cafe, attraction
- Use `minRating: 4.0` by default unless the user wants comprehensive results
- Sort results by rating × review count, not just rating alone

---

### Recipe 3: Route Comparison ("Best way to get from A to B")

User wants to compare travel options between two points.

**Steps:**
1. `directions` with `mode: "driving"` — Get driving route
2. `directions` with `mode: "transit"` — Get transit route
3. `directions` with `mode: "walking"` — Get walking route (if distance < 5 km)

**Present as comparison table:**
```
| Mode    | Duration | Distance | Notes            |
|---------|----------|----------|------------------|
| Driving | 25 min   | 12.3 km  | Via Highway 1    |
| Transit | 35 min   | —        | Metro Line 2     |
| Walking | 2h 10min | 10.1 km  | Not recommended  |
```

---

### Recipe 4: Neighborhood Analysis ("Is this a good area?")

User wants to evaluate a location for living, working, or investing.

**Steps:**
1. `geocode` — Resolve the address
2. `search-nearby` — Run multiple searches from the same center:
   - `keyword: "school"` radius 2000
   - `keyword: "hospital"` radius 3000
   - `keyword: "supermarket"` radius 1000
   - `keyword: "restaurant"` radius 500
   - `keyword: "park"` radius 1000
3. `distance-matrix` — Calculate commute time to important locations (office, airport, city center)
4. `elevation` — Check if the area is in a low-elevation flood zone

**Present as scorecard:**
```
📍 742 Evergreen Terrace
Schools within 2km: 4 (avg ★4.2)
Hospitals within 3km: 2
Supermarkets within 1km: 3
Commute to downtown: 22 min driving, 35 min transit
Elevation: 45m (not a flood risk)
```

---

### Recipe 5: Multi-Stop Route ("Visit these 5 places efficiently")

User has a list of places and wants the optimal visit order.

**Steps:**
1. `geocode` — Resolve all addresses to coordinates
2. `distance-matrix` — Calculate NxN matrix (all origins × all destinations)
3. Use the matrix to determine the nearest-neighbor route order
4. `directions` — Generate route for the final order (chain waypoints)

**Key decisions:**
- For ≤ 5 stops, nearest-neighbor heuristic is good enough
- For the `directions` call, set origin = first stop, destination = last stop, and mention intermediate stops in conversation
- If the user says "return to start", plan a round trip

---

### Recipe 6: Place Comparison ("Which restaurant should I pick?")

User is choosing between specific places.

**Steps:**
1. `search-places` — Find each place (or use place_id if already known)
2. `place-details` — Get full details for each candidate
3. `distance-matrix` — Calculate distance from user's location to each candidate

**Present as comparison:**
```
| Restaurant | Rating | Reviews | Distance | Price | Open Now |
|-----------|--------|---------|----------|-------|----------|
| Sushi Dai  | ★4.6   | 2,340   | 1.2 km   | $$   | Yes      |
| Tsukiji    | ★4.3   | 890     | 0.8 km   | $    | Yes      |
| Omakase    | ★4.8   | 156     | 3.1 km   | $$$$ | No       |
```

---

### Recipe 7: "Along the Route" Search

User wants to find things along a route (gas stations, rest stops, food).

**Steps:**
1. `directions` — Get the route first, extract key waypoints from the steps
2. `search-nearby` — Search near 2-3 midpoints along the route
3. `place-details` — Get details for top results at each midpoint

**Key decisions:**
- Extract waypoints at roughly equal intervals along the route
- Use the `start_location` of route steps at ~1/3 and ~2/3 of the total distance
- Set `radius` based on road type: 1000m for highways, 500m for city streets

---

## Decision Guide: Which Recipe to Use

| User says... | Recipe | First tool |
|-------------|--------|------------|
| "Plan a trip / itinerary / day in X" | Trip Planning | `geocode` |
| "What's near X / around X" | Local Discovery | `geocode` → `search-nearby` |
| "How do I get to X" / "route from A to B" | Route Comparison | `directions` |
| "Is X a good neighborhood" / "analyze this area" | Neighborhood Analysis | `geocode` |
| "Visit A, B, C, D efficiently" | Multi-Stop Route | `geocode` → `distance-matrix` |
| "Which X should I pick" / "compare these" | Place Comparison | `search-places` |
| "Find gas stations on the way to X" | Along the Route | `directions` → `search-nearby` |

---

## Future Composite Tools (Planned)

These high-frequency scenarios are candidates for single-call composite tools in a future version:

| Composite Tool | What it would do | Replaces |
|---------------|-----------------|----------|
| `maps_explore_area` | geocode + multi-type search-nearby + place-details for top results | Recipe 2 (3-call → 1-call) |
| `maps_plan_route` | geocode all stops + distance-matrix + directions in optimal order | Recipe 5 (4-call → 1-call) |
| `maps_compare_places` | search + details + distance for N candidates | Recipe 6 (3-call → 1-call) |
