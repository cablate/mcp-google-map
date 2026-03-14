#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import serverConfigs from "./config.js";
import { BaseMcpServer } from "./core/BaseMcpServer.js";
import { Logger } from "./index.js";
import { PlacesSearcher } from "./services/PlacesSearcher.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileSync } from "fs";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from current directory first, then from package directory
dotenvConfig({ path: resolve(process.cwd(), ".env") });
// Also try to load from the package installation directory
dotenvConfig({ path: resolve(__dirname, "../.env") });

export async function startServer(port?: number, apiKey?: string): Promise<void> {
  // Override environment variables with CLI arguments if provided
  if (port) {
    process.env.MCP_SERVER_PORT = port.toString();
  }
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey;
  }

  Logger.log("🚀 Starting Google Maps MCP Server...");
  Logger.log(
    "📍 Available tools: search_nearby, get_place_details, maps_geocode, maps_reverse_geocode, maps_distance_matrix, maps_directions, maps_elevation, echo"
  );
  Logger.log(
    "ℹ️  Reminder: enable Places API (New) in https://console.cloud.google.com before using the new Place features."
  );
  Logger.log("");

  const startPromises = serverConfigs.map(async (config) => {
    const portString = process.env[config.portEnvVar];
    if (!portString) {
      Logger.error(`⚠️  [${config.name}] Port environment variable ${config.portEnvVar} not set.`);
      Logger.log(`💡 Please set ${config.portEnvVar} in your .env file or use --port parameter.`);
      Logger.log(`   Example: ${config.portEnvVar}=3000 or --port 3000`);
      return;
    }

    const serverPort = Number(portString);
    if (isNaN(serverPort) || serverPort <= 0) {
      Logger.error(`❌ [${config.name}] Invalid port number "${portString}" defined in ${config.portEnvVar}.`);
      return;
    }

    try {
      const server = new BaseMcpServer(config.name, config.tools);
      Logger.log(`🔧 [${config.name}] Initializing MCP Server in HTTP mode on port ${serverPort}...`);
      await server.startHttpServer(serverPort);
      Logger.log(`✅ [${config.name}] MCP Server started successfully!`);
      Logger.log(`   🌐 Endpoint: http://localhost:${serverPort}/mcp`);
      Logger.log(`   📚 Tools: ${config.tools.length} available`);
    } catch (error) {
      Logger.error(`❌ [${config.name}] Failed to start MCP Server on port ${serverPort}:`, error);
    }
  });

  await Promise.allSettled(startPromises);

  Logger.log("");
  Logger.log("🎉 Server initialization completed!");
  Logger.log("💡 Need help? Check the README.md for configuration details.");
}

// --------------- Exec Mode ---------------

const EXEC_TOOLS = [
  "geocode",
  "reverse-geocode",
  "search-nearby",
  "search-places",
  "place-details",
  "directions",
  "distance-matrix",
  "elevation",
  "timezone",
  "weather",
  "explore-area",
  "plan-route",
  "compare-places",
] as const;

async function execTool(toolName: string, params: any, apiKey: string): Promise<any> {
  const searcher = new PlacesSearcher(apiKey);

  switch (toolName) {
    case "geocode":
    case "maps_geocode":
      return searcher.geocode(params.address);

    case "reverse-geocode":
    case "maps_reverse_geocode":
      return searcher.reverseGeocode(params.latitude, params.longitude);

    case "search-nearby":
    case "search_nearby":
    case "maps_search_nearby":
      return searcher.searchNearby(params);

    case "search-places":
    case "maps_search_places":
      return searcher.searchText({
        query: params.query,
        locationBias: params.locationBias,
        openNow: params.openNow,
        minRating: params.minRating,
        includedType: params.includedType,
      });

    case "place-details":
    case "get_place_details":
    case "maps_place_details":
      return searcher.getPlaceDetails(params.placeId);

    case "directions":
    case "maps_directions":
      return searcher.getDirections(
        params.origin,
        params.destination,
        params.mode,
        params.departure_time,
        params.arrival_time
      );

    case "distance-matrix":
    case "maps_distance_matrix":
      return searcher.calculateDistanceMatrix(params.origins, params.destinations, params.mode);

    case "elevation":
    case "maps_elevation":
      return searcher.getElevation(params.locations);

    case "timezone":
    case "maps_timezone":
      return searcher.getTimezone(params.latitude, params.longitude, params.timestamp);

    case "weather":
    case "maps_weather":
      return searcher.getWeather(
        params.latitude,
        params.longitude,
        params.type,
        params.forecastDays,
        params.forecastHours
      );

    case "explore-area":
    case "maps_explore_area":
      return searcher.exploreArea(params);

    case "plan-route":
    case "maps_plan_route":
      return searcher.planRoute(params);

    case "compare-places":
    case "maps_compare_places":
      return searcher.comparePlaces(params);

    default:
      throw new Error(`Unknown tool: ${toolName}. Available: ${EXEC_TOOLS.join(", ")}`);
  }
}

// --------------- Entry Point ---------------

// Check if this script is being run directly
const isRunDirectly =
  process.argv[1] &&
  (process.argv[1].endsWith("cli.ts") ||
    process.argv[1].endsWith("cli.js") ||
    process.argv[1].endsWith("mcp-google-map") ||
    process.argv[1].includes("mcp-google-map"));

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isRunDirectly || isMainModule) {
  let packageVersion = "0.0.0";
  try {
    const packageJsonPath = resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    packageVersion = packageJson.version;
  } catch (e) {
    packageVersion = "0.0.0";
  }

  yargs(hideBin(process.argv))
    .command(
      "exec <tool> [params]",
      "Execute a tool directly and output JSON",
      (yargs) => {
        return yargs
          .positional("tool", {
            type: "string",
            describe: `Tool name: ${EXEC_TOOLS.join(", ")}`,
          })
          .positional("params", {
            type: "string",
            describe: "JSON parameters string",
          })
          .option("apikey", {
            alias: "k",
            type: "string",
            description: "Google Maps API key",
            default: process.env.GOOGLE_MAPS_API_KEY,
          })
          .example([
            ['$0 exec geocode \'{"address":"Tokyo Tower"}\'', "Geocode an address"],
            [
              '$0 exec search-nearby \'{"center":{"value":"35.68,139.74","isCoordinates":true},"keyword":"restaurant"}\'',
              "Search nearby",
            ],
            ['$0 exec search-places \'{"query":"ramen in Tokyo"}\'', "Text search"],
          ]);
      },
      async (argv) => {
        if (!argv.apikey) {
          console.error(
            JSON.stringify(
              {
                error: "GOOGLE_MAPS_API_KEY not set. Use --apikey or set GOOGLE_MAPS_API_KEY environment variable.",
              },
              null,
              2
            )
          );
          process.exit(1);
        }
        try {
          const params = argv.params ? JSON.parse(argv.params as string) : {};
          const result = await execTool(argv.tool as string, params, argv.apikey as string);
          console.log(JSON.stringify(result, null, 2));
          process.exit(0);
        } catch (error: any) {
          console.error(JSON.stringify({ error: error.message }, null, 2));
          process.exit(1);
        }
      }
    )
    .command(
      "$0",
      "Start the MCP server (HTTP by default, --stdio for stdio mode)",
      (yargs) => {
        return yargs
          .option("port", {
            alias: "p",
            type: "number",
            description: "Port to run the MCP server on",
            default: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000,
          })
          .option("apikey", {
            alias: "k",
            type: "string",
            description: "Google Maps API key",
            default: process.env.GOOGLE_MAPS_API_KEY,
          })
          .option("stdio", {
            type: "boolean",
            description: "Use stdio transport instead of HTTP",
            default: false,
          })
          .example([
            ["$0", "Start HTTP server with default settings"],
            ['$0 --port 3000 --apikey "your_api_key"', "Start HTTP with custom port and API key"],
            ["$0 --stdio", "Start in stdio mode (for Claude Desktop, Cursor, etc.)"],
          ]);
      },
      async (argv) => {
        if (argv.apikey) {
          process.env.GOOGLE_MAPS_API_KEY = argv.apikey as string;
        }

        if (argv.stdio) {
          // stdio mode — all logs go to stderr, stdout reserved for JSON-RPC
          const server = new BaseMcpServer(serverConfigs[0].name, serverConfigs[0].tools);
          await server.startStdio();
        } else {
          // HTTP mode
          Logger.log("🗺️  Google Maps MCP Server");
          Logger.log("   A Model Context Protocol server for Google Maps services");
          Logger.log("");

          if (!argv.apikey) {
            Logger.log("⚠️  Google Maps API Key not found!");
            Logger.log("   Please provide --apikey parameter or set GOOGLE_MAPS_API_KEY in your .env file");
            Logger.log("");
          }

          startServer(argv.port as number, argv.apikey as string).catch((error) => {
            Logger.error("❌ Failed to start server:", error);
            process.exit(1);
          });
        }
      }
    )
    .version(packageVersion)
    .alias("version", "v")
    .help()
    .parse();
}
