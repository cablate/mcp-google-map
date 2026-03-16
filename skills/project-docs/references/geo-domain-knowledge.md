# Geo Domain Knowledge for AI Map Tool Operators

> Purpose: Give an AI agent without GIS background the domain knowledge needed to use map tools correctly and confidently.

---

## 1. Coordinate Systems

**WGS84** is the universal standard. Every latitude/longitude pair you encounter in Google Maps APIs uses WGS84. No conversion needed.

**Order convention — lat comes first:**
- Correct: `(35.6762, 139.6503)` — Tokyo
- Wrong: `(139.6503, 35.6762)` — inverted, puts you in the ocean
- Google Maps API parameters are always `latitude`, `longitude` in that order.

**Precision and real-world accuracy:**

| Decimal places | Precision | Notes |
|----------------|-----------|-------|
| 0 (e.g., 35°) | ~111 km | Country-level |
| 1 (35.6°) | ~11 km | City-level |
| 2 (35.67°) | ~1.1 km | District-level |
| 3 (35.676°) | ~111 m | Street-level |
| 4 (35.6762°) | ~11 m | Building-level |
| 5 (35.67620°) | ~1.1 m | Door-level |
| 6+ | <1 m | Survey-grade, rarely needed |

For navigation and place lookup, 4–5 decimal places is sufficient. Do not truncate coordinates returned by the API — pass them as-is to downstream tools.

---

## 2. Distance Concepts

**Latitude degree is nearly constant worldwide:**
- 1° latitude ≈ 111 km everywhere

**Longitude degree varies with latitude:**
- At equator (0°): 1° longitude ≈ 111 km
- At 35°N (Tokyo/Seoul/Beijing): 1° longitude ≈ 91 km
- At 45°N (Paris/Milan): 1° longitude ≈ 78 km
- At 60°N (Oslo/Helsinki): 1° longitude ≈ 55 km

**Quick mental math:** At Tokyo's latitude, a 0.01° difference is roughly 1 km.

**Speed references for time estimation:**

| Mode | Typical speed | Notes |
|------|--------------|-------|
| Walking | ~5 km/h | 1 km = ~12 min |
| Cycling | ~15 km/h | varies by terrain |
| Urban driving | ~30–40 km/h | traffic included |
| Highway driving | ~80–100 km/h | intercity |
| Transit (urban) | ~20–30 km/h door-to-door | includes wait time |
| Shinkansen | ~250–300 km/h | between major cities |

These are rule-of-thumb values. Always use `maps_directions` or `maps_distance_matrix` for real travel time — actual conditions (traffic, transit schedules) differ significantly.

---

## 3. Geocoding Concepts

**Forward geocoding**: address/name → lat/lng
- Input: "Shibuya Station, Tokyo"
- Output: `{ lat: 35.6580, lng: 139.7016, place_id: "ChIJ...", formatted_address: "..." }`

**Reverse geocoding**: lat/lng → address
- Input: `(35.6580, 139.7016)`
- Output: formatted address + place types for that location
- Use case: "What is at these coordinates?"

**place_id** — the stable identifier for a place in Google's database:
- Format: `ChIJN1t_tDeuEmsRUsoyG83frY4` (opaque string)
- Stable across time (unlike coordinates, which can shift if a business moves)
- Preferred input for `maps_place_details` — faster and more precise than re-searching by name
- Always cache `place_id` when you receive it; reuse in subsequent calls

**formatted_address vs raw input:**
- `formatted_address` is Google's canonical form: `"2 Chome-21-1 Asakusa, Taito City, Tokyo 111-0032, Japan"`
- Use it for display and for chaining into other tools that accept address strings
- Do not invent or modify addresses — only pass what Google returned

---

## 4. Place Types

Google's place type system is hierarchical. A place can have multiple types (e.g., a convenience store is both `convenience_store` and `store`).

**Common type categories:**

| Category | Examples |
|----------|---------|
| Food & drink | `restaurant`, `cafe`, `bar`, `bakery`, `meal_takeaway`, `food` |
| Lodging | `lodging`, `hotel`, `hostel`, `guest_house` |
| Transport | `train_station`, `subway_station`, `bus_station`, `airport`, `transit_station` |
| Culture | `museum`, `art_gallery`, `library`, `church`, `temple`, `shrine` |
| Nature | `park`, `natural_feature`, `campground`, `amusement_park` |
| Health | `hospital`, `pharmacy`, `doctor`, `dentist` |
| Shopping | `shopping_mall`, `supermarket`, `convenience_store`, `clothing_store` |
| Finance | `bank`, `atm` |
| Education | `school`, `university` |
| Government | `local_government_office`, `post_office`, `police` |

**How to pick the right type for search:**
- Be specific for precision: `ramen_restaurant` > `restaurant` when you know what you want
- Use broader types for exploration: `food` catches everything edible
- Some types are not searchable (too broad) — prefer specific leaf-level types
- Compound queries work: pass `keyword="ramen"` with `type="restaurant"` for best results

---

## 5. Routing and Navigation

**Travel modes:**

| Mode | Parameter | Notes |
|------|-----------|-------|
| Driving | `DRIVE` | Default, uses current traffic |
| Walking | `WALK` | No highways, includes pedestrian paths |
| Cycling | `BICYCLE` | Not available in all regions |
| Transit | `TRANSIT` | Requires `departure_time` for accurate results |

**Key rule for transit**: Always provide `departure_time` (Unix timestamp). Without it, Google may use default schedules that don't reflect actual service patterns. For planning tools, use a future timestamp on a weekday.

**Overview polyline:**
- A compressed string encoding the entire route path (e.g., `_p~iF~ps|U_ulLnnqC_mqNvxq`@`)
- Encoded in Google's Polyline Algorithm (each character represents coordinate delta)
- Use it when you need to pass the route to `maps_static_map` for visualization
- Do not try to decode it manually — pass it as-is to display tools

**Waypoints and stops:**
- Routes can include intermediate waypoints
- Optimize waypoint order with `optimize=true` for multi-stop itineraries
- For Tokyo sightseeing: always think about natural geographic flow (e.g., north→south or circular) to minimize backtracking

---

## 6. Map Projections

**Mercator projection** is what Google Maps (and virtually all web maps) uses.

Key distortion property: **area is not preserved, shape is**. The further from the equator, the larger things appear relative to their true size.

| Location | Apparent size on map vs reality |
|----------|--------------------------------|
| Africa vs Greenland | Africa is 14x larger in reality, but they look similar on Mercator |
| Japan (~35°N) | Moderate distortion, cities appear roughly accurate |
| Scandinavia (~60°N) | Significantly overstated on map |

**Why this matters for `maps_static_map`:**
- At the same zoom level, a 600x400 tile covers more actual ground at higher latitudes
- Zoom 12 in Tokyo covers ~10 km across; zoom 12 in Tokyo's northern suburbs covers slightly more
- Zoom guidelines for `maps_static_map`:

| Zoom | Coverage |
|------|---------|
| 1 | World |
| 5 | Continent/large country |
| 10 | City |
| 12 | District |
| 14 | Neighborhood |
| 16 | Streets |
| 18 | Building-level |
| 20 | Room-level (where available) |

---

## 7. Spatial Search Types

**Circular search (radius-based):**
- Definition: find places within N meters of a center point
- API: `maps_search_nearby` with `radius` parameter
- Best for: "coffee shops near me," "ATM within 500m"
- Limitation: covers uniform area regardless of walkability — a 500m radius includes both sides of a river

**Search along route:**
- Definition: find places near any point on a route path
- Requires: route polyline from `maps_directions`
- Best for: "rest stops between Tokyo and Osaka," "gas stations on the way"
- Implementation: buffer the polyline, search at interval waypoints

**Bounding box search:**
- Definition: find everything within a lat/lng rectangle
- Best for: "all museums in Kyoto" (known geographic area)
- Less precise than radius — corners are farther from center than edge midpoints

**Choosing the right approach:**

| Scenario | Use |
|----------|-----|
| Near a specific point | Circular (radius) |
| Along a travel path | Route-based |
| Within a city/district | Bounding box or large radius from city center |
| "Best of" in an area | Keyword search + type filter |

---

## 8. Travel Planning Domain Knowledge

**Time-of-day sensitivity:**
- Early morning (6–9 AM): temples/shrines are quieter, markets open
- Midday (11 AM–2 PM): lunch crowds at restaurants; museums uncrowded
- Late afternoon (3–5 PM): good for viewpoints and gardens (golden hour light)
- Evening (5–8 PM): best for dining, night markets, illuminated landmarks
- Night (8 PM+): limited temple access, izakayas peak, Tokyo Skytree views

**Arc routing principle:**
- Design routes that move in one general direction, then return — avoid ping-pong backtracking
- Example: Asakusa → Ueno → Akihabara (east→center→east) is efficient; Shinjuku → Asakusa → Shinjuku is not

**Energy curve (fatigue model):**
- Morning: high energy → schedule physically demanding activities (hills, many stairs)
- Midday: lunch + rest → schedule museum interiors, air-conditioned venues
- Afternoon: moderate energy → walking tours, shopping
- Evening: low energy → seated dining, short walks only

**Meal timing:**
- Breakfast: 7–9 AM
- Lunch: 11:30 AM–1:30 PM (plan to arrive before 12 to avoid queues)
- Dinner: 6–8 PM (popular spots fill by 6:30)
- Always build 15–20 min buffer for transit between meals and activities

**Group size adjustments:**
- Solo/couple: access anywhere, no reservation usually needed
- Group (4–8): book restaurants ahead, check venue capacity
- Large group (8+): many historic sites have capacity limits (e.g., Fushimi Inari paths are narrow)

---

## 9. Japan-Specific Knowledge

### Kyoto Area Structure

Kyoto's main sightseeing zones:

| Zone | Key sites | Character |
|------|----------|-----------|
| Arashiyama (west) | Bamboo Grove, Tenryu-ji | Nature, bamboo, riverside |
| Higashiyama (east) | Kiyomizu-dera, Gion, Ninen-zaka | Traditional streets, temples |
| Fushimi (south) | Fushimi Inari | Torii gates, accessible by JR |
| Downtown (center) | Nijo Castle, Nishiki Market | Mix of modern and historical |
| Nishijin (north-center) | Kinkaku-ji, Ryoan-ji | Famous temples, crowded |

**Rule**: Arashiyama and Higashiyama are on opposite sides of the city (~1 hr by bus). Do not combine them in a half-day plan.

### Train Network

| Network | Type | Use case |
|---------|------|---------|
| Shinkansen (bullet train) | Inter-city | Tokyo↔Kyoto (2h15m), Tokyo↔Osaka (2h30m) |
| JR lines | Regional/urban | JR Pass compatible, connects major stations |
| Hankyu/Keihan/Kintetsu | Private railways | Osaka↔Kyoto alternatives, often cheaper |
| Tokyo Metro / Toei | Urban subway | Dense Tokyo inner-city coverage |
| Kyoto Bus | Urban bus | Essential for Kyoto (no subway to Arashiyama/Fushimi) |

**Practical notes:**
- IC cards (Suica, Pasmo, ICOCA) work on almost all trains and buses in Japan — recommend for all visitors
- JR Pass only covers JR-operated lines, not private railways or subways
- In Kyoto, bus day pass (¥700) is cost-effective for 3+ bus rides

### Temple and Shrine Access Times

| Category | Typical hours | Notes |
|----------|--------------|-------|
| Major temples (paid) | 8:30 AM – 5:00 PM | Last entry 30 min before close |
| Fushimi Inari | 24 hours | Lower section always open |
| Buddhist temple grounds | 6:00 AM – dusk | Gates/halls may have separate hours |
| Shrine precincts | Usually always open | Inner buildings have set hours |

**Key rule**: Always plan temple visits for morning to avoid afternoon crowds and ensure all halls are open. Schedule Fushimi Inari early morning (6–8 AM) to avoid tour groups.

### Japanese Address System

Addresses in Japan follow a reverse order from Western convention:
- Prefecture → City → Ward → Chome (district) → Block → Building
- Example: `東京都渋谷区道玄坂1丁目2-3` = Tokyo-to, Shibuya-ku, Dogenzaka 1-chome, block 2, building 3
- Always geocode Japanese addresses using `maps_geocode` — do not attempt to calculate coordinates from address text.

### Useful Distance References (Japan)

| Route | Distance | Transport | Time |
|-------|----------|-----------|------|
| Tokyo → Kyoto | 450 km | Nozomi Shinkansen | 2h15m |
| Tokyo → Osaka | 520 km | Nozomi Shinkansen | 2h30m |
| Kyoto → Nara | 35 km | JR Nara Line | 45m |
| Kyoto → Osaka | 75 km | JR/Hankyu | 15–28m |
| Shinjuku → Asakusa (Tokyo) | 10 km | Metro | 30m |
