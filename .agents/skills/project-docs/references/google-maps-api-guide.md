# Google Maps API Guide

## APIs in Use

| API | Endpoint | Tool(s) | GCP Service to Enable |
|---|---|---|---|
| Geocoding API | via `@googlemaps/google-maps-services-js` SDK | `maps_geocode`, `maps_reverse_geocode`, `maps_batch_geocode` | Geocoding API |
| Routes API (computeRoutes) | `https://routes.googleapis.com/directions/v2:computeRoutes` (REST fetch) | `maps_directions`, `maps_plan_route` (legs + waypoint optimization), `maps_search_along_route` (polyline) | Routes API |
| Routes API (computeRouteMatrix) | `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix` (REST fetch) | `maps_distance_matrix` | Routes API |
| Elevation API | via SDK | `maps_elevation` | Elevation API |
| Time Zone API | via SDK | `maps_timezone` | Time Zone API |
| Places API (New) — Nearby Search | `https://places.googleapis.com/v1/places:searchNearby` (gRPC via `@googlemaps/places`) | `maps_search_nearby` | Places API (New) |
| Places API (New) — Text Search | `https://places.googleapis.com/v1/places:searchText` (gRPC + REST) | `maps_search_places`, `maps_compare_places`, `maps_explore_area`, `maps_search_along_route` (step 2) | Places API (New) |
| Places API (New) — Place Details | `https://places.googleapis.com/v1/places/{placeId}` (gRPC) | `maps_place_details` | Places API (New) |
| Weather API | `https://weather.googleapis.com/v1/currentConditions:lookup` | `maps_weather` (type=current) | Google Weather API |
| Weather API — Daily Forecast | `https://weather.googleapis.com/v1/forecast/days:lookup` | `maps_weather` (type=forecast_daily, max 10 days) | Google Weather API |
| Weather API — Hourly Forecast | `https://weather.googleapis.com/v1/forecast/hours:lookup` | `maps_weather` (type=forecast_hourly, max 240 hours) | Google Weather API |
| Air Quality API | `https://airquality.googleapis.com/v1/currentConditions:lookup` | `maps_air_quality` | Air Quality API |
| Maps Static API | `https://maps.googleapis.com/maps/api/staticmap` | `maps_static_map` | Maps Static API |

---

## API Coverage Limitations

### Weather API

- **Not supported**: China, Japan, South Korea, Cuba, Iran, North Korea, Syria
- Best coverage: North America, Europe, Oceania
- Error message when unsupported: `"not supported for this location"` — the code catches this and returns a user-readable message including the list of unsupported regions
- Forecast limits: daily max 10 days, hourly max 240 hours (enforced with `Math.min/Math.max`)

### Air Quality API

- Global coverage (no known hard exclusions)
- Returns multiple indexes: universal AQI + local country-specific index where available
- `extraComputations` options: `HEALTH_RECOMMENDATIONS`, `POLLUTANT_CONCENTRATION`

### Places API (New)

- `maxResultCount` hard cap: 20 (enforced in `NewPlacesService`)
- `searchNearby` uses `includedTypes` (type-based), not free-text keyword
- Photos: returns `photo.name` (resource reference), not a direct image URL

### Directions API

- `transit` mode requires `departure_time` for accurate transit schedule results (without it Google may return estimated or no results)
- `plan_route` optimization uses `driving` mode for distance matrix even when the final leg mode is `transit`, to avoid matrix returning null entries

### Static Maps API

- URL length limit: 16,384 characters (enforced before fetch)
- Returns binary PNG, converted to base64 by the server for MCP response
- `maptype` options: `roadmap`, `satellite`, `terrain`, `hybrid`

---

## Common Pitfalls

| Scenario | Problem | Fix |
|---|---|---|
| `transit` directions with no `departure_time` | Google may return `ZERO_RESULTS` or incorrect duration | Always pass `departure_time` (Unix timestamp or `"now"`) when using transit mode |
| `plan-route` with `formatted_address` from geocode | Directions API may return `ZERO_RESULTS` on complex formatted addresses | `plan-route` passes the original user-provided stop name to Directions, not `formatted_address` from geocode step |
| `searchNearby` with free-text keyword | `includedTypes` expects a Place type string (e.g. `"restaurant"`), not a general query | Use `search_places` for free-text; use `search_nearby` for type-constrained radius search |
| Weather for Japan/China | Returns HTTP error with "not supported for this location" | Catch and re-throw with explicit unsupported country list (already implemented) |
| Air Quality `includePollutants: false` | Default is `true` for `includeHealthRecommendations`, `false` for pollutants | Be explicit — omitting `includePollutants` defaults to `false` |
| Static map URL over 16,384 chars | Google rejects the request | Reduce number of markers or path waypoints |
| Place Details with Places API (New) | Resource name format is `places/<id>` not raw `placeId` | `NewPlacesService.getPlaceDetails()` prepends `places/` automatically |
| Batch geocode concurrency | Default concurrency is 20, max enforced at 50 | Use `--concurrency` flag in CLI batch-geocode command; tool-mode uses `Promise.all` |

---

## Rate Limits and Batch Strategy

| API | QPS Limit (default) | Notes |
|---|---|---|
| Geocoding API | 50 QPS | `maps_batch_geocode` uses `Promise.all` in tool mode; CLI uses semaphore with configurable concurrency (default 20, max 50) |
| Places API (New) | 100 QPS | Result count capped at 20 per request |
| Directions API | 50 QPS | `plan_route` makes N-1 serial Directions calls after parallel geocoding |
| Distance Matrix API | 100 elements/request, 100 QPS | `plan_route` optimization: N×N matrix for ≤ ~10 stops is safe |
| Weather / Air Quality | Per project quota | No internal retry logic; HTTP 429 surfaces as `"API quota exceeded"` message |
| Static Maps API | 500 QPS | Single image fetch; no batch |

**HTTP 403** → API key invalid or the required GCP API not enabled.
**HTTP 429 / `OVER_QUERY_LIMIT`** → Quota exceeded; wait and retry or upgrade billing plan.

---

## Search Along Route

`maps_search_along_route` is a two-step composite:

**Step 1** — Get route polyline via Directions API:
```
GoogleMapsTools.getDirections(origin, destination, mode)
  -> routes[0].overview_polyline.points  (encoded polyline)
```

**Step 2** — Places Text Search with `searchAlongRouteParameters`:
```
POST https://places.googleapis.com/v1/places:searchText
Headers:
  X-Goog-Api-Key: <key>
  X-Goog-FieldMask: places.displayName,places.id,places.formattedAddress,
                    places.location,places.rating,places.userRatingCount,
                    places.currentOpeningHours.openNow
Body:
{
  "textQuery": "<query>",
  "searchAlongRouteParameters": {
    "polyline": { "encodedPolyline": "<encoded>" }
  },
  "maxResultCount": <1-20>
}
```

**Limitations**:
- Requires Places API (New) to be enabled
- `maxResults` capped at 20
- Uses REST fetch (not gRPC SDK) because `searchAlongRouteParameters` is not yet exposed in the Node.js gRPC client
- Mode defaults to `walking` if not specified

---

## Places API New vs Legacy

| Aspect | Places API (New) | Places API (Legacy) |
|---|---|---|
| GCP service name | "Places API (New)" | "Places API" |
| Node.js library | `@googlemaps/places` | `@googlemaps/google-maps-services-js` |
| Protocol | gRPC (+ REST for searchText) | HTTPS REST |
| Auth | `apiKey` in constructor / `X-Goog-Api-Key` header | `key` query param |
| Field selection | `X-Goog-FieldMask` header | `fields` param |
| Resource naming | `places/<id>` | raw `placeId` string |
| Tools using it | `maps_search_nearby`, `maps_search_places`, `maps_place_details`, `maps_explore_area`, `maps_compare_places`, `maps_search_along_route` (step 2) | geocode, reverseGeocode, directions, distanceMatrix, elevation, timezone |
| Max results | 20 per request | varies by endpoint |
| Photos | Returns `photo.name` resource path | Returns `photo_reference` string |
| Error codes | gRPC status codes (7=PERMISSION_DENIED, 8=RESOURCE_EXHAUSTED) | HTTP status codes |

**Note**: `maps_search_along_route` uses the Routes API for step 1 (polyline extraction) and Places API (New) REST for step 2 (search). Both APIs must be enabled for this tool to function.
