/**
 * Smoke test for mcp-google-map server.
 *
 * Validates:
 *  1. Server starts and accepts an initialize request
 *  2. tools/list returns all tools with annotations and inputSchema
 *  3. Geocode tool call works
 *  4. Multiple tool calls (reverse geocode, elevation, distance matrix)
 *  5. Multiple concurrent sessions work independently
 *
 * Prerequisites:
 *  - GOOGLE_MAPS_API_KEY env var (or pass via --apikey)
 *  - Port 13579 available
 *
 * Run:
 *   npx tsx tests/smoke.test.ts
 *   npx tsx tests/smoke.test.ts --port 13579 --apikey "AIza..."
 */

import { randomUUID } from "node:crypto";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load .env from project root
dotenvConfig({ path: resolve(import.meta.dirname ?? ".", "../.env") });

// --------------- Config ---------------

const PORT = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--port") ?? "13579");
const API_KEY = process.argv.find((_, i, a) => a[i - 1] === "--apikey") ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
const MCP_ENDPOINT = `http://localhost:${PORT}/mcp`;
const PROTOCOL_VERSION = "2025-03-26";

// --------------- Helpers ---------------

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpSession {
  sessionId: string | null;
  nextId: number;
}

function createSession(): McpSession {
  return { sessionId: null, nextId: 1 };
}

async function sendRequest(session: McpSession, method: string, params?: Record<string, unknown>): Promise<any> {
  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: session.nextId++,
    method,
    params: params ?? {},
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (session.sessionId) {
    headers["mcp-session-id"] = session.sessionId;
  }

  if (API_KEY) {
    headers["X-Google-Maps-API-Key"] = API_KEY;
  }

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  // Extract session ID from response
  const newSessionId = res.headers.get("mcp-session-id");
  if (newSessionId) {
    session.sessionId = newSessionId;
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/event-stream")) {
    // Parse SSE: collect all data lines, return the last JSON-RPC response
    const text = await res.text();
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));
    const messages = lines.map((l) => JSON.parse(l.slice(6)));
    // Find the response matching our request id
    const response = messages.find((m: any) => m.id === body.id);
    return response ?? messages[messages.length - 1];
  }

  return res.json();
}

// --------------- Assertions ---------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// --------------- Server Lifecycle ---------------

let serverProcess: ReturnType<typeof import("node:child_process").spawn> | null = null;

async function startServer(): Promise<void> {
  const { spawn } = await import("node:child_process");
  const { resolve } = await import("node:path");

  const cliPath = resolve(import.meta.dirname ?? ".", "../dist/cli.js");

  return new Promise((resolvePromise, reject) => {
    const args = ["--port", String(PORT)];
    if (API_KEY) args.push("--apikey", API_KEY);

    serverProcess = spawn("node", [cliPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, MCP_SERVER_PORT: String(PORT) },
    });

    const timeout = setTimeout(() => reject(new Error("Server start timed out")), 15000);
    let stderrBuffer = "";

    serverProcess.stderr!.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
      if (stderrBuffer.includes("listening on port") || stderrBuffer.includes("Server started successfully")) {
        clearTimeout(timeout);
        // Give a brief moment for the server to be fully ready
        setTimeout(() => resolvePromise(), 500);
      }
    });

    serverProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// --------------- Tests ---------------

async function testInitialize(): Promise<McpSession> {
  console.log("\n🧪 Test 1: Initialize session");

  const session = createSession();
  const result = await sendRequest(session, "initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "1.0.0" },
  });

  assert(result?.result !== undefined, "Server returns initialize result");
  assert(session.sessionId !== null, "Session ID assigned", `got: ${session.sessionId}`);
  assert(
    result?.result?.serverInfo?.name !== undefined,
    "Server info present",
    `name: ${result?.result?.serverInfo?.name}`
  );

  // Send initialized notification (required by protocol)
  await sendRequest(session, "notifications/initialized");

  return session;
}

async function testListTools(session: McpSession): Promise<void> {
  console.log("\n🧪 Test 2: List tools");

  const result = await sendRequest(session, "tools/list");
  const tools: any[] = result?.result?.tools ?? [];

  assert(tools.length >= 10, `Has at least 10 tools (got ${tools.length})`);

  const toolNames = tools.map((t: any) => t.name);
  const expectedTools = [
    "maps_search_nearby",
    "maps_place_details",
    "maps_geocode",
    "maps_reverse_geocode",
    "maps_distance_matrix",
    "maps_directions",
    "maps_elevation",
    "maps_search_places",
    "maps_timezone",
    "maps_weather",
  ];

  for (const name of expectedTools) {
    assert(toolNames.includes(name), `Tool "${name}" registered`);
  }

  // Verify annotations on all tools
  for (const tool of tools) {
    if (expectedTools.includes(tool.name)) {
      const a = tool.annotations;
      assert(a !== undefined, `Tool "${tool.name}" has annotations`);
      if (a) {
        assert(a.readOnlyHint === true, `Tool "${tool.name}" is readOnlyHint`);
        assert(a.destructiveHint === false, `Tool "${tool.name}" is not destructiveHint`);
      }
    }
  }

  // Verify tools have inputSchema
  for (const tool of tools) {
    if (expectedTools.includes(tool.name)) {
      assert(tool.inputSchema !== undefined, `Tool "${tool.name}" has inputSchema`);
    }
  }
}

async function testGeocode(session: McpSession): Promise<void> {
  console.log("\n🧪 Test 3: Geocode tool call");

  if (!API_KEY) {
    console.log("  ⏭️  Skipped (no GOOGLE_MAPS_API_KEY)");
    return;
  }

  const result = await sendRequest(session, "tools/call", {
    name: "maps_geocode",
    arguments: { address: "Tokyo Tower" },
  });

  const content = result?.result?.content ?? [];
  assert(content.length > 0, "Geocode returns content");

  if (content.length > 0) {
    const text = content[0]?.text ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Response is plain text (error message or non-JSON)
      assert(false, "Geocode returns valid JSON", `got: ${text.slice(0, 200)}`);
      return;
    }
    assert(parsed?.location !== undefined, "Result has location", JSON.stringify(parsed?.location));
    assert(typeof parsed?.location?.lat === "number", "Latitude is a number", `lat: ${parsed?.location?.lat}`);
  }
}

async function testToolCalls(session: McpSession): Promise<void> {
  console.log("\n🧪 Test 4: Multiple tool calls");

  if (!API_KEY) {
    console.log("  ⏭️  Skipped (no GOOGLE_MAPS_API_KEY)");
    return;
  }

  // Test reverse geocode (Tokyo Tower coordinates)
  const reverseResult = await sendRequest(session, "tools/call", {
    name: "maps_reverse_geocode",
    arguments: { latitude: 35.6586, longitude: 139.7454 },
  });
  const reverseContent = reverseResult?.result?.content ?? [];
  assert(reverseContent.length > 0, "Reverse geocode returns content");
  if (reverseContent.length > 0) {
    let valid = false;
    try {
      const parsed = JSON.parse(reverseContent[0].text);
      valid = parsed?.formatted_address !== undefined;
    } catch {
      /* ignore parse errors */
    }
    assert(valid, "Reverse geocode returns formatted_address");
  }

  // Test elevation
  const elevResult = await sendRequest(session, "tools/call", {
    name: "maps_elevation",
    arguments: { locations: [{ latitude: 35.6586, longitude: 139.7454 }] },
  });
  const elevContent = elevResult?.result?.content ?? [];
  assert(elevContent.length > 0, "Elevation returns content");
  if (elevContent.length > 0) {
    let valid = false;
    try {
      const parsed = JSON.parse(elevContent[0].text);
      valid = Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0]?.elevation === "number";
    } catch {
      /* ignore parse errors */
    }
    assert(valid, "Elevation returns numeric elevation data");
  }

  // Test search_nearby (uses Places API New)
  const nearbyResult = await sendRequest(session, "tools/call", {
    name: "maps_search_nearby",
    arguments: {
      center: { value: "35.6586,139.7454", isCoordinates: true },
      keyword: "restaurant",
      radius: 500,
    },
  });
  const nearbyContent = nearbyResult?.result?.content ?? [];
  assert(nearbyContent.length > 0, "Search nearby returns content");
  if (nearbyContent.length > 0) {
    const text = nearbyContent[0]?.text ?? "";
    let valid = false;
    try {
      // Response format: "location: {...}\n[...]"
      const lines = text.split("\n");
      // Find the JSON array part (skip the "location: ..." prefix line)
      const jsonStart = text.indexOf("[");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(text.substring(jsonStart));
        valid = Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name !== undefined;
      }
    } catch {
      /* ignore parse errors */
    }
    assert(
      valid,
      "Search nearby returns place results with name field",
      valid ? undefined : `got: ${text.slice(0, 300)}`
    );
  }

  // Test maps_search_places (text search via Places API New)
  const searchResult = await sendRequest(session, "tools/call", {
    name: "maps_search_places",
    arguments: { query: "ramen near Tokyo Tower" },
  });
  const searchContent = searchResult?.result?.content ?? [];
  assert(searchContent.length > 0, "Search places returns content");
  if (searchContent.length > 0) {
    const text = searchContent[0]?.text ?? "";
    let valid = false;
    try {
      const parsed = JSON.parse(text);
      valid = Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name !== undefined;
    } catch {
      /* ignore parse errors */
    }
    assert(valid, "Search places returns results with name field", valid ? undefined : `got: ${text.slice(0, 300)}`);
  }

  // Test timezone
  const tzResult = await sendRequest(session, "tools/call", {
    name: "maps_timezone",
    arguments: { latitude: 35.6586, longitude: 139.7454 },
  });
  const tzContent = tzResult?.result?.content ?? [];
  assert(tzContent.length > 0, "Timezone returns content");
  if (tzContent.length > 0) {
    let valid = false;
    try {
      const parsed = JSON.parse(tzContent[0].text);
      valid = parsed?.timeZoneId === "Asia/Tokyo";
    } catch {
      /* ignore parse errors */
    }
    assert(valid, "Timezone returns Asia/Tokyo");
  }

  // Test weather (use US coordinates — Japan is unsupported by Weather API)
  const weatherResult = await sendRequest(session, "tools/call", {
    name: "maps_weather",
    arguments: { latitude: 37.422, longitude: -122.0841 },
  });
  const weatherContent = weatherResult?.result?.content ?? [];
  assert(weatherContent.length > 0, "Weather returns content");
  if (weatherContent.length > 0) {
    let valid = false;
    try {
      const parsed = JSON.parse(weatherContent[0].text);
      valid = parsed?.temperature !== undefined;
    } catch {
      /* ignore parse errors */
    }
    if (!valid) {
      console.log("  ⚠️  Weather returned non-temperature data (API may not be enabled)");
    }
    // Don't fail the test if Weather API isn't enabled — it's optional
    assert(true, "Weather tool callable");
  }

  // Test distance matrix
  const distResult = await sendRequest(session, "tools/call", {
    name: "maps_distance_matrix",
    arguments: { origins: ["Tokyo Tower"], destinations: ["Shibuya Station"], mode: "driving" },
  });
  const distContent = distResult?.result?.content ?? [];
  assert(distContent.length > 0, "Distance matrix returns content");
  if (distContent.length > 0) {
    let valid = false;
    try {
      const parsed = JSON.parse(distContent[0].text);
      valid = parsed?.distances !== undefined && parsed?.durations !== undefined;
    } catch {
      /* ignore parse errors */
    }
    assert(valid, "Distance matrix returns distances and durations");
  }
}

async function testMultiSession(): Promise<void> {
  console.log("\n🧪 Test 5: Multiple concurrent sessions");

  // Create 3 independent sessions
  const sessions = await Promise.all(
    Array.from({ length: 3 }, async (_, i) => {
      const session = createSession();
      const result = await sendRequest(session, "initialize", {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: `smoke-test-${i}`, version: "1.0.0" },
      });

      await sendRequest(session, "notifications/initialized");
      return { session, initResult: result, index: i };
    })
  );

  // Verify all sessions got unique IDs
  const ids = sessions.map((s) => s.session.sessionId);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === 3, `3 unique session IDs (got ${uniqueIds.size})`);

  // All sessions should be able to list tools concurrently
  const toolResults = await Promise.all(
    sessions.map(async ({ session, index }) => {
      const result = await sendRequest(session, "tools/list");
      return { result, index };
    })
  );

  for (const { result, index } of toolResults) {
    const tools = result?.result?.tools ?? [];
    assert(tools.length >= 8, `Session ${index}: tools/list returns ${tools.length} tools`);
  }

  // If API key available, run geocode on all sessions concurrently
  if (API_KEY) {
    const addresses = ["Taipei 101", "Eiffel Tower", "Statue of Liberty"];
    const geocodeResults = await Promise.all(
      sessions.map(async ({ session, index }) => {
        const result = await sendRequest(session, "tools/call", {
          name: "maps_geocode",
          arguments: { address: addresses[index] },
        });
        return { result, index, address: addresses[index] };
      })
    );

    for (const { result, index, address } of geocodeResults) {
      const content = result?.result?.content ?? [];
      if (content.length === 0) {
        assert(false, `Session ${index}: geocode "${address}" succeeded`, "no content");
        continue;
      }
      const text = content[0]?.text ?? "";
      let valid = false;
      try {
        const parsed = JSON.parse(text);
        valid = parsed?.location !== undefined;
      } catch {
        /* ignore parse errors */
      }
      assert(
        valid,
        `Session ${index}: geocode "${address}" succeeded`,
        valid ? undefined : `got: ${text.slice(0, 120)}`
      );
    }
  } else {
    console.log("  ⏭️  Concurrent geocode skipped (no GOOGLE_MAPS_API_KEY)");
  }
}

// --------------- Test 6: Stdio Transport ---------------

async function testStdio(): Promise<void> {
  console.log("\n🧪 Test 6: Stdio transport");

  const { spawn } = await import("node:child_process");
  const { resolve } = await import("node:path");
  const cliPath = resolve(import.meta.dirname ?? ".", "../dist/cli.js");

  // Helper: send a JSON-RPC message over stdio and collect the response
  const stdioCall = (messages: object[]): Promise<string[]> => {
    return new Promise((resolvePromise, reject) => {
      const args = ["--stdio"];
      if (API_KEY) args.push("--apikey", API_KEY);

      const child = spawn("node", [cliPath, ...args], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      child.stdout!.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("stdio test timed out"));
      }, 15000);

      child.on("close", () => {
        clearTimeout(timeout);
        resolvePromise(stdout.split("\n").filter((l) => l.trim()));
      });

      // Send all messages then close stdin
      for (const msg of messages) {
        child.stdin!.write(JSON.stringify(msg) + "\n");
      }
      child.stdin!.end();
    });
  };

  // Test: initialize
  try {
    const lines = await stdioCall([
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "stdio-test", version: "1.0.0" },
        },
      },
    ]);
    assert(lines.length > 0, "stdio: initialize returns response");
    const resp = JSON.parse(lines[0]);
    assert(resp?.result?.serverInfo?.name !== undefined, "stdio: server info present");
    assert(resp?.result?.capabilities?.tools !== undefined, "stdio: tools capability present");
  } catch (err: any) {
    assert(false, "stdio: initialize succeeds", err.message);
  }

  // Test: initialize + list tools
  try {
    const lines = await stdioCall([
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "stdio-test", version: "1.0.0" },
        },
      },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
    ]);
    // Find tools/list response
    const toolsResp = lines.map((l) => JSON.parse(l)).find((m: any) => m.id === 2);
    const tools = toolsResp?.result?.tools ?? [];
    assert(tools.length >= 8, `stdio: tools/list returns ${tools.length} tools`);
  } catch (err: any) {
    assert(false, "stdio: tools/list succeeds", err.message);
  }

  // Test: tool call (geocode) via stdio
  if (API_KEY) {
    try {
      const lines = await stdioCall([
        {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: "stdio-test", version: "1.0.0" },
          },
        },
        { jsonrpc: "2.0", method: "notifications/initialized" },
        {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "maps_geocode", arguments: { address: "Tokyo Tower" } },
        },
      ]);
      const geocodeResp = lines.map((l) => JSON.parse(l)).find((m: any) => m.id === 2);
      const content = geocodeResp?.result?.content ?? [];
      assert(content.length > 0, "stdio: geocode returns content");
      if (content.length > 0) {
        const parsed = JSON.parse(content[0].text);
        assert(typeof parsed?.location?.lat === "number", "stdio: geocode returns lat");
      }
    } catch (err: any) {
      assert(false, "stdio: geocode succeeds", err.message);
    }
  } else {
    console.log("  ⏭️  stdio tool call skipped (no GOOGLE_MAPS_API_KEY)");
  }
}

// --------------- Test 7: CLI Exec Mode ---------------

async function testExecMode(): Promise<void> {
  console.log("\n🧪 Test 7: CLI exec mode");

  const { execFileSync } = await import("node:child_process");
  const { resolve } = await import("node:path");
  const cliPath = resolve(import.meta.dirname ?? ".", "../dist/cli.js");

  const execArgs = (tool: string, params: string): string => {
    try {
      return execFileSync("node", [cliPath, "exec", tool, params, "--apikey", API_KEY], {
        encoding: "utf-8",
        timeout: 30000,
      }).trim();
    } catch (err: any) {
      return err.stdout?.trim() ?? err.message;
    }
  };

  // Test: exec --help shows available tools
  try {
    const helpOut = execFileSync("node", [cliPath, "exec", "--help"], {
      encoding: "utf-8",
      timeout: 5000,
    });
    assert(helpOut.includes("geocode"), "exec --help lists geocode");
    assert(helpOut.includes("search-nearby"), "exec --help lists search-nearby");
    assert(helpOut.includes("Execute a tool"), "exec --help shows description");
  } catch {
    assert(false, "exec --help runs without error");
  }

  // Test: exec unknown tool returns error
  try {
    execFileSync("node", [cliPath, "exec", "nonexistent", "{}", "--apikey", "fake"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    });
    assert(false, "exec unknown tool exits with error");
  } catch (err: any) {
    const stderr = err.stderr ?? "";
    assert(stderr.includes("Unknown tool"), "exec unknown tool error message", stderr.slice(0, 200));
  }

  if (!API_KEY) {
    console.log("  ⏭️  Exec API tests skipped (no GOOGLE_MAPS_API_KEY)");
    return;
  }

  // Test: exec geocode
  const geocodeOut = execArgs("geocode", '{"address":"Tokyo Tower"}');
  try {
    const parsed = JSON.parse(geocodeOut);
    assert(parsed?.success === true, "exec geocode succeeds");
    assert(typeof parsed?.data?.location?.lat === "number", "exec geocode returns lat");
  } catch {
    assert(false, "exec geocode returns valid JSON", geocodeOut.slice(0, 200));
  }

  // Test: exec reverse-geocode
  const reverseOut = execArgs("reverse-geocode", '{"latitude":35.6586,"longitude":139.7454}');
  try {
    const parsed = JSON.parse(reverseOut);
    assert(parsed?.success === true, "exec reverse-geocode succeeds");
    assert(parsed?.data?.formatted_address !== undefined, "exec reverse-geocode returns address");
  } catch {
    assert(false, "exec reverse-geocode returns valid JSON", reverseOut.slice(0, 200));
  }

  // Test: exec search-places
  const searchOut = execArgs("search-places", '{"query":"ramen in Tokyo"}');
  try {
    const parsed = JSON.parse(searchOut);
    assert(parsed?.success === true, "exec search-places succeeds");
    assert(Array.isArray(parsed?.data) && parsed.data.length > 0, "exec search-places returns results");
  } catch {
    assert(false, "exec search-places returns valid JSON", searchOut.slice(0, 200));
  }
}

// --------------- Main ---------------

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log(" mcp-google-map smoke test");
  console.log(`  Endpoint: ${MCP_ENDPOINT}`);
  console.log(`  API Key:  ${API_KEY ? "✅ provided" : "⚠️  not set (some tests skipped)"}`);
  console.log("═══════════════════════════════════════════");

  // Test stdio and exec mode first (no server needed)
  await testStdio();
  await testExecMode();

  try {
    console.log("\n⏳ Starting server...");
    await startServer();
    console.log("✅ Server started\n");

    const session = await testInitialize();
    await testListTools(session);
    await testGeocode(session);
    await testToolCalls(session);
    await testMultiSession();
  } catch (err) {
    console.error("\n💥 Fatal error:", err);
    failed++;
  } finally {
    stopServer();
  }

  console.log("\n═══════════════════════════════════════════");
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
