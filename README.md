# MCP Google Map Server

A powerful Model Context Protocol (MCP) server providing comprehensive Google Maps API integration with LLM processing capabilities.

## Features

### Google Maps Features

- Location search and information retrieval
- Geocoding and reverse geocoding
- Detailed place information

## Installation

### Via NPM

```bash
npm install -g @cablate/mcp-google-map
```

## Usage

### Command Line

```bash
mcp-google-map
```

### Integration with [Dive Desktop](https://github.com/OpenAgentPlatform/Dive)

1. Click "+ Add MCP Server" in Dive Desktop
2. Copy and paste the following configuration:

```json
{
  "mcpServers": {
    "google-map": {
      "command": "npx",
      "args": ["-y", "@cablate/mcp-google-map"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
```

3. Click "Save" to complete the installation

## Google Maps API Setup

To use this service, you need to:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Maps API services
3. Obtain an API key
4. Set the `GOOGLE_MAPS_API_KEY` environment variable

## Tech Stack

- TypeScript
- Node.js
- Google Maps Services JS
- Model Context Protocol SDK

## License

MIT

## Contributing

Community participation and contributions are welcome! Here's how you can contribute:

- ⭐️ Star the project if you find it helpful
- 🐛 Submit Issues: Report bugs or provide suggestions
- 🔧 Create Pull Requests: Submit code improvements

## Contact

If you have any questions or suggestions, feel free to reach out:

- 📧 Email: [reahtuoo310109@gmail.com](mailto:reahtuoo310109@gmail.com)
- 📧 GitHub: [CabLate](https://github.com/cablate/)
- 🤝 Collaboration: Welcome to discuss project cooperation
- 📚 Technical Guidance: Sincere welcome for suggestions and guidance
