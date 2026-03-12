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

  assert(tools.length >= 7, `Has at least 7 tools (got ${tools.length})`);

  const toolNames = tools.map((t: any) => t.name);
  const expectedTools = [
    "search_nearby",
    "get_place_details",
    "maps_geocode",
    "maps_reverse_geocode",
    "maps_distance_matrix",
    "maps_directions",
    "maps_elevation",
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
    assert(tools.length >= 7, `Session ${index}: tools/list returns ${tools.length} tools`);
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

// --------------- Main ---------------

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log(" mcp-google-map smoke test");
  console.log(`  Endpoint: ${MCP_ENDPOINT}`);
  console.log(`  API Key:  ${API_KEY ? "✅ provided" : "⚠️  not set (some tests skipped)"}`);
  console.log("═══════════════════════════════════════════");

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
