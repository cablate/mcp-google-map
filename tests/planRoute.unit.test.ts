import assert from "node:assert/strict";
import test from "node:test";
import { PlacesSearcher } from "../src/services/PlacesSearcher.js";

interface RouteStub {
  optimizedIntermediateWaypointIndex?: number[];
  legCount: number;
}

/**
 * Build a PlacesSearcher whose network dependencies are stubbed so planRoute
 * can be exercised without hitting the Geocoding or Routes APIs.
 */
function createSearcher(routeStub: RouteStub): PlacesSearcher {
  const searcher = new PlacesSearcher("test-api-key");

  // Deterministic geocode: echo the requested stop as originalName.
  searcher.geocode = async (address: string) => ({
    success: true,
    data: {
      location: { lat: 0, lng: 0 },
      formatted_address: `${address} (formatted)`,
      place_id: `place-${address}`,
    },
  });

  // Stub the Routes API response.
  (
    searcher as unknown as { routesService: { computeRoutes: (p: unknown) => Promise<unknown> } }
  ).routesService.computeRoutes = async () => ({
    routes: [
      {
        legs: Array.from({ length: routeStub.legCount }, () => ({
          distanceMeters: 1000,
          duration: "600s",
        })),
      },
    ],
    summary: "",
    total_distance: { value: 0, text: "" },
    total_duration: { value: 0, text: "" },
    arrival_time: "",
    departure_time: "",
    ...(routeStub.optimizedIntermediateWaypointIndex
      ? { optimizedIntermediateWaypointIndex: routeStub.optimizedIntermediateWaypointIndex }
      : {}),
  });

  return searcher;
}

test("planRoute handles 2 stops (optimize: true, no intermediates)", async () => {
  const searcher = createSearcher({ legCount: 1 });
  const result = await searcher.planRoute({ stops: ["A", "B"] });

  assert.equal(result.data.optimized, false); // <= 3 stops => no optimization
  assert.deepEqual(result.data.stops, ["A (A (formatted))", "B (B (formatted))"]);
  assert.equal(result.data.legs.length, 1);
});

test("planRoute handles 2 stops (optimize: false)", async () => {
  const searcher = createSearcher({ legCount: 1 });
  const result = await searcher.planRoute({ stops: ["A", "B"], optimize: false });

  assert.equal(result.data.optimized, false);
  assert.equal(result.data.legs.length, 1);
});

test("planRoute handles 3 stops (optimize: true) — skips optimization (too few intermediates)", async () => {
  // Optimization is skipped because it requires at least 4 stops (2 intermediates)
  const searcher = createSearcher({ legCount: 2 });
  const result = await searcher.planRoute({ stops: ["A", "B", "C"], optimize: true });

  assert.equal(result.data.optimized, false);
  assert.deepEqual(
    result.data.stops.map((s: string) => s.split(" (")[0]),
    ["A", "B", "C"]
  );
  assert.equal(result.data.legs.length, 2);
});

test("planRoute handles 3 stops (optimize: false) — keeps original order", async () => {
  const searcher = createSearcher({ legCount: 2 });
  const result = await searcher.planRoute({ stops: ["A", "B", "C"], optimize: false });

  assert.equal(result.data.optimized, false);
  assert.deepEqual(
    result.data.stops.map((s: string) => s.split(" (")[0]),
    ["A", "B", "C"]
  );
});

test("planRoute applies a valid optimized waypoint order (4 stops / 2 intermediates)", async () => {
  const searcher = createSearcher({ legCount: 3, optimizedIntermediateWaypointIndex: [1, 0] });
  const result = await searcher.planRoute({
    stops: ["Start", "I0", "I1", "End"],
    optimize: true,
  });

  assert.equal(result.data.optimized, true);
  assert.deepEqual(
    result.data.stops.map((s: string) => s.split(" (")[0]),
    ["Start", "I1", "I0", "End"]
  );
  assert.equal(result.data.legs.length, 3);
});
