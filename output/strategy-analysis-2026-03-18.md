# mcp-google-map 策略分析報告 — 2026-03-18

> 基於：專案現況、3 份研究文件、競品調查、市場搜尋、使用者與朋友的討論
> 目的：規劃下一階段方向

---

## 一、現況快照

| 指標 | 數值 |
|------|------|
| Stars | **217**（從研究時 192 成長） |
| Forks | 63 |
| Tools | **17**（14 atomic + 3 composite） |
| 版本 | v0.0.42（v0.0.43 releasing） |
| npm 下載 | ~1k/月穩定 |
| Open Issues | 1 |

### 已完成（Sprint 1-2.5）

- README 改版、等距城市風 banner、shields.io badges
- stdio transport 支援
- Composite tools（explore_area, plan_route, compare_places）
- Namespace unification（全部 `maps_` prefix）
- Demo 截圖（EN/ZH 四宮格）
- Photo URLs（maxPhotos 參數整合進 place_details）
- MCP Registry 發佈（`io.github.cablate/google-map`）
- awesome-mcp-servers PR #3199
- anthropics/skills PR #644
- GitHub Discussions 已開啟
- ENABLED_TOOLS env var
- Skill tool name alignment

### 未完成但已規劃

| 項目 | 狀態 |
|------|------|
| 5 個 MCP 目錄網站提交 | 手動，未做 |
| Cline Marketplace 提交 | 未做 |
| HN "Show HN" 發文 | README ready，未執行 |
| Demo 影片 | 未做 |
| language 參數（Issue #16） | 未做 |
| MCP Prompt Templates | 未做 |
| Blog / Dev.to 文章 | 未做 |
| Geo-Reasoning Benchmark | 研究階段 |

---

## 二、使用者願景（來自與朋友 cyesuta 的討論）

### 核心路徑

> **旅遊規劃（驗證空間推理概念）→ GIS 應用（圖資、房地產、模擬）→ 更廣泛的地理空間 AI 平台**

### 關鍵討論摘要

- 使用者（CabLate）想認真搞 Google Maps，因為競品少、旅遊規劃有需求
- 旅遊規劃是「實踐空間概念」的第一步，之後要延伸到 GIS、圖資、房地產、模擬
- 朋友 cyesuta 有旅遊規劃 + 土地圖資的 domain knowledge，但指出：
  - 旅遊規劃的 if 條件極多，歸納成有邏輯的 skill 很難
  - 每個地方差異大，同一國家不同區域的 knowledge 不通用
  - 文化/歷史/地理/政治融合是 AI 目前做不到的（網上資料匱乏）
- 策略共識：**先聚焦台灣，其他地方做個意思意思，讓社群去貢獻**
- 想法：「粗暴窮舉也是一個做法，說不定 AI 的隨機性能蹦出什麼新玩意」

---

## 三、競品全景（2026-03-18 更新）

### 地理空間 MCP 競品矩陣

| Server | Stars | Tools | Transport | 核心優勢 |
|--------|-------|-------|-----------|---------|
| **baidu-maps/mcp** | **411** | 10 | stdio+SSE | 中國市場先行者，雙語 README |
| **Mapbox MCP** | **315** | 20+ | stdio | 市場領導者，離線 Turf.js、TSP、Isochrone |
| **cablate/mcp-google-map（我們）** | **217** | **17** | stdio+HTTP | Google Maps 品類最大、Agent Skill、exec CLI |
| jagan/open-streetmap-mcp | 172 | 12 | stdio | 零 API key |
| googlemaps/platform-ai | 90 | N/A | - | 文件 grounding，非 API 存取 |
| **Google Grounding Lite** | N/A | 3 | HTTP | 官方 Google 託管，免費實驗 |

### vs Google Grounding Lite

| | 我們 | Grounding Lite |
|---|---|---|
| Tools | **17** | 3 |
| Geocoding | Yes | No |
| Step-by-step directions | Yes | No |
| Elevation | Yes | No |
| Distance matrix | Yes | No |
| Place details + photos | Yes | No |
| Timezone | Yes | No |
| Air quality | Yes | No |
| Static map images | Yes | No |
| Composite tools | Yes | No |
| Open source | MIT | No |
| Agent Skill | Yes | No |

### 旅遊規劃 MCP 競品

| Server | 特色 | 威脅程度 |
|--------|------|---------|
| TRAVEL-PLANNER-MCP-Server | 基於 Google Maps，但功能簡陋 | 低 |
| mcp_travelassistant | 6 個 MCP server 組合（航班+飯店+活動+天氣+預算） | 中（架構參考） |
| Apify AI Travel Planner | 商業方案 | 低（不同定位） |
| Azure AI Travel Agents | 微軟旗艦範例，LlamaIndex + MCP + Azure | 高（品牌背書） |
| Expedia MCP | 正在建設中 | 高（資料量優勢） |

**關鍵差異**：沒有一個競品有 Agent Skill + 17 geo tools + composite tools 的組合。

### GIS/Agentic 平台

| 平台 | 定位 | 與我們的關係 |
|------|------|-------------|
| CARTO | Agentic GIS Platform，企業級，有 MCP Server | 不直接競爭，但定義了 GIS+AI 的方向 |
| ESRI | 傳統 GIS 龍頭，AI copilot 整合中 | 企業市場，不競爭 |
| Mapbox Agent Skills | 地理空間 skills，和 MCP server 分開 | 直接可參考的設計模式 |

---

## 四、市場趨勢

### AI + 地圖

- Google "Ask Maps"（2026-03-12）= Google 級驗證「AI + 地圖」賽道
- MIT 研究：LLM 無 tool 旅行規劃成功率 **~4%**，Maps API 是必需品
- 62% 年輕旅客已用 AI 做規劃
- ChatGPT 無原生 Maps 整合 = 巨大空白

### GIS + AI（2026 趨勢）

- 2026 被稱為「GIS 的 GPT moment」— 通用 AI 模型開始處理地理空間數據
- GIS 軟體市場 CAGR 10.8%（至 2033）
- 從回顧型 GIS → 預測型 GIS（洪水預測、植被風險、基建退化）
- 房地產：AI + GIS 是「最具變革性趨勢」

### Google Maps API 變化

- **Directions API + Distance Matrix API 已標為 Legacy**（2025-03-01）
- **Routes API** 取代兩者，新功能只在 Routes API
- Routes API 新增：Waypoint Optimization（最多 98 點自動排序）、Transit
- Places API (New) 持續更新，Legacy Places API 不再有新功能

### 台灣開放資料

- 不動產實價登錄 API（data.gov.tw）— 每 10 天更新
- 台北地理資訊 e 點通
- 中研院 QGIS 資源網
- 各縣市政府資料平台

---

## 五、三條策略路線

### 路線 A：繼續做「最好的 Google Maps MCP Server」（短期高 ROI）

**優勢**：確定性高，能把 217→500+ stars
**天花板**：Google Maps API wrapper 想像空間有限

待做高槓桿項目：

| 項目 | 工時 | 影響 |
|------|------|------|
| Cline Marketplace 提交 | 1hr | 百萬 Cline 用戶曝光 |
| 5 個 MCP 目錄提交 | 2hr | 長尾曝光 |
| HN "Show HN" 發文 | 2hr | 平均 +121 stars/day |
| Demo 影片（30-60秒） | 4hr | Figma 成功公式 #1 |
| language 參數（Issue #16） | 4hr | 國際化 |
| MCP Prompt Templates | 6hr | Claude Desktop 使用者一鍵用 |

### 路線 B：旅遊規劃垂直深入（中期方向）

**市場驗證**：MIT 4% 成功率、Google Ask Maps、微軟 Azure AI Travel Agents、Expedia MCP

現有 17 tools 已能 cover 旅遊規劃 80%。缺口：

| 缺口 | 解法 |
|------|------|
| 航班/交通資訊 | 外部 API（不在 Google Maps 範圍） |
| 住宿搜尋 | 外部 API |
| 行程排程邏輯 | Routes API Waypoint Optimization |
| 台灣特有 knowledge | Domain knowledge（朋友 expertise） |

具體可做：
1. MCP Prompt Template: `travel-planner` — Claude Desktop 使用者一鍵啟動旅遊規劃
2. `maps_plan_route` 強化 — 接上 Routes API Waypoint Optimization（98 waypoints）
3. `travel-planning.md` skill 深化 — 灌入台灣旅遊 domain knowledge
4. Blog: "Build an AI Travel Planner with MCP" — 乘微軟/Expedia 話題

### 路線 C：GIS 平台（長期願景）

**市場信號**：CARTO Agentic GIS、ESRI AI copilot、GIS 的 GPT moment

**現實挑戰**：
- CARTO 是企業級產品，直接競爭不現實
- 房地產/圖資需要的資料源遠超 Google Maps API
- 每個地方差異太大，泛化困難
- 時機未到

**埋種子的方式**：
- `maps_static_map` 已有 — GIS 視覺化入口
- Geo-Reasoning Benchmark — 證明 AI + geo tools 價值
- README Use Cases 已包含 Real estate / Urban planning
- 台灣開放資料串接（實價登錄 → 未來新 tool）

---

## 六、建議：路線 A+B 混合，C 埋種子

### 立即可做（本週）

| # | 項目 | 為什麼 | 工時 |
|---|------|--------|------|
| 1 | Cline Marketplace 提交 | 百萬用戶，1 小時完成 | 1hr |
| 2 | 5 個 MCP 目錄提交 | 手動填表，長尾曝光 | 2hr |
| 3 | HN "Show HN" 發文 | README 已經很強，現在是好時機 | 2hr |

### 下一個 Sprint（1-2 週）

| # | 項目 | 為什麼 | 工時 |
|---|------|--------|------|
| 4 | MCP Prompt Templates（travel-planner, neighborhood-scout, route-optimizer） | 獨家功能，Claude Desktop 使用者直接用 | 6hr |
| 5 | language 參數（Issue #16） | 國際化，日本/台灣使用者需要 | 4hr |
| 6 | Demo 影片 | 最高轉換率的行銷素材 | 4hr |

### 中期（2-4 週）

| # | 項目 | 為什麼 | 工時 |
|---|------|--------|------|
| 7 | Routes API 遷移（Directions/Distance Matrix → Routes API） | 舊 API 已 legacy，不會有新功能 | 8hr |
| 8 | Waypoint Optimization 整合進 `maps_plan_route` | 98 waypoints 自動排序，物流/旅遊殺手功能 | 4hr |
| 9 | Blog: "Build an AI Travel Planner with MCP" | 乘微軟/Expedia 話題 | 4hr |
| 10 | 台灣旅遊 skill 深化 — 拉朋友貢獻 domain knowledge | 先聚焦台灣，差異化 | 持續 |

### 長期種子

| # | 項目 | 為什麼 | 工時 |
|---|------|--------|------|
| 11 | Geo-Reasoning Benchmark Phase 1 | "4% → 87%" 行銷數字 | 2wk |
| 12 | 台灣開放資料串接（實價登錄 API → 新 tool） | GIS 方向第一步 | 研究中 |
| 13 | Multi-source Geo Agent 概念 | 不只 Google Maps，串接政府資料、OSM、氣象局 | 概念階段 |

---

## 七、重要技術債：Routes API 遷移

> **狀態：規劃完成**（2026-03-18）。詳見 `docs/routes-api-migration-plan.md`。

目前 `directions` 和 `distance_matrix` 用的是 **Legacy API**（`@googlemaps/google-maps-services-js`）。Google 2025-03-01 已標為 Legacy。

### 調查結論（2026-03-18）

三個原本擔心的決策點都不存在，遷移比預想的更簡單：

| 問題 | 事實 | 之前的錯誤判斷 |
|------|------|---------------|
| Transit mode | Routes API 完整支援 TRANSIT（bus/subway/train），但 transit 不支援中間 waypoints | ~~可能有限制，需要 fallback~~ |
| arrivalTime | Routes API 支援 arrivalTime 參數 | ~~不支援~~ |
| Waypoint 上限 | 標準 **25 個**（與舊 API 一致）。98 個是 Routes Preferred API，限定客戶 | ~~98 個~~ |

**結論**：純粹是 API 協議替換，不涉及功能取捨。唯一要注意的是 response format 轉換：
- polyline 路徑：`overview_polyline.points` → `polyline.encodedPolyline`
- duration 格式：秒數值 → `"1234s"` 字串
- distance matrix：2D matrix → 扁平陣列（需重建）

### 遷移計畫

- **Phase 1**：新建 `RoutesService.ts`，實作 `computeRoutes`（替代 directions）
- **Phase 2**：實作 `computeRouteMatrix` + 修正 `searchAlongRoute` polyline 取值路徑
- **Phase 3**：`planRoute` waypoint optimization（25 intermediate waypoints 自動排序）

---

## 八、成功指標

| 時間 | Stars 目標 | 驅動力 | 參考案例 |
|------|-----------|--------|---------|
| 2-4 週 | 300+ | README + registry 提交 + HN | Lago: 8 週到 300 |
| 1-2 個月 | 500+ | 內容行銷 + MCP Prompt Templates | HN 首頁平均 +121/day |
| 3-4 個月 | 1,000+ | 持續內容 + 社群 + 官方推薦 | Lago: 6 個月到 1000 |
| 6 個月 | 3,000+ | 網路效應 + 旅遊規劃垂直突破 | 需要突破性事件 |

---

## 九、參考來源

- [Google 官方 MCP 支援公告](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)
- [Google Maps API 2025 變更](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Routes API Waypoint Optimization](https://developers.google.com/maps/documentation/routes_preferred/waypoint_optimization_proxy_api)
- [Route Optimization API 文件](https://developers.google.com/maps/documentation/route-optimization)
- [微軟 Azure AI Travel Agents](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/introducing-azure-ai-travel-agents-a-flagship-mcp-powered-sample-for-ai-travel-s/4416683)
- [Expedia AI Solutions](https://developers.expediagroup.com/docs/ai-solutions)
- [MCP Travel Servers 全景](https://www.altexsoft.com/blog/mcp-servers-travel/)
- [CARTO Agentic GIS Platform](https://carto.com/blog/agentic-gis-bringing-ai-driven-spatial-analysis-to-everyone)
- [CARTO MCP Server 文件](https://docs.carto.com/carto-mcp-server/carto-mcp-server)
- [ESRI 2026 規劃趨勢](https://www.esri.com/en-us/industries/blog/articles/5-planning-trends-2026)
- [GIS AI 房地產分析](https://atlas.co/blog/gis-ai-tools-for-real-estate-analysis/)
- [GIS 產業 2026 展望](https://geographicinsight.com/gis-industry-outlook-for-2026-and-beyond-trends-opportunities-and-challenges-ahead/)
- [GIS 軟體發展趨勢 2026](https://pctechmag.com/2026/03/major-trends-influencing-gis-software-development-in-2026/)
- [台灣不動產實價登錄](https://data.gov.tw/dataset/25119)
- [台北地理資訊 e 點通](https://addr.gov.taipei/)
- [中研院 QGIS 資源](https://gis.rchss.sinica.edu.tw/qgis/)
- [mcp_travelassistant](https://github.com/skarlekar/mcp_travelassistant)
- [TRAVEL-PLANNER-MCP-Server](https://github.com/GongRzhe/TRAVEL-PLANNER-MCP-Server)
- [awesome-mcp-servers Travel 分類](https://github.com/TensorBlock/awesome-mcp-servers/blob/main/docs/travel--transportation.md)
