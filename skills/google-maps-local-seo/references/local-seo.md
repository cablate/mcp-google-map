# Local SEO — Google 商家排名分析

## Core Principle

Local SEO is **competitive intelligence through public data**. Every business on Google Maps exposes its ranking signals: category, reviews, photos, hours, website. An AI agent with geo tools can audit a business's competitive position and identify actionable gaps — work that Local SEO consultants charge $30K–50K TWD for.

The Google Maps ranking algorithm weighs three factors:
1. **Distance** — proximity to the searcher
2. **Relevance** — how well the business matches the search query (categories, keywords in reviews/menus/services)
3. **Prominence** — overall reputation (review count, rating, web mentions, citations)

Distance is fixed. Relevance and Prominence are what we analyze.

---

## The 5-Layer Analysis Model

### Layer 1: Keyword Landscape
**What:** Understand what searchers type and who ranks for it.
**Tool:** `maps_search_places("{keyword} in {area}")`
**Example:**
```
maps_search_places("牛肉湯 台南")          → who ranks for this keyword?
maps_search_places("餐廳 台南中西區")       → broader category competition
maps_search_places("medical clinic Taipei")  → English keyword landscape
```
**Output:** Top competitors list with place_ids for deeper analysis.

### Layer 2: Competitor Deep Dive
**What:** Compare ranking signals across top competitors.
**Tool:** `maps_compare_places` or `maps_place_details` per competitor
**Signals to extract:**
- Rating + review count (prominence)
- Business categories (primary + secondary)
- Has website / phone / hours (completeness)
- Photo count (`photo_count` field)
- Review content keywords

```
maps_compare_places({
  query: "牛肉湯 台南",
  maxResults: 5,
  includeDistance: true,
  referenceLocation: "target business address"
})
```

**Key insight from practitioners:** A restaurant with category "日式餐廳" ranks differently than one with "餐廳". The primary category determines which search terms surface the business. Secondary categories add breadth.

### Layer 3: Gap Analysis
**What:** Identify where the target business falls short vs competitors.
**Tool:** `maps_place_details(target_place_id, maxPhotos: 5)` vs competitor details
**Checklist:**

| Signal | Check | Fix if missing |
|--------|-------|----------------|
| Primary category | Matches highest-volume keyword? | Change to broader or more specific |
| Review count | Within 80% of top competitor? | Review acquisition campaign |
| Rating | ≥ 4.2? | Address negative reviews |
| Photos | ≥ 10? With menu/interior/exterior? | Upload photos |
| Website | Present? | Add website link |
| Hours | Accurate? Special hours set? | Update hours |
| Menu/Services | Complete? Keywords match search terms? | Add items with searchable names |

**Practitioner insight:** Menu item names must match what people search. If you sell 半熟蛋 (soft-boiled egg) but call it "大太陽" on your menu, the algorithm cannot match the search query to your business.

### Layer 4: Area Density & Opportunity
**What:** Find underserved areas or oversaturated markets.
**Tool:** `maps_explore_area` or `maps_search_nearby` with type filters
```
maps_explore_area({
  location: "大安區, 台北",
  types: ["restaurant", "cafe", "dentist"],
  radius: 1000
})
```
**Analysis:**
- High density + low avg rating = opportunity (bad competitors)
- Low density = blue ocean (no competitors)
- High density + high avg rating = red ocean (avoid or differentiate)

### Layer 5: Monitoring Snapshot
**What:** Capture current ranking position for future comparison.
**Tool:** `maps_search_places("{keyword}")` → record rank position of target business
```
maps_search_places("台南牛肉湯")
→ Result: target business at position #4
→ Baseline recorded. Re-run monthly to track movement.
```

---

## Tool Call Sequences

### Scenario A: Full Competitor Audit (new client)
```
Phase 1 — Keyword Discovery (2-3 calls)
  maps_search_places("{primary keyword} {area}")      → top competitors
  maps_search_places("{secondary keyword} {area}")     → additional competitors
  maps_search_places("{category} near {address}")      → proximity competitors

Phase 2 — Deep Comparison (1-2 calls)
  maps_compare_places(top 5 competitors + target)      → side-by-side signals
  maps_place_details(target, maxPhotos: 5)             → full target audit

Phase 3 — Area Analysis (1-2 calls)
  maps_explore_area(target location, multiple types)   → neighborhood context
  maps_search_nearby(target coords, same type, 2km)    → direct competitors within radius

Phase 4 — Visualize (1 call)
  maps_static_map(markers for all competitors + target) → competition map

Total: ~8-10 calls for a full audit
```

### Scenario B: Quick Rank Check (existing client)
```
maps_search_places("{target keyword}")                 → find rank position
maps_place_details(target_place_id)                    → current signals snapshot
Total: 2 calls
```

### Known Edge Case
`maps_search_nearby` keyword parameter does not support Chinese category names (e.g., "日式餐廳"). Use English types (e.g., "japanese_restaurant") or use `maps_explore_area` / `maps_search_places` as alternatives — they handle Chinese queries correctly.

### Scenario C: New Location Scouting
```
maps_explore_area(candidate area, target business type) → competitor density
maps_search_nearby(coords, type, radius: 2000)          → detailed competitor list
maps_distance_matrix(candidate locations, key landmarks) → accessibility analysis
maps_static_map(area with competitor markers)            → visual density map
Total: 4 calls
```

---

## Google Business Profile Signals Reference

### Signals the algorithm considers (from practitioner testing)

| Signal | Weight | How to check with our tools |
|--------|--------|-----------------------------|
| Primary business category | High | `place_details` → types |
| Review count | High | `place_details` → user_ratings_total |
| Average rating | High | `place_details` → rating |
| Review content keywords | High | `place_details` → reviews text |
| Photo count & quality | Medium | `place_details` → photo_count |
| Business info completeness | Medium | `place_details` → website, phone, hours |
| Menu/Service items | Medium (industry-specific) | `place_details` → check if present |
| Review response rate | Medium | Not directly visible via API |
| External citations (blogs, news) | Medium | Not available via Maps API |
| NAP consistency (Name, Address, Phone) | Medium | `place_details` → verify across sources |
| Google Posts activity | Low | Not available via API |

### What we CAN'T see (requires Business Profile backend access)
- Search keyword impressions
- Profile view breakdown (Maps vs Search, Mobile vs Desktop)
- Direct vs Discovery search ratio
- Call/direction/website click counts
- Local 3-Pack appearance rate

### AI Mode recommendations
Google's AI Mode pulls from:
1. Business Profile data (hours, description, categories)
2. Review content (specific mentions of products/services)
3. External links (blogs, news, forums)
4. Rating + review count (credibility signal)

High rating + high review count + keyword-rich reviews = higher chance of AI recommendation.

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| Keyword stuffing in business name | "台北最好吃牛肉麵-王記牛肉麵" | Use real business name; keywords go in reviews/menu |
| Ignoring secondary categories | Only one category set | Add relevant secondary categories |
| Generic menu names | Creative names nobody searches for | Use searchable names that match queries |
| Photo desert | 0-3 photos | Upload 10+ (exterior, interior, menu items, team) |
| Review neglect | Many reviews with no owner reply | Reply to all reviews (affects activity score) |
| Wrong primary category | "餐廳" when should be "日式餐廳" or vice versa | Match to highest-value keyword for your positioning |
| Comparing wrong metrics | Comparing summer vs winter data | Compare year-over-year same period |

---

## Industry-Specific Notes

| Industry | Key ranking lever | Tool check |
|----------|------------------|------------|
| **Restaurants** | Menu completeness + review keywords about dishes | `place_details` → check menu presence |
| **Medical/Clinics** | Review keywords about treatments + rating | `search_places("推薦 {specialty} {area}")` |
| **Retail** | Product catalog + photos | `place_details` → photo_count |
| **Hotels/B&B** | Amenity details + review sentiment | `place_details` → reviews |
| **Services (plumber, lawyer, etc.)** | Service area coverage + review count | `search_nearby` to check competition density |
| **Real estate** | Area expertise signals + review testimonials | `explore_area` for neighborhood analysis |

---

## When to Read This

- User asks to analyze a business's Google Maps ranking
- User wants to compare competitors in an area
- User says "Local SEO", "商家排名", "地圖行銷", "Google Business Profile"
- User wants to scout a location for a new business
- User asks "why does competitor X rank higher than me?"
