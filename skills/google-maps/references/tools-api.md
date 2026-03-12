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
