---
name: google-maps-local-seo
description: Analyze Google Business Profile visibility, geographic grid rankings, local search keywords, and nearby competitors through the standalone Google Maps CLI. Use for local SEO or location-strategy decisions, not ordinary place recommendations.
license: MIT
---

# Google Maps Local SEO

Produce a reproducible local-search visibility analysis grounded in Google Maps results. Use the standalone CLI; no MCP connection is required.

## Before calling the CLI

- On the first call in a session, or after an execution failure, read `../_shared/setup-and-diagnostics.md` and run the non-billable local preflight.
- The user must supply `GOOGLE_MAPS_API_KEY`. Never expose its value.
- Read `../_shared/content-attribution.md` before presenting reviews, photos, or Google-generated summaries.

## Workflow

1. Confirm the target business or `place_id`, service area, relevant keywords, grid size, and decision the user needs to make.
2. Read `references/local-seo.md` before running an audit.
3. Resolve the target with `maps_search_places` and `maps_place_details`; do not assume businesses with similar names are identical.
4. Use `maps_local_rank_tracker` for geographic rankings. Keep the keyword, center, spacing, and grid size with every reported result.
5. Use place search, comparison, and area exploration to identify competitors and evidence for gaps.
6. Separate observed API results from recommendations. Explain ARP, ATRP, SoLV, unfound grid points, and sample limitations.
7. Present prioritized actions tied to the observed evidence; do not promise ranking improvements.

## CLI

```bash
npx -y @cablate/mcp-google-map exec <tool> '<json_params>'
```

For exact parameters, read the relevant sections of `../google-maps/references/tools-api.md`.

## Boundaries

- Ordinary nearby-place discovery and place comparison belong to `google-maps`.
- Consumer travel itineraries belong to `google-maps-travel-planning`.
- Grid results are a sampled snapshot, not an exhaustive or stable representation of Google ranking.
- Do not recommend deceptive reviews, keyword stuffing, impersonation, or other policy-violating tactics.

## References

- `references/local-seo.md`: required audit method, competitor analysis, metrics, and reporting structure.
- `../google-maps/references/tools-api.md`: selected tool parameters and response shapes.
- `../_shared/setup-and-diagnostics.md`: first-run and failure recovery.
- `../_shared/content-attribution.md`: Places presentation requirements.
