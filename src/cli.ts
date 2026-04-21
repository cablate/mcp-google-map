#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import serverConfigs, { filterTools } from "./config.js";
import { BaseMcpServer } from "./core/BaseMcpServer.js";
import { Logger } from "./index.js";
import { PlacesSearcher } from "./services/PlacesSearcher.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from current directory first, then from package directory
dotenvConfig({ path: resolve(process.cwd(), ".env") });
// Also try to load from the package installation directory
dotenvConfig({ path: resolve(__dirname, "../.env") });

export async function startServer(port?: number, apiKey?: string, host?: string): Promise<void> {
  // Override environment variables with CLI arguments if provided
  if (port) {
    process.env.MCP_SERVER_PORT = port.toString();
  }
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey;
  }
  if (host) {
    process.env.MCP_SERVER_HOST = host;
  }

  Logger.log("🚀 Starting Google Maps MCP Server...");
  Logger.log("📍 18 tools registered (set GOOGLE_MAPS_ENABLED_TOOLS to limit)");
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
      const server = new BaseMcpServer(config.name, filterTools(config.tools));
      const serverHost = process.env.MCP_SERVER_HOST || "0.0.0.0";
      Logger.log(`🔧 [${config.name}] Initializing MCP Server in HTTP mode on ${serverHost}:${serverPort}...`);
      await server.startHttpServer(serverPort, serverHost);
      const displayHost = serverHost === "0.0.0.0" ? "localhost" : serverHost;
      Logger.log(`✅ [${config.name}] MCP Server started successfully!`);
      Logger.log(`   🌐 Endpoint: http://${displayHost}:${serverPort}/mcp`);
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
  "air-quality",
  "static-map",
  "batch-geocode-tool",
  "search-along-route",
  "local-rank-tracker",
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
      return searcher.getPlaceDetails(params.placeId, params.maxPhotos || 0);

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
      return searcher.calculateDistanceMatrix(params.origins, params.destinations, params.mode, params.departure_time);

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

    case "air-quality":
    case "maps_air_quality":
      return searcher.getAirQuality(
        params.latitude,
        params.longitude,
        params.includeHealthRecommendations,
        params.includePollutants
      );

    case "static-map":
    case "maps_static_map":
      return searcher.getStaticMap(params);

    case "batch-geocode-tool":
    case "maps_batch_geocode": {
      const results = await Promise.all(
        (params.addresses as string[]).map(async (address: string) => {
          try {
            const result = await searcher.geocode(address);
            return { address, ...result };
          } catch (error: any) {
            return { address, success: false, error: error.message };
          }
        })
      );
      const succeeded = results.filter((r) => r.success).length;
      return {
        success: true,
        data: { total: params.addresses.length, succeeded, failed: params.addresses.length - succeeded, results },
      };
    }

    case "search-along-route":
    case "maps_search_along_route":
      return searcher.searchAlongRoute(params);

    case "local-rank-tracker":
    case "maps_local_rank_tracker":
      return searcher.localRankTracker(params);

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
      "batch-geocode",
      "Geocode multiple addresses from a file (one address per line)",
      (yargs) => {
        return yargs
          .option("input", {
            alias: "i",
            type: "string",
            describe: "Input file path (one address per line). Use - for stdin.",
            demandOption: true,
          })
          .option("output", {
            alias: "o",
            type: "string",
            describe: "Output file path (JSON). Defaults to stdout.",
          })
          .option("concurrency", {
            alias: "c",
            type: "number",
            describe: "Max parallel requests",
            default: 20,
          })
          .option("apikey", {
            alias: "k",
            type: "string",
            description: "Google Maps API key",
            default: process.env.GOOGLE_MAPS_API_KEY,
          })
          .example([
            ["$0 batch-geocode -i addresses.txt", "Geocode to stdout"],
            ["$0 batch-geocode -i addresses.txt -o results.json", "Geocode to file"],
            ["cat addresses.txt | $0 batch-geocode -i -", "Geocode from stdin"],
          ]);
      },
      async (argv) => {
        if (!argv.apikey) {
          console.error("Error: GOOGLE_MAPS_API_KEY not set. Use --apikey or set env var.");
          process.exit(1);
        }

        // Read addresses
        let lines: string[];
        if (argv.input === "-") {
          // Read from stdin
          const rl = createInterface({ input: process.stdin });
          lines = [];
          for await (const line of rl) {
            const trimmed = line.trim();
            if (trimmed) lines.push(trimmed);
          }
        } else {
          if (!existsSync(argv.input as string)) {
            console.error(`Error: File not found: ${argv.input}`);
            process.exit(1);
          }
          lines = readFileSync(argv.input as string, "utf-8")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        }

        if (lines.length === 0) {
          console.error("Error: No addresses found in input.");
          process.exit(1);
        }

        const searcher = new PlacesSearcher(argv.apikey as string);
        const concurrency = Math.min(Math.max(argv.concurrency as number, 1), 50);
        const results: any[] = [];
        let completed = 0;

        // Process with concurrency limit
        const semaphore = async (tasks: (() => Promise<void>)[], limit: number) => {
          const executing: Promise<void>[] = [];
          for (const task of tasks) {
            const p = task().then(() => {
              executing.splice(executing.indexOf(p), 1);
            });
            executing.push(p);
            if (executing.length >= limit) {
              await Promise.race(executing);
            }
          }
          await Promise.all(executing);
        };

        const tasks = lines.map((address, index) => async () => {
          try {
            const result = await searcher.geocode(address);
            results[index] = { address, ...result };
          } catch (error: any) {
            results[index] = { address, success: false, error: error.message };
          }
          completed++;
          if (!argv.output) return; // Don't log progress when outputting to stdout
          process.stderr.write(`\r  ${completed}/${lines.length} geocoded`);
        });

        await semaphore(tasks, concurrency);

        if (argv.output) {
          process.stderr.write("\n");
        }

        // Summary
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const summary = { total: lines.length, succeeded, failed, results };

        const json = JSON.stringify(summary, null, 2);

        if (argv.output) {
          writeFileSync(argv.output as string, json, "utf-8");
          console.error(`Done: ${succeeded}/${lines.length} succeeded. Output: ${argv.output}`);
        } else {
          console.log(json);
        }

        process.exit(failed > 0 ? 1 : 0);
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
          .option("host", {
            type: "string",
            description: "Hostname to bind the server to (e.g. 0.0.0.0 for all interfaces)",
            default: process.env.MCP_SERVER_HOST || "0.0.0.0",
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
            ["$0 --host 0.0.0.0 --port 3000", "Start HTTP accessible from all interfaces"],
            ["$0 --stdio", "Start in stdio mode (for Claude Desktop, Cursor, etc.)"],
          ]);
      },
      async (argv) => {
        if (argv.apikey) {
          process.env.GOOGLE_MAPS_API_KEY = argv.apikey as string;
        }

        const tools = filterTools(serverConfigs[0].tools);

        if (argv.stdio) {
          // stdio mode — all logs go to stderr, stdout reserved for JSON-RPC
          const server = new BaseMcpServer(serverConfigs[0].name, tools);
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

          startServer(argv.port as number, argv.apikey as string, argv.host as string).catch((error) => {
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
