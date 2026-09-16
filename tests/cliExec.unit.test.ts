import assert from "node:assert/strict";
import test from "node:test";
import { PlacesSearcher } from "../src/services/PlacesSearcher.js";

// cli.ts is also the executable entrypoint and detects direct execution from
// process.argv[1]. Import it with a neutral argv value so the test process
// does not start an HTTP server as a side effect.
const originalArgv1 = process.argv[1];
process.argv[1] = "cli-exec-unit-test";
const { EXEC_TOOLS, execTool, runExecCommand } = await import("../src/cli.js");
process.argv[1] = originalArgv1;

interface CapturedOutput {
  stdout: string;
  stderr: string;
}

function createStreams(): {
  output: CapturedOutput;
  streams: { stdout: { write: (chunk: string) => boolean }; stderr: { write: (chunk: string) => boolean } };
} {
  const output: CapturedOutput = { stdout: "", stderr: "" };
  return {
    output,
    streams: {
      stdout: {
        write: (chunk: string) => {
          output.stdout += chunk;
          return true;
        },
      },
      stderr: {
        write: (chunk: string) => {
          output.stderr += chunk;
          return true;
        },
      },
    },
  };
}

test("runExecCommand writes successful service responses as JSON to stdout", async () => {
  const { output, streams } = createStreams();
  const exitCode = await runExecCommand(
    "geocode",
    { address: "Tokyo Tower" },
    "test-api-key",
    async (toolName, params, apiKey) => {
      assert.equal(toolName, "geocode");
      assert.deepEqual(params, { address: "Tokyo Tower" });
      assert.equal(apiKey, "test-api-key");
      return { success: true, data: { location: { lat: 35.6586, lng: 139.7454 } } };
    },
    streams
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(JSON.parse(output.stdout), {
    success: true,
    data: { location: { lat: 35.6586, lng: 139.7454 } },
  });
  assert.equal(output.stderr, "");
});

test("runExecCommand treats a failed service response as a command failure", async () => {
  const { output, streams } = createStreams();
  const exitCode = await runExecCommand(
    "geocode",
    { address: "Not A Real Address" },
    "test-api-key",
    async () => ({ success: false, error: "Geocoding API request failed" }),
    streams
  );

  assert.equal(exitCode, 1);
  assert.equal(output.stdout, "");
  assert.deepEqual(JSON.parse(output.stderr), { error: "Geocoding API request failed" });
});

test("runExecCommand reports thrown errors on stderr", async () => {
  const { output, streams } = createStreams();
  const exitCode = await runExecCommand(
    "geocode",
    {},
    "test-api-key",
    async () => {
      throw new Error("request timed out");
    },
    streams
  );

  assert.equal(exitCode, 1);
  assert.equal(output.stdout, "");
  assert.deepEqual(JSON.parse(output.stderr), { error: "request timed out" });
});

test("exec mode exposes all 18 short tool names", () => {
  assert.equal(EXEC_TOOLS.length, 18);
  assert.deepEqual(
    [...EXEC_TOOLS],
    [
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
    ]
  );
});

test("execTool maps short and MCP geocode aliases to the same service", async () => {
  const originalGeocode = PlacesSearcher.prototype.geocode;
  const addresses: string[] = [];
  PlacesSearcher.prototype.geocode = async (address) => {
    addresses.push(address);
    return {
      success: true,
      data: {
        location: { lat: 35.6586, lng: 139.7454 },
        formatted_address: address,
        place_id: "test-place-id",
      },
    };
  };

  try {
    const shortNameResult = await execTool("geocode", { address: "Tokyo Tower" }, "test-api-key");
    const mcpNameResult = await execTool("maps_geocode", { address: "Eiffel Tower" }, "test-api-key");

    assert.equal(shortNameResult.success, true);
    assert.equal(mcpNameResult.success, true);
    assert.deepEqual(addresses, ["Tokyo Tower", "Eiffel Tower"]);
  } finally {
    PlacesSearcher.prototype.geocode = originalGeocode;
  }
});

test("execTool accepts the snake_case search-nearby alias", async () => {
  const originalSearchNearby = PlacesSearcher.prototype.searchNearby;
  let receivedKeyword: string | undefined;
  PlacesSearcher.prototype.searchNearby = async (params) => {
    receivedKeyword = params.keyword;
    return { success: true, data: [] };
  };

  try {
    const result = await execTool(
      "search_nearby",
      { center: { value: "35.68,139.74", isCoordinates: true }, keyword: "restaurant" },
      "test-api-key"
    );

    assert.equal(result.success, true);
    assert.equal(receivedKeyword, "restaurant");
  } finally {
    PlacesSearcher.prototype.searchNearby = originalSearchNearby;
  }
});
