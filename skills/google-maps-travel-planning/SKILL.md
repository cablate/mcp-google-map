---
name: google-maps-travel-planning
description: Build evidence-backed day trips, multi-day itineraries, and efficient stop sequences with Google Maps data through the standalone CLI. Use when the desired output is a practical travel plan, not merely a route or list of places.
license: MIT
---

# Google Maps Travel Planning

Build a time-ordered itinerary whose geography, travel times, opening constraints, and along-route stops have been checked. Use the standalone CLI; no MCP connection is required.

## Before calling the CLI

- On the first call in a session, or after an execution failure, read `../_shared/setup-and-diagnostics.md` and run the non-billable local preflight.
- The user must supply `GOOGLE_MAPS_API_KEY`. Never expose its value.
- Read `../_shared/content-attribution.md` before presenting reviews, photos, or Google-generated summaries.

## Workflow

1. Establish destination, dates or duration, fixed anchors, mobility constraints, pace, and relevant preferences. Ask only for omissions that materially change the itinerary.
2. Read `references/travel-planning.md` before designing the itinerary.
3. Use `maps_search_places` to find candidate anchors, then group nearby anchors into one-direction daily arcs.
4. Use `maps_search_along_route` for meals and breaks between anchors. Use `maps_place_details` for hours, ratings, and source metadata.
5. Validate every day with `maps_plan_route` or `maps_directions`. Do not present estimated timing as validated timing.
6. Check weather and air quality when they affect the plan. Respect regional weather limitations described in the reference.
7. When useful, produce a numbered static map after the stop order is final.
8. Present a day-by-day schedule with travel time, visit duration, reservations or opening-hour caveats, and clearly marked fallbacks.

## CLI

```bash
npx -y @cablate/mcp-google-map exec <tool> '<json_params>'
```

For exact tool parameters, read `../google-maps/references/tools-api.md` only for the tools selected by the plan.

## Boundaries

- A request for only A-to-B directions or a simple multi-stop ordering belongs to `google-maps`.
- A request to assess business visibility or local search rankings belongs to `google-maps-local-seo`.
- Do not infer that a venue is accessible, open, safe, or suitable when the API response does not establish it.
- Do not silently substitute web estimates for unavailable Google Maps results; identify the alternate source.

## References

- `references/travel-planning.md`: required methodology, timing budgets, geographic arcs, and anti-patterns.
- `../google-maps/references/tools-api.md`: exact parameters and response shapes for selected tools.
- `../_shared/setup-and-diagnostics.md`: first-run and failure recovery.
- `../_shared/content-attribution.md`: Places presentation requirements.
