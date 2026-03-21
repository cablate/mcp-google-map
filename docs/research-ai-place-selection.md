# AI 選店可行性研究報告：mcp-google-map

> Generated: 2026-03-20
> Based on: 5 parallel research agents (codebase audit, Google API review/context, route scheduling, filter capabilities, market analysis)
> Purpose: 評估「AI 選店」功能方向的技術可行性、市場需求、與現有能力的 gap

---

## Executive Summary

| 使用者提問 | 結論 |
|---|---|
| 評論做情境分類（約會/聚餐/商務）？ | **可行**。Google API 沒有原生情境分類，但 reviews 文字 + primaryType + priceLevel 讓 LLM 推理完全夠用。最快路徑：補 `primaryType`/`types` 欄位，交給宿主 Claude 判斷 |
| 動線順路 + 使用情境 + 避開尖峰？ | **大部分已有**。Skill reference 的 6-Layer Decision Model 已覆蓋動線順路（Arc Design + Along-Route Filling）和時段分配（Time-Slot Matching 用 AI 知識）。`plan_route` + `search_along_route` 是底層支撐。**唯一缺口是尖峰時段——Google 沒有 Popular Times API**，需 AI 推理或第三方 |
| 篩選停車/久坐/素食等條件？ | **高度可行**。Google API 有 20+ 個結構化欄位（停車、素食、聚會、親子、寵物等），**專案目前一個都沒拿**。加入 fieldMask 就立即解鎖 |
| 市場需求大不大？ | **很大**。90% 美國人線上選餐、20% 已用 AI。DoorDash Zesty 剛切入但封閉平台。開放 MCP 協議的 AI 選店引擎是藍海 |
| 目前主要是路線安排嗎？ | 目前 17 tools 覆蓋搜尋/路線/詳情/比較/環境。**基礎已足夠做選店的 6-7 成功能**，缺的是情境智能和多維篩選 |

### 現有規劃覆蓋度

| 文件 | 是否涉及選店 |
|---|---|
| `skills/google-maps/SKILL.md` | 否 — 定位為 Geospatial Query Capabilities |
| `dev-roadmap-spec.md` | 否 — 聚焦 air_quality / static_map / benchmark |
| `strategy-todo.md` | 否 — Sprint 5 在做 Routes API 遷移 |
| `mcp-google-map-growth-strategy-2026.md` | 否 — 聚焦星數成長和競品分析 |

**結論：AI 選店是全新方向，現有規劃完全沒有覆蓋。**

---

## 一、現有能力盤點

### 17 Tools 全覽（config.ts 實際註冊數；注意 `strategy-todo.md` 寫 18 tools 但與 config.ts 不一致）

| Tool 名稱 | 功能 | 底層 API | 選店相關度 |
|---|---|---|---|
| `maps_geocode` | 地址轉座標 | Geocoding API | 低 |
| `maps_reverse_geocode` | 座標轉地址 | Geocoding API | 低 |
| `maps_batch_geocode` | 批次地址轉座標（max 50） | Geocoding API | 低 |
| `maps_search_nearby` | 位置+類型搜尋附近地點 | Places API (New) searchNearby | **高** |
| `maps_search_places` | 自然語言地點搜尋 | Places API (New) searchText | **高** |
| `maps_place_details` | 地點完整詳情（評論/電話/營業時間/照片） | Places API (New) getDetails | **高** |
| `maps_directions` | A→B 路線導航 | Routes API computeRoutes | 中 |
| `maps_distance_matrix` | 多點距離/時間矩陣 | Routes API computeRouteMatrix | 中 |
| `maps_search_along_route` | 沿路線搜尋地點（按繞路時間排序） | Routes API searchAlongRoute | **高** |
| `maps_explore_area` | 一次呼叫探索區域（多類型+詳情） | searchNearby + getDetails 鏈結 | **高** |
| `maps_plan_route` | 多站最佳化路線（max 25 中繼點） | geocode + Routes waypoint opt | 中 |
| `maps_compare_places` | 並排比較多個地點 | searchText + getDetails + distanceMatrix | **高** |
| `maps_elevation` | 海拔查詢 | Elevation API | 低 |
| `maps_timezone` | 時區和當地時間 | Timezone API | 低 |
| `maps_weather` | 天氣預報 | Weather API | 低 |
| `maps_air_quality` | 空氣品質和健康建議 | Air Quality API | 低 |
| `maps_static_map` | 生成標記/路線的地圖影像 | Static Maps API | 低 |

### Services 架構

| Service | 功能 | 關鍵方法 |
|---|---|---|
| `NewPlacesService` | Places API (New) 客戶端 | searchNearby(), searchText(), getPlaceDetails() |
| `GoogleMapsTools` (toolclass.ts) | 通用 Google Maps API 客戶端 | geocode(), reverseGeocode(), getElevation(), getTimezone(), getWeather(), getAirQuality(), getStaticMap() |
| `RoutesService` | Routes API 客戶端 | computeRoutes(), computeRouteMatrix(), computeRoutesOptimized() |
| `PlacesSearcher` | Facade 層，整合以上三者 | 所有 tool 的業務邏輯入口 |

### 目前已取得的 Place Details 欄位

```
displayName, name, id, formattedAddress, location,
utcOffsetMinutes,
regularOpeningHours.periods, regularOpeningHours.weekdayDescriptions,
currentOpeningHours.openNow,
nationalPhoneNumber, websiteUri, priceLevel,
rating, userRatingCount,
reviews.rating, reviews.text, reviews.publishTime, reviews.authorAttribution.displayName,
photos.heightPx, photos.widthPx, photos.name
```

### 已能做的選店功能

| 能力 | 對應 Tool | 狀態 |
|---|---|---|
| 語義搜尋（「京都米其林餐廳」） | `maps_search_places` | 已有 |
| 半徑內找特定類型 | `maps_search_nearby` | 已有 |
| 評分/評論/營業時間/價格 | `maps_place_details` | 已有 |
| 並排比較 3-5 家 | `maps_compare_places` | 已有 |
| 到店路線和時間 | `maps_directions` | 已有 |
| 沿路線找順路餐廳 | `maps_search_along_route` | 已有 |
| 照片 URL（供 AI 視覺判斷） | `maps_place_details` maxPhotos | 已有 |

### 現有 Skill Reference 中的選店相關設計

`tools-api.md` 的 **Recipe 6: Place Comparison**（「Which restaurant should I pick?」）已經是 AI 選店的雛形：

```
1. maps_search_places — 找到候選餐廳
2. maps_place_details — 取每家完整詳情
3. maps_distance_matrix — 計算到使用者位置的距離
4. 呈現比較表：Rating | Reviews | Distance | Price | Open Now
```

**加入 atmosphere 欄位後，Recipe 6 會直接受益**——比較表可擴充為：Rating | Reviews | Distance | Price | Parking | Vegetarian | Good for Groups | Open Now。

同樣，`travel-planning.md` 的 **Layer 5: Meal Embedding** 是選店在旅遊情境中的應用——「用餐出現在旅行者到達的位置，不是搜全城最佳餐廳」。加入 atmosphere 欄位後，Meal Embedding 可額外考慮「這家順路的餐廳適不適合帶小孩」。

---

## 二、Gap 分析：API 有但專案沒拿的欄位

### Google Places API (New) 可用但未請求的結構化欄位

這是**最高 ROI 的改動**——加入 `placeFieldMask` 就立即解鎖。

#### 停車資訊 (parkingOptions)
| 欄位 | 說明 |
|---|---|
| `parkingOptions.freeParkingLot` | 免費停車場 |
| `parkingOptions.paidParkingLot` | 付費停車場 |
| `parkingOptions.freeStreetParking` | 免費路邊停車 |
| `parkingOptions.valetParking` | 代客泊車 |
| `parkingOptions.freeGarageParking` | 免費室內停車 |
| `parkingOptions.paidGarageParking` | 付費室內停車 |

#### 飲食選項
| 欄位 | 對應需求 |
|---|---|
| `servesVegetarianFood` | 素食餐點 |
| `servesBeer` / `servesWine` / `servesCocktails` | 酒類供應 |
| `servesBreakfast` / `servesLunch` / `servesDinner` / `servesBrunch` | 餐期 |
| `servesCoffee` / `servesDessert` | 咖啡/甜點 |
| `dineIn` / `delivery` / `takeout` / `curbsidePickup` | 用餐方式 |

#### 場景/氛圍
| 欄位 | 對應需求 |
|---|---|
| `goodForGroups` | 適合多人聚餐 |
| `goodForChildren` | 親子友善 |
| `goodForWatchingSports` | 適合看球賽 |
| `liveMusic` | 現場音樂 |
| `outdoorSeating` | 戶外座位 |
| `allowsDogs` | 寵物友善 |
| `menuForChildren` | 兒童菜單 |
| `reservable` | 可訂位 |
| `restroom` | 有廁所 |

#### 場所類型 + AI 摘要
| 欄位 | 說明 |
|---|---|
| `primaryType` | 精確場所類型（e.g., `wine_bar`, `sushi_restaurant`） |
| `types` | 多類型陣列 |
| `editorialSummary` | Google 官方編輯摘要 |
| `reviewSummary.text` | AI 生成的評論摘要（地區限制：美/英/印度/日本等 20 國） |
| `generativeSummary.overview` | AI 場所概述（僅美/印度） |

#### 無障礙
| 欄位 | 說明 |
|---|---|
| `accessibilityOptions.wheelchairAccessibleParking` | 輪椅停車位 |
| `accessibilityOptions.wheelchairAccessibleEntrance` | 輪椅入口 |
| `accessibilityOptions.wheelchairAccessibleRestroom` | 無障礙廁所 |
| `accessibilityOptions.wheelchairAccessibleSeating` | 無障礙座位 |

> **SKU 注意**：`parkingOptions`、`servesVegetarianFood`、`goodForGroups` 等欄位屬於 **Place Details Enterprise + Atmosphere SKU**。但我們的 `placeFieldMask` 已請求 `reviews.*`，而 `reviews` 同樣在此 SKU 中——**代表我們已經在付 Enterprise + Atmosphere 的價格**。Google 的 billing 只看最高 SKU tier，不看欄位數量，所以加入這些欄位**零額外成本**。

---

## 三、評論情境分類（約會/聚餐/商務）

### Google API 原始能力

| 項目 | 現況 |
|---|---|
| reviews 資料 | 最多 **5 則**，含 text/rating/publishTime/author。無法分頁取更多（硬限制） |
| 情境分類 | **沒有**。純原始文字，無標籤 |
| reviewSummary | AI 摘要，描述性，無情境分類。限美/英/印度/日本等 20 國 |
| generativeSummary | AI 場所概述，僅美/印度 |
| primaryType | 場所類型（`wine_bar`、`family_restaurant`），可間接推斷情境 |

### 情境分類方案比較

#### 方案 A：規則映射（primaryType + priceLevel）

```
wine_bar + priceLevel >= 3     → 約會高機率
karaoke / pub / night_club     → 朋友聚會
priceLevel >= 4                → 商務宴請可能
family_restaurant              → 家庭聚餐
```

| 優點 | 缺點 |
|---|---|
| 零成本、零延遲 | 精確度低（50-60%） |
| 確定性強、可測試 | 無法抓住評論中的細節 |

#### 方案 B：LLM 分析評論（Pass-through 模式，推薦）

```
MCP tool 回傳：5 則 reviews + primaryType + priceLevel
宿主 Claude 推理：{ dating: 0.9, friends: 0.7, family: 0.3, business: 0.5 }
```

| 優點 | 缺點 |
|---|---|
| 精確度高，能捕捉細節 | 評論只有 5 則，樣本偏少 |
| 零額外 API 成本（在宿主 LLM context 內推理） | 需要 LLM 有足夠上下文 |
| 多語言天然支援 | — |
| 架構上完全契合 MCP（tool 提供原料，LLM 做判斷） | — |

#### 方案 C：Google reviewSummary

| 優點 | 缺點 |
|---|---|
| 官方品質保障 | 無情境分類，只有描述性摘要 |
| — | 地理限制嚴重（美/英/印度為主） |
| — | 不保證每個場所都有 |

#### 方案 D：混合策略（最終推薦）

```
Layer 1: primaryType → 基礎情境排除（快速過濾）
Layer 2: priceLevel + rating → 品質信號
Layer 3: reviews 文本 → 宿主 LLM 分析（on-demand）
Layer 4: reviewSummary（如果地區支援）→ 補充摘要
```

### primaryType 與情境的對應關係

| 情境 | 可對應的 primaryType |
|---|---|
| 約會 | `wine_bar`, `cocktail_bar`, `fine_dining_restaurant`, `french_restaurant` |
| 商務 | `cafe`, `hotel_lobby`, `upscale_restaurant` |
| 家庭聚餐 | `chinese_restaurant`, `buffet_restaurant`, `family_restaurant` |
| 朋友聚會 | `bar_and_grill`, `pub`, `night_club`, `karaoke`, `brewpub` |

**侷限**：primaryType 是場所類型，不是場合適配性。同一個 `restaurant` 可能適合約會也可能不適合。類型是必要條件但不充分。

---

## 四、動線順路 + 使用情境 + 避開尖峰時段

### 現有能力：6-Layer Decision Model（已完整設計）

Skill reference `travel-planning.md` 已有完整的旅行規劃方法論，覆蓋了「動線順路」和「使用情境」的大部分需求：

| Layer | 名稱 | 做什麼 | 對應 Tool |
|---|---|---|---|
| 1 | Anchor Discovery | 搜尋 4-6 個地標錨點 | `maps_search_places` |
| 2 | Arc Design | 連接錨點成單向弧線，每天一個方向（不走回頭路） | `maps_distance_matrix` |
| 3 | Time-Slot Matching | 依**體驗品質**分配時段（伏見稻荷=清晨、購物區=下午、晚餐=終點站） | AI 知識（無需 tool） |
| 4 | Along-Route Filling | 在兩個錨點之間找**順路**的景點/餐廳 | `maps_search_along_route` |
| 5 | Meal Embedding | 用餐嵌入旅行者**該時間會在的位置**，不是搜全城最佳餐廳 | `maps_search_along_route` / `maps_search_nearby` |
| 6 | Rhythm Validation | 檢查節奏（不連看 5 間廟、主要景點 90-120 分、每天 5-7 站） | `maps_plan_route` + `maps_weather` |

**關鍵設計原則**：
- 「順路」靠 `maps_search_along_route`（結果按最小繞路時間排序），不是靠距離
- 「時段分配」靠 AI 的常識判斷（Layer 3），不需要演算法
- `maps_plan_route` 用 `optimize: false`（因為弧線方向已由 AI 決定），只做驗證
- 每天結尾用 `maps_static_map` 視覺化

### 已有 vs 缺什麼

| 需求 | 現有覆蓋 | 缺口 |
|---|---|---|
| 動線順路 | **已有** — Arc Design + Along-Route Filling | 無 |
| 使用情境（約會/商務/聚餐） | **部分** — Layer 3 的 AI 知識可做時段分配 | 無「情境驅動的選店」（見第三章） |
| 避開尖峰時段 | **部分** — Layer 3 寫了「伏見稻荷=清晨避人潮」 | 無即時人潮資料 |
| 營業時間約束 | **部分** — `maps_place_details` 可取營業時間，AI 可判斷 | 無自動化時間窗約束排程 |
| 交通流量感知 | **部分** — `maps_directions` 有 `departure_time` | `plan_route` 沒傳 `departureTime` |

### 唯一硬缺口：尖峰時段（Popular Times）

**Google 沒有官方 API 提供 Popular Times 資料。** `currentOpeningHours` 只有開/關，無人潮熱度。

| 方案 | 來源 | 可用性 | 風險 |
|---|---|---|---|
| **AI 推理**（現有 Layer 3 已在做） | LLM 常識 | 零成本，立即可用 | 不精確 |
| **Outscraper** | 爬 Google Maps | 商業 API，$0.015/call | 非官方，ToS 模糊 |
| **SerpAPI** | Google Maps 搜尋結果 | 商業 API | 非官方 |

### 可改善項目（小改動，非新 tool）

| 改動 | 說明 | 工作量 |
|---|---|---|
| `plan_route` 加 `departure_time` | RoutesService 底層已有支援，只是 planRoute 沒傳 | 小 |
| `distance_matrix` 加 `departure_time` | 同上 | 小 |

> **結論**：不需要新的 `maps_schedule_itinerary` tool。現有 6-Layer 模型 + tool chaining 已是完整解法。小改動（加 `departure_time`）可強化時間感知。

---

## 五、特定條件篩選（停車/久坐/素食）

### 條件三分法

| 分類 | 說明 | 解決方案 |
|---|---|---|
| **A 類：結構化欄位** | Google API 直接有 boolean 欄位 | 加 fieldMask 立即解鎖 |
| **B 類：語義搜尋** | textQuery 可近似 | `maps_search_places` 文字查詢 |
| **C 類：需 NLP** | 無結構化欄位，需從評論萃取 | LLM 讀 reviews 判斷 |

### 完整條件分類表

| 使用者條件 | 分類 | Google API 欄位 / 方法 | 目前狀態 |
|---|---|---|---|
| 停車方便 | A | `parkingOptions.freeParkingLot` / `freeStreetParking` / etc. | 未實作 |
| 有素食餐點 | A | `servesVegetarianFood` | 未實作 |
| 適合多人聚餐 | A | `goodForGroups` | 未實作 |
| 親子友善 | A | `goodForChildren` + `menuForChildren` | 未實作 |
| 寵物友善 | A | `allowsDogs` | 未實作 |
| 戶外座位 | A | `outdoorSeating` | 未實作 |
| 可以訂位 | A | `reservable` | 未實作 |
| 有酒類 | A | `servesBeer` / `servesWine` / `servesCocktails` | 未實作 |
| 價格範圍 | A | `priceLevel` | 已有但未作為搜尋篩選 |
| 無障礙 | A | `accessibilityOptions.*` | 未實作 |
| 有現場音樂 | A | `liveMusic` | 未實作 |
| 適合約會 | B | `textQuery: "romantic date restaurant"` + 結構化欄位組合 | 可透過 textQuery 近似 |
| 適合商務 | B | `textQuery: "business meeting"` + `reservable` + `priceLevel` | 可組合近似 |
| 氣氛好/浪漫 | B+C | textQuery 先過濾 + 評論確認 | 組合方案 |
| 適合久坐 | C | 無結構化欄位 | 需 LLM 分析評論 |
| 安靜/不吵 | C | 無結構化欄位 | 需 LLM 分析評論 |
| WiFi 好 | C | 無結構化欄位 | 需 LLM 分析評論 |
| 插座/充電位 | C | 無結構化欄位 | 需 LLM 分析評論 |

### Text Search 語義搜尋的可靠度

| 查詢類型 | 可靠度 | 說明 |
|---|---|---|
| "vegetarian restaurants in Taipei" | 高 | 明確類型，結合結構化欄位最佳 |
| "romantic restaurants for date night" | 中 | 有語義理解，但不精確 |
| "quiet cafe with comfortable seating" | 低-中 | 模糊，品質不穩定 |
| "parking friendly restaurant" | 低 | 屬性不是語義標籤，走結構化欄位更好 |

> **重要**：`textQuery` 排序基於知名度和評論關鍵字匹配，**不是結構化屬性過濾**。搜出來的結果只是「可能符合」，無法保證。

---

## 六、市場分析

### 競品格局

| 產品 | 定位 | 功能 | mcp-google-map 的差異 |
|---|---|---|---|
| **Google Maps MCP（官方）** | 基礎設施層 | Maps Grounding Lite：即時地點+天氣+路線 | 我們做**決策層**：多維篩選、比較、情境推理 |
| **DoorDash Zesty** | 封閉 AI 社交選店 | 對話式搜尋 + TikTok 聚合 + 品味學習 | 我們是**開放協議**，任何 Agent 都能接 |
| **Layla.ai** | 端到端旅遊代理 | 機票→飯店→活動→預訂 | 我們是**基礎設施**，讓旅遊工具更聰明 |
| **Wonderplan** | 旅遊行程規劃 | 偏好驅動推薦 + 預算感知 | 我們聚焦地圖能力的深度 |
| **Tripplanner.ai** | 行程最佳化 | 活動/休息/用餐平衡 | 我們提供精確的地理資料 |
| **ChatGPT/Gemini 直接問** | 通用 LLM | 無結構化地圖資料 | 我們提供**即時、精確的結構化資料** |

### 市場需求信號

| 數據點 | 來源 |
|---|---|
| 90% 美國人線上選餐 | Toast POS 2025 Survey |
| 20% 用 ChatGPT/Gemini 找餐廳 | Toast POS 2025 Survey |
| 86% 餐廳營運者對 AI 投資意願高 | Toast POS 2025 Survey |
| 30-80% 旅行者使用或考慮 AI 工具規劃行程 | SearchSpot 2026 |
| DoorDash 2025/12 推出 Zesty（AI 社交選店 App） | TechCrunch |
| Google 2025/12 發布官方託管 MCP Servers | Google Cloud Blog |

### 差異化機會

| 機會 | 說明 | 市場競爭度 |
|---|---|---|
| **AI Agent 選店引擎** | 開放 MCP 協議，任何 Agent（約會/旅遊/企業）都能接入 | 藍海 |
| **情境感知即時決策** | 「我在 X、3 人、30 分鐘、有人過敏、$50 預算」→ 最佳方案 | 無直接競品 |
| **B2B 團隊決策** | 同事聚餐/客戶招待，多人協作 | 完全空白 |
| **旅遊工具大腦** | 作為 Layla/Wonderplan 等工具的底層地圖決策引擎 | 中度競爭 |

---

## 七、建議路線圖

### Phase 1：資料擴充（1-2 天，零新 tool）

在 `NewPlacesService.ts` 的 `placeFieldMask` 加入：

```
primaryType, types, editorialSummary,
parkingOptions.freeParkingLot, parkingOptions.paidParkingLot,
parkingOptions.freeStreetParking, parkingOptions.valetParking,
parkingOptions.freeGarageParking, parkingOptions.paidGarageParking,
accessibilityOptions.wheelchairAccessibleParking,
accessibilityOptions.wheelchairAccessibleEntrance,
accessibilityOptions.wheelchairAccessibleRestroom,
accessibilityOptions.wheelchairAccessibleSeating,
servesVegetarianFood, servesBeer, servesWine, servesCocktails,
servesBreakfast, servesLunch, servesDinner, servesBrunch,
servesCoffee, servesDessert,
goodForGroups, goodForChildren, goodForWatchingSports,
liveMusic, outdoorSeating, allowsDogs, menuForChildren,
dineIn, delivery, takeout, curbsidePickup, reservable, restroom,
reviewSummary.text, reviewSummary.disclosureText,
generativeSummary.overview,
reviews.text.languageCode
```

**效果**：`maps_place_details` 和 `maps_compare_places` 立即能回答 80% 的篩選問題。現有 Recipe 6（Place Comparison）比較表直接從 5 欄擴充到 10+ 欄。

**完整改動範圍**（不只是加 fieldMask）：
1. `NewPlacesService.ts` — 加入 placeFieldMask 新欄位
2. `PlacesSearcher.ts` — 更新 response 轉換邏輯，把新欄位暴露到 tool output
3. `placeDetails.ts` — 如果做 opt-in 機制，需更新 SCHEMA
4. `tools-api.md` — 更新 `maps_place_details` 的 response 文件
5. 依 CLAUDE.md checklist 同步其餘檔案

**成本影響**：零。我們已請求 `reviews.*`（屬 Enterprise + Atmosphere SKU），Google billing 只看最高 tier，加入同 tier 的其他欄位不增加費用。不需要 opt-in 機制。

### Phase 2：時間感知強化（小改動）

- `maps_plan_route` 加 `departure_time` 參數（RoutesService 底層已有支援，只是沒傳）
- `maps_distance_matrix` 加 `departure_time` 參數
- 讓現有 6-Layer Decision Model 的 Layer 6（Rhythm Validation）有即時交通資料

### Phase 3：情境推理驗證（零 code，靠 prompt + tool chaining）

驗證流程（利用現有 6-Layer Model 的 Layer 5 Meal Embedding）：
1. `maps_search_places`（「台北適合約會的餐廳」）
2. → `maps_place_details`（取 reviews + primaryType + atmosphere 欄位）
3. → 宿主 LLM 推理情境適配度
4. → `maps_compare_places` 並排呈現
5. 驗證 5 則 reviews 做情境分類的準確度

### Phase 4：差異化功能

- Popular Times 第三方整合（Outscraper 等）——補齊 6-Layer Model 中 Layer 3 Time-Slot Matching 的唯一缺口
- 評論趨勢分析（近期評分上升/下降）
- 預訂可用性整合（OpenTable/HotPepper）

---

## 八、技術實作要點

### MCP 架構下的 LLM 推理模式

MCP server 本身不持有 LLM 能力。情境分類有兩條路：

| 路徑 | 方式 | 複雜度 | 推薦 |
|---|---|---|---|
| **Pass-through** | Tool 回傳 reviews 原始文字，宿主 Claude 分析 | 低 | **推薦** |
| **Server-side** | MCP server 呼叫 OpenAI/Gemini API 分析 | 高 | 不推薦 |

Pass-through 完全契合 MCP 設計哲學：**tool 提供原料，LLM 做判斷**。

### 費用影響評估

| 欄位類別 | SKU | 增加成本 |
|---|---|---|
| primaryType, types, displayName | Place Details Pro | 已觸發（我們已請求 displayName） |
| parkingOptions, serves*, goodFor*, reviews*, reviewSummary, generativeSummary | **Enterprise + Atmosphere** | **零**——已觸發（我們已請求 `reviews.*`） |
| accessibilityOptions | Place Details Pro | 已觸發 |

**結論**：Google billing 只看最高 SKU tier，不按欄位數量計費。我們已在付 Enterprise + Atmosphere 的價格（因為 `reviews`），所以加入同 tier 的所有欄位完全免費。不需要 opt-in 機制。

---

## 九、結論

mcp-google-map 已具備做「AI 選店」的 6-7 成基礎能力。**最大的 gap 不是技術難度，而是 Google API 已有的結構化欄位沒有被拿回來**。

三個核心行動：
1. **加 fieldMask**（1-2 天）→ 立即解鎖停車/素食/聚會/親子等 20+ 篩選條件
2. **加 departure_time**（半天）→ 強化現有 6-Layer Decision Model 的時間感知
3. **靠 LLM pass-through 做情境推理**（零 code）→ 驗證約會/商務/聚餐分類需求

路線排程方面，現有 `travel-planning.md` 的 6-Layer Decision Model 已是完整解法，不需要新 tool。

市場需求明確且競爭格局有利：開放 MCP 協議的 AI 選店引擎目前沒有直接競品。

---

## Sources

- [AI-powered review summaries | Places API](https://developers.google.com/maps/documentation/places/web-service/review-summaries)
- [AI-powered place summaries | Places API](https://developers.google.com/maps/documentation/places/web-service/place-summaries)
- [Place Types (New) | Places API](https://developers.google.com/maps/documentation/places/web-service/place-types)
- [Place Data Fields (New) | Places API](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [REST Resource: places | Places API](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)
- [Text Search (New) | Places API](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Specify the traffic model type | Routes API](https://developers.google.com/maps/documentation/routes/traffic-model)
- [Optimize the order of stops | Routes API](https://developers.google.com/maps/documentation/routes/opt-way)
- [Optimizing LLM-based trip planning | Google Research](https://research.google/blog/optimizing-llm-based-trip-planning/)
- [DoorDash Zesty Launch | TechCrunch](https://techcrunch.com/2025/12/16/doordash-rolls-out-zesty-an-ai-social-app-for-discovering-new-restaurants/)
- [Google MCP Servers Launch | Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)
- [2025 AI in Restaurants Survey | Toast POS](https://pos.toasttab.com/blog/data/ai-in-restaurants)
- [AI Travel Planners 2026 | SearchSpot](https://blog.searchspot.ai/comparing-best-ai-travel-planners-2026/)
