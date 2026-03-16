# Travel Planning Best Practices

## The #1 Anti-Pattern: Single-Point Exploration

**Wrong:** `explore_area("Kyoto")` → everything clusters within 1km of one geocoded point.

**Right:** Use `search_places` first to get geographically diverse anchor points across the city, then explore around each anchor.

---

## Correct Flow: Tool-Driven Geographic Spread

### Step 1: Get Anchor Points via search_places

`search_places` returns results that are **naturally spread across the city** (Google's algorithm ranks geographic diversity). Use this as your first call to establish the spatial skeleton.

```
search_places("top attractions in Kyoto")
→ Fushimi Inari (south), Kiyomizu-dera (east), Kinkaku-ji (north), Arashiyama (west), Nijo Castle (center)
```

These anchor points span ~10km. This is your trip skeleton.

### Step 2: Cluster Anchors into Days by Proximity

Look at the coordinates from Step 1. Group **geographically close** anchors into the same day, and arrange each day as a **directional arc** (south→north, east→west) — never zigzag.

Example:
- Day 1: Fushimi Inari (south) → Kiyomizu-dera (east) → Gion area → Pontocho (center) — **south→east→center arc**
- Day 2: Nishiki Market (center) → Nijo Castle → train → Arashiyama (west) — **center→west arc**

### Step 3: Fill In Between Anchors

For each anchor, use it as the center point for `explore_area` or `search_nearby` to find **supporting stops** (restaurants, cafes, shops) along the route:

```
explore_area("Fushimi Inari, Kyoto", types: ["restaurant"], radius: 800)
explore_area("Gion, Kyoto", types: ["restaurant", "cafe"], radius: 500)
explore_area("Arashiyama, Kyoto", types: ["restaurant", "cafe"], radius: 600)
```

Key: these searches use the **anchor's coordinates as center**, not the city name. Each search finds places **near that day's route**, not random places across the city.

### Step 4: Build Linear Route Per Day

Order stops to form a **one-directional path**. Each stop should be **further along the arc** than the previous one — never backtrack.

```
Day 1 (south → center):
  Fushimi Inari → [local lunch near Inari] → Kiyomizu-dera → Sannen-zaka → [Gion restaurant] → Yasaka Shrine → Pontocho dinner

Day 2 (center → west):
  Nishiki Market → [street food] → Nijo Castle → [cafe break] → train to Arashiyama → Bamboo Grove → Tenryu-ji → [kaiseki dinner]
```

Use `plan_route` with `optimize: false` when you've determined the geographic order. Use `optimize: true` only for stops within the same small area with no obvious direction.

### Step 5: Visualize with Maps

**Always** call `static_map` after building each day's route:
- Use numbered markers (label:1, label:2, ...) for each stop
- Use path to draw the route
- Use different marker colors per category (red=temple, blue=restaurant, green=park)

The map is the primary visual deliverable. Never skip this step.

---

## Why This Works

| Approach | Geographic spread | Unknown cities | Visual output |
|----------|------------------|----------------|---------------|
| `explore_area("city name")` | 1km radius — bad | Fails | None |
| AI pre-knowledge of districts | Good for famous cities | Fails for unknown | None |
| **search_places → anchor → expand** | Natural 5-15km spread | Works everywhere | Map per day |

The key insight: **Google's search_places algorithm does the geographic spreading for you.** You don't need to know the city's districts — the search results reveal them.

---

## Common Anti-Patterns

| Anti-Pattern | What Goes Wrong | Fix |
|-------------|-----------------|-----|
| **Single-point explosion** | `explore_area("Kyoto")` → 1km cluster | search_places first → use results as centers |
| **Backtracking route** | A(east) → B(west) → C(east) | Sort stops by geographic direction per day |
| **No map output** | Text/JSON only, no visual | Always call static_map after route |
| **Ignoring transit** | 5km walk between stops | >2km gap → suggest transit |
| **Same-type clustering** | 5 temples in a row | Alternate: temple → food → walk → shrine → cafe |
| **Time blindness** | 10 stops in one day | Budget 5-7 stops max (see time table below) |
| **Tourist-only results** | Only famous spots | Mix search_nearby (type) with search_places ("local favorite ramen in X") |

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

## Validation Checklist

After generating the itinerary, verify:
- [ ] Stops span multiple areas of the city (not all within 1km)
- [ ] Each day follows one geographic direction (no zigzag)
- [ ] Total walking per day < 10km (suggest transit for >2km gaps)
- [ ] Meal timing: lunch 11:30-13:00, dinner 17:30-19:30
- [ ] Opening hours: temples often close 17:00, markets by 18:00
- [ ] Activity variety: not 5 of the same type in a row
- [ ] A map is generated for each day

---

## When to Read This Document

- When the user asks to "plan a trip", "create an itinerary", or "plan X days in Y"
- When a trip plan clusters all stops in one small area
- When building multi-day travel content
