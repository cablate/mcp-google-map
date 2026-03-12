[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/cablate-mcp-google-map-badge.png)](https://mseep.ai/app/cablate-mcp-google-map)

<a href="https://glama.ai/mcp/servers/@cablate/mcp-google-map">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@cablate/mcp-google-map/badge" alt="Google Map Server MCP server" />
</a>

# MCP Google Map Server

---

> **Important Notice**
>
> Google officially announced MCP support for Google Maps on December 10, 2025, introducing **[Maps Grounding Lite](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)** - a fully-managed MCP server for geospatial data and routing.
>
> This community project remains actively maintained as an alternative with different features and deployment options.

---

A Model Context Protocol (MCP) server providing comprehensive Google Maps API integration with streamable HTTP transport support and multi-session capabilities.

## Special Thanks

This project has received contributions from the community.
Special thanks to [@junyinnnn](https://github.com/junyinnnn) for helping add support for `streamablehttp`.

## Verified Compatibility

This MCP server has been tested and verified with:

- Claude Desktop
- Dive Desktop
- MCP protocol implementations

## Available Tools

| Tool | Description |
|------|-------------|
| `search_nearby` | Find places near a location by type (restaurant, cafe, hotel, etc.). Supports filtering by radius, rating, and open status. |
| `maps_search_places` | Free-text place search (e.g., "sushi restaurants in Tokyo"). Supports location bias, rating, open-now filters. |
| `get_place_details` | Get full details for a place by its place_id — reviews, phone, website, hours, photos. |
| `maps_geocode` | Convert an address or landmark name into GPS coordinates. |
| `maps_reverse_geocode` | Convert GPS coordinates into a street address. |
| `maps_distance_matrix` | Calculate travel distances and times between multiple origins and destinations. |
| `maps_directions` | Get step-by-step navigation between two points with route details. |
| `maps_elevation` | Get elevation (meters above sea level) for geographic coordinates. |

All tools are annotated with `readOnlyHint: true` and `destructiveHint: false` — MCP clients can auto-approve these without user confirmation.

> **Prerequisite**: Enable **Places API (New)** in [Google Cloud Console](https://console.cloud.google.com) before using place-related tools.

## Installation

> **Note**: This server uses HTTP transport, not stdio. Direct npx usage in MCP Server Settings is **NOT supported**.

### Method 1: Global Installation (Recommended)

```bash
# Install globally
npm install -g @cablate/mcp-google-map

# Run the server
mcp-google-map --port 3000 --apikey "your_api_key_here"

# Using short options
mcp-google-map -p 3000 -k "your_api_key_here"
```

### Method 2: Using npx (Quick Start)

> Cannot be used directly in MCP Server Settings with stdio mode

**Step 1: Launch HTTP Server in Terminal**

```bash
# Run in a separate terminal
npx @cablate/mcp-google-map --port 3000 --apikey "YOUR_API_KEY"

# Or with environment variable
GOOGLE_MAPS_API_KEY=YOUR_API_KEY npx @cablate/mcp-google-map
```

**Step 2: Configure MCP Client to Use HTTP**

```json
{
  "mcp-google-map": {
    "transport": "http",
    "url": "http://localhost:3000/mcp"
  }
}
```

### Common Mistake to Avoid

```json
// This WILL NOT WORK - stdio mode not supported with npx
{
  "mcp-google-map": {
    "command": "npx",
    "args": ["@cablate/mcp-google-map"]
  }
}
```

### Server Information

- **Endpoint**: `http://localhost:3000/mcp`
- **Transport**: Streamable HTTP (not stdio)
- **Tools**: 8 Google Maps tools

### CLI Exec Mode (Agent Skill)

Use tools directly without running the MCP server:

```bash
npx @cablate/mcp-google-map exec geocode '{"address":"Tokyo Tower"}'
npx @cablate/mcp-google-map exec search-places '{"query":"ramen in Tokyo"}'
```

All 8 tools available: `geocode`, `reverse-geocode`, `search-nearby`, `search-places`, `place-details`, `directions`, `distance-matrix`, `elevation`. See [`skills/google-maps/`](./skills/google-maps/) for the agent skill definition and full parameter docs.

### API Key Configuration

API keys can be provided in three ways (priority order):

1. **HTTP Headers** (Highest priority)

   ```json
   {
     "mcp-google-map": {
       "transport": "streamableHttp",
       "url": "http://localhost:3000/mcp",
       "headers": {
         "X-Google-Maps-API-Key": "YOUR_API_KEY"
       }
     }
   }
   ```

2. **Command Line**

   ```bash
   mcp-google-map --apikey YOUR_API_KEY
   ```

3. **Environment Variable** (.env file or command line)
   ```env
   GOOGLE_MAPS_API_KEY=your_api_key_here
   MCP_SERVER_PORT=3000
   ```

## Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/cablate/mcp-google-map.git
cd mcp-google-map

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API key

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

### Testing

```bash
# Run smoke tests (no API key required for basic tests)
npm test

# Run full E2E tests (requires GOOGLE_MAPS_API_KEY)
npm run test:e2e
```

### Project Structure

```
src/
├── cli.ts                        # CLI entry point
├── config.ts                     # Tool registration and server config
├── index.ts                      # Package exports
├── core/
│   └── BaseMcpServer.ts          # MCP server with streamable HTTP transport
├── services/
│   ├── NewPlacesService.ts       # Google Places API (New) client
│   ├── PlacesSearcher.ts         # Service facade layer
│   └── toolclass.ts              # Legacy Google Maps API client
├── tools/
│   └── maps/
│       ├── searchNearby.ts       # search_nearby tool
│       ├── searchPlaces.ts       # maps_search_places tool
│       ├── placeDetails.ts       # get_place_details tool
│       ├── geocode.ts            # maps_geocode tool
│       ├── reverseGeocode.ts     # maps_reverse_geocode tool
│       ├── distanceMatrix.ts     # maps_distance_matrix tool
│       ├── directions.ts         # maps_directions tool
│       └── elevation.ts          # maps_elevation tool
└── utils/
    ├── apiKeyManager.ts          # API key management
    └── requestContext.ts         # Per-request context (API key isolation)
tests/
└── smoke.test.ts                 # Smoke + E2E test suite
skills/
└── google-maps/
    ├── SKILL.md                  # Agent skill definition
    └── references/
        └── tools-api.md          # Tool parameter reference
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **@googlemaps/places** - Google Places API (New) for place search and details
- **@googlemaps/google-maps-services-js** - Legacy API for geocoding, directions, distance matrix, elevation
- **@modelcontextprotocol/sdk** - MCP protocol implementation (v1.27+)
- **Express.js** - HTTP server framework
- **Zod** - Schema validation

## Security

- API keys are handled server-side
- Per-session API key isolation for multi-tenant deployments
- DNS rebinding protection available for production
- Input validation using Zod schemas

For enterprise security reviews, see [Security Assessment Clarifications](./SECURITY_ASSESSMENT.md) — a 23-item checklist covering licensing, data protection, credential management, tool contamination, and AI agent execution environment verification.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

MIT

## Contributing

Community participation and contributions are welcome!

- Submit Issues: Report bugs or provide suggestions
- Create Pull Requests: Submit code improvements
- Documentation: Help improve documentation

## Contact

- Email: [reahtuoo310109@gmail.com](mailto:reahtuoo310109@gmail.com)
- GitHub: [CabLate](https://github.com/cablate/)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cablate/mcp-google-map&type=Date)](https://www.star-history.com/#cablate/mcp-google-map&Date)
