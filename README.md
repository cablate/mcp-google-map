[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/cablate-mcp-google-map-badge.png)](https://mseep.ai/app/cablate-mcp-google-map)

<a href="https://glama.ai/mcp/servers/@cablate/mcp-google-map">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@cablate/mcp-google-map/badge" alt="Google Map Server MCP server" />
</a>

# MCP Google Map Server

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

### 1. via NPM

```bash
npm install -g @cablate/mcp-google-map
```

### 2. Run the Server

```bash

mcp-google-map --port 3000 --apikey "your_api_key_here"

# Using short options
mcp-google-map -p 3000 -k "your_api_key_here"

# Show help information
mcp-google-map --help
```

### 3. Server Endpoints

- **Main MCP Endpoint**: `http://localhost:3000/mcp`
- **Available Tools**: 8 tools including Google Maps services and echo

### Environment Variables

Alternatively, create a `.env` file in your working directory:

```env
# Required
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional
MCP_SERVER_PORT=3000
```

**Note**: Command line options take precedence over environment variables.

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
    ├── echo.ts              # Echo service tool
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

### v0.0.5
- Added streamable HTTP transport support
- Improved CLI interface with emoji indicators
- Enhanced error handling and logging
- Added comprehensive tool descriptions for LLM integration
- Updated to latest MCP SDK version

### v0.0.4
- Initial release with basic Google Maps integration
- Support for location search, geocoding, and directions
- Compatible with MCP protocol

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cablate/mcp-google-map&type=Date)](https://www.star-history.com/#cablate/mcp-google-map&Date)
