# Travel Planning Best Practices

## The #1 Anti-Pattern: Single-Point Exploration

**Wrong:** `explore_area("Kyoto")` → everything clusters around Kyoto Station / one area.

**Right:** Identify distinct districts first, then explore each separately.

---

## Correct Flow for Multi-Day Trip Planning

### Step 1: Identify City Districts (use your own knowledge + search)

Before calling any geo tool, break the city into 3-6 distinct districts based on geography and character. You already know major cities — use that knowledge.

Example for Kyoto:
- **Higashiyama** (east): Kiyomizu-dera, Gion, Yasaka Shrine, Ninenzaka
- **Arashiyama** (west): Bamboo Grove, Tenryu-ji, Togetsukyo Bridge
- **Fushimi** (south): Fushimi Inari, sake breweries
- **Central/Nishiki** (downtown): Nishiki Market, Pontocho, Kawaramachi
- **Northern**: Kinkaku-ji, Ryoan-ji, Daitoku-ji

### Step 2: Assign Districts to Days by Geography

Group **geographically adjacent** districts into the same day. Each day should follow a **directional arc** (e.g. south→north, east→west) — never zigzag.

Example:
- Day 1: Fushimi (morning) → Higashiyama (afternoon/evening) — south to east arc
- Day 2: Central/Nishiki (morning) → Arashiyama (afternoon) — center to west arc

### Step 3: Explore Each District Separately

Call `explore_area` (or `search_nearby`) **per district**, not per city:

```
explore_area("Fushimi Inari, Kyoto", types: ["temple", "restaurant"])
explore_area("Gion, Kyoto", types: ["restaurant", "attraction"])
explore_area("Arashiyama, Kyoto", types: ["temple", "restaurant", "cafe"])
```

### Step 4: Build Linear Routes Per Day

For each day, order stops to form a **geographic line or arc** — not a loop that backtracks:

```
Day 1: Fushimi Inari → Kiyomizu-dera → Sannen-zaka → Gion lunch → Yasaka Shrine → Pontocho dinner
       (south ──────────────────────────────────────────────────────────→ north-west)

Day 2: Nishiki Market → Kawaramachi → train to Arashiyama → Bamboo Grove → Tenryu-ji → kaiseki dinner
       (center ────────────────────────────────────→ west)
```

Use `plan_route` with `optimize: false` when you've already determined a logical geographic order. Set `optimize: true` only when you have a set of stops in the same area with no obvious direction.

### Step 5: Validate the Route Makes Sense

After generating the route, check:
- [ ] Total walking distance per day is realistic (< 10km for walking, < 20km mixed)
- [ ] No backtracking: the route doesn't go A→B→A area
- [ ] Meal timing: lunch 11:30-13:00, dinner 17:30-19:30
- [ ] Opening hours: temples often close at 17:00, markets by 18:00
- [ ] Transit: if two stops are >3km apart, suggest transit instead of walking

---

## Common Anti-Patterns

| Anti-Pattern | What Goes Wrong | Fix |
|-------------|-----------------|-----|
| **Single-point explosion** | `explore_area("Kyoto")` → all results in 1km radius | Explore per district |
| **Backtracking route** | A(east) → B(west) → C(east) → D(west) | Group by geography, route as arc |
| **Ignoring transit** | 5km walk between stops | Use distance_matrix to detect >2km gaps, suggest transit |
| **Tourist-only results** | Only famous spots, no local gems | Mix `search_nearby` (type-based) with `search_places` (query: "local favorite ramen in X") |
| **Time blindness** | 8 stops in one day, each "1 hour" | Budget 2-3hr for major temples, 30-60min for shops, include transit time |
| **Same-type clustering** | 5 temples in a row | Alternate: temple → food → walk → shrine → cafe |

---

## Time Budget Guidelines

| Activity Type | Typical Duration |
|-------------|-----------------|
| Major temple/shrine | 60-120 min |
| Small shrine / photo spot | 15-30 min |
| Museum | 90-180 min |
| Market / shopping street | 60-90 min |
| Sit-down meal (kaiseki, etc.) | 60-120 min |
| Quick meal / street food | 20-40 min |
| Cafe break | 30-45 min |
| Walking between stops (<1km) | 10-15 min |
| Transit between areas | 20-40 min |

A realistic day fits **5-7 stops** with meals, not 10+.

---

## When to Read This Document

- When the user asks to "plan a trip", "create an itinerary", or "plan X days in Y"
- When the result of a trip plan shows clustering in one area
- When building multi-day travel content
