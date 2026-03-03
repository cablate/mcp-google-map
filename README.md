[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/cablate-mcp-google-map-badge.png)](https://mseep.ai/app/cablate-mcp-google-map)

<a href="https://glama.ai/mcp/servers/@cablate/mcp-google-map">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@cablate/mcp-google-map/badge" alt="Google Map Server MCP server" />
</a>

# MCP Google Map Server

---

> **📢 Important Notice**
>
> Google officially announced MCP support for Google Maps on December 10, 2025, introducing **[Maps Grounding Lite](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services)** - a fully-managed MCP server for geospatial data and routing.
>
> This community project remains actively maintained as an alternative with different features and deployment options.

---

A powerful Model Context Protocol (MCP) server providing comprehensive Google Maps API integration with streamable HTTP transport support and LLM processing capabilities.

## 🙌 Special Thanks

This project has received contributions from the community.  
Special thanks to [@junyinnnn](https://github.com/junyinnnn) for helping add support for `streamablehttp`.

## ✅ Testing Status

**This MCP server has been tested and verified to work correctly with:**

- Claude Desktop
- Dive Desktop
- MCP protocol implementations

All tools and features are confirmed functional through real-world testing.

## Features

### 🆕 Latest Updates

 - ℹ️  **Reminder: enable Places API (New) in https://console.cloud.google.com before using the new Place features.**


### 🗺️ Google Maps Integration

- **Location Search**

  - Search for places near a specific location with customizable radius and filters
  - Get detailed place information including ratings, opening hours, and contact details

- **Geocoding Services**

  - Convert addresses to coordinates (geocoding)
  - Convert coordinates to addresses (reverse geocoding)

- **Distance & Directions**

  - Calculate distances and travel times between multiple origins and destinations
  - Get detailed turn-by-turn directions between two points
  - Support for different travel modes (driving, walking, bicycling, transit)

- **Elevation Data**
  - Retrieve elevation data for specific locations

### 🚀 Advanced Features

- **Streamable HTTP Transport**: Latest MCP protocol with real-time streaming capabilities
- **Session Management**: Stateful sessions with UUID-based identification
- **Multiple Connection Support**: Handle multiple concurrent client connections
- **Echo Service**: Built-in testing tool for MCP server functionality

## Installation

> ⚠️ **Important Notice**: This server uses HTTP transport, not stdio. Direct npx usage in MCP Server Settings is **NOT supported**.

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

> ⚠️ **Warning**: Cannot be used directly in MCP Server Settings with stdio mode

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

### ❌ Common Mistake to Avoid

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
- **Transport**: HTTP (not stdio)
- **Tools**: 8 Google Maps tools available

### API Key Configuration

API keys can be provided in three ways (priority order):

1. **HTTP Headers** (Highest priority)

   ```json
   // MCP Client config
   {
     "mcp-google-map": {
       "transport": "streamableHttp",
       "url": "http://localhost:3000/mcp",
       // if your MCP Client support 'headers'
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

## Available Tools

The server provides the following tools:

### Google Maps Tools

1. **search_nearby** - Search for nearby places based on location, with optional filtering by keywords, distance, rating, and operating hours
2. **get_place_details** - Get detailed information about a specific place including contact details, reviews, ratings, and operating hours
3. **maps_geocode** - Convert addresses or place names to geographic coordinates (latitude and longitude)
4. **maps_reverse_geocode** - Convert geographic coordinates to a human-readable address
5. **maps_distance_matrix** - Calculate travel distances and durations between multiple origins and destinations
6. **maps_directions** - Get detailed turn-by-turn navigation directions between two locations
7. **maps_elevation** - Get elevation data (height above sea level) for specific geographic locations

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

### Project Structure

```
src/
├── cli.ts                    # Main CLI entry point
├── config.ts                 # Server configuration
├── index.ts                  # Package exports
├── core/
│   └── BaseMcpServer.ts     # Base MCP server with streamable HTTP
└── tools/
    └── maps/                # Google Maps tools
        ├── toolclass.ts     # Google Maps API client
        ├── searchPlaces.ts  # Maps service layer
        ├── searchNearby.ts  # Search nearby places
        ├── placeDetails.ts  # Place details
        ├── geocode.ts       # Geocoding
        ├── reverseGeocode.ts # Reverse geocoding
        ├── distanceMatrix.ts # Distance matrix
        ├── directions.ts    # Directions
        └── elevation.ts     # Elevation data
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **Google Maps Services JS** - Google Maps API integration
- **Model Context Protocol SDK** - MCP protocol implementation
- **Express.js** - HTTP server framework
- **Zod** - Schema validation

## Security Considerations

- API keys are handled server-side for security
- DNS rebinding protection available for production
- Input validation using Zod schemas
- Error handling and logging

### Security Assessment Clarifications (2026-03)

For enterprise security reviews, the current implementation can be summarized as follows:

| # | Security check type | Clarification for this repository |
|---|---|---|
| 1 | Licensing & Legal Compliance | MIT License (commercial/internal/modification/distribution allowed under MIT terms). |
| 2 | Data Protection & Privacy Laws | The server is stateless for business data and only proxies user-provided query parameters to Google Maps APIs; no database or file persistence of prompt/result payloads is implemented. Operators remain responsible for legal basis, retention policy, and regional compliance in their own deployment. |
| 3 | Infrastructure & Deployment Security | Self-hosted Node.js service. API keys can be provided by header/CLI/env and should be restricted in Google Cloud (API scope + IP/referrer), rotated, and managed in a secret manager. |
| 4 | Long-Term Viability Risk | Open-source project with public commit/release history; users can pin versions/tags for controlled adoption. |
| 5 | Unexpected RCE / Code Attacks | No eval/plugin runtime/shell execution path from tool input. Inputs are validated and used as API request parameters only. |
| 6 | Tool Contamination Attacks | No persistent cache/storage for tool outputs. Session state is in-memory and contains transport/API-key context only. |
| 7 | Shadowing Attack | Tools are statically registered at server startup; no dynamic tool download or runtime override mechanism is provided by this repository. |
| 8 | Credential Theft | Secret in scope is mainly Google Maps API key. This project supports header/CLI/env injection and should be deployed with secret-manager storage, restricted keys, key rotation, and transport security (HTTPS via trusted proxy/ingress in production). |
| 9 | Verification of MCP Server Provider | Source code is publicly auditable in `cablate/mcp-google-map` with visible maintainership and issue/PR history. |
| 10 | Verification of Information Handled | Tool output is sourced from Google Maps Platform responses; the server does not persist or transform data beyond formatting responses. |
| 11 | Authentication methods and permissions | No internal user/role system exists in this MCP server. Access control should be enforced at deployment boundary (network policy, reverse proxy auth, API gateway) and by Google API key restrictions. |
| 12 | AI Agent Execution Environment Verification | Repository does not ship hard-coded credentials; `.env.example` contains placeholders only. |
| 13 | MCP Server Settings / Version Verification | Use pinned package versions/tags/commit SHAs in your deployment pipeline for controlled upgrades. |
| 14 | Verify connected MCP servers during prompt input | This is controlled by the MCP client/host application, not by this server. This repository exposes one MCP endpoint (`/mcp`) and does not manage other connected servers. |
| 15 | Account/DB/container/SQL management | Not applicable: this server does not include DB connectors or SQL execution features. |
| 16 | Logging, Monitoring, Log Query | Basic stdout/stderr logging is provided. Centralized log retention/query/alerting is not built in and should be implemented by the host platform (for example, container logs + SIEM). |
| 17 | Post-Approval Malicious Update Risk | Mitigate by pinning exact package versions, reviewing changelogs/commits before upgrade, and using internal artifact approval/signing workflows. |
| 18 | Outdated Dependencies | Dependencies are managed in `package.json`/`package-lock.json`. Operators should run routine dependency scanning (for example, `npm audit`, SCA in CI) and patch regularly. |
| 19 | Environmental Damage due to Auto-Approval | Current tools call Google Maps APIs and do not provide local file/system mutation operations; risk mainly depends on client-side auto-approval policy and surrounding toolchain composition. |
| 20 | Intent/Objective Tampering | No autonomous goal-modification logic exists in this repository; behavior is bounded by MCP tool schemas and request handlers. |
| 21 | Human Operation Risk | Main risks are deployment misconfiguration (unrestricted API keys, exposed endpoint, missing TLS, over-broad network access). Use change control + least privilege. |
| 22 | Lag Pull Attack | The server returns real-time API responses per request and does not cache historical outputs; stale-decision risk is primarily on client orchestration and human review timing. |
| 23 | Cost-related information | Open-source, self-hosted server code (free). Google Maps Platform usage may incur API charges based on your Google Cloud billing plan. |

## License

MIT

## Contributing

Community participation and contributions are welcome! Here's how you can contribute:

- ⭐️ Star the project if you find it helpful
- 🐛 Submit Issues: Report bugs or provide suggestions
- 🔧 Create Pull Requests: Submit code improvements
- 📖 Documentation: Help improve documentation

## Contact

If you have any questions or suggestions, feel free to reach out:

- 📧 Email: [reahtuoo310109@gmail.com](mailto:reahtuoo310109@gmail.com)
- 💻 GitHub: [CabLate](https://github.com/cablate/)
- 🤝 Collaboration: Welcome to discuss project cooperation
- 📚 Technical Guidance: Sincere welcome for suggestions and guidance

## Changelog

### v0.0.19 (Latest)

- **New Places API Integration**: Updated to use Google's new Places API (New) instead of the legacy API to resolve HTTP 403 errors and ensure continued functionality.

### v0.0.18

- **Error response improvements**: Now all error messages are in English with more detailed information (previously in Chinese)

### v0.0.17

- **Added HTTP Header Authentication**: Support for passing API keys via `X-Google-Maps-API-Key` header in MCP Client config
- **Fixed Concurrent User Issues**: Each session now uses its own API key without conflicts
- **Fixed npx Execution**: Resolved module bundling issues
- **Improved Documentation**: Clearer setup instructions

### v0.0.14

- Added streamable HTTP transport support
- Improved CLI interface with emoji indicators
- Enhanced error handling and logging
- Added comprehensive tool descriptions for LLM integration
- Updated to latest MCP SDK version

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cablate/mcp-google-map&type=Date)](https://www.star-history.com/#cablate/mcp-google-map&Date)
