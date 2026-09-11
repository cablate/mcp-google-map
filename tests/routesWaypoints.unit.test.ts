import assert from "node:assert/strict";
import test from "node:test";
import { RoutesService } from "../src/services/RoutesService.js";

const MOCK_ROUTES_RESPONSE = {
  routes: [
    {
      description: "Route description",
      distanceMeters: 5000,
      duration: "600s",
      legs: [{ distanceMeters: 5000, duration: "600s" }],
    },
  ],
};

const MOCK_MATRIX_RESPONSE = [
  {
    originIndex: 0,
    destinationIndex: 0,
    distanceMeters: 1000,
    duration: "120s",
    status: {},
  },
];

test("structured waypoints forward unchanged", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any = null;

  globalThis.fetch = async (_url: any, init: any) => {
    capturedBody = JSON.parse(init.body);
    return new Response(JSON.stringify(MOCK_ROUTES_RESPONSE), { status: 200 });
  };

  try {
    const service = new RoutesService("test-api-key");
    await service.computeRoutes({
      origin: { latLng: { latitude: 35.6585, longitude: 139.7454 } },
      destination: { placeId: "test-dest-place-id" },
      intermediates: [{ latLng: { latitude: 35.5, longitude: 138.7 } }, { placeId: "test-intermediate-place-id" }],
    });

    assert.deepEqual(capturedBody.origin, {
      location: { latLng: { latitude: 35.6585, longitude: 139.7454 } },
    });
    assert.deepEqual(capturedBody.destination, {
      placeId: "test-dest-place-id",
    });
    assert.deepEqual(capturedBody.intermediates, [
      { location: { latLng: { latitude: 35.5, longitude: 138.7 } } },
      { placeId: "test-intermediate-place-id" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("plain strings still work", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any = null;

  globalThis.fetch = async (_url: any, init: any) => {
    capturedBody = JSON.parse(init.body);
    return new Response(JSON.stringify(MOCK_ROUTES_RESPONSE), { status: 200 });
  };

  try {
    const service = new RoutesService("test-api-key");
    await service.computeRoutes({
      origin: "Tokyo Tower",
      destination: "35.6,139.7",
    });

    assert.deepEqual(capturedBody.origin, { address: "Tokyo Tower" });
    assert.deepEqual(capturedBody.destination, {
      location: { latLng: { latitude: 35.6, longitude: 139.7 } },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("computeRouteMatrix still works with strings", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any = null;

  globalThis.fetch = async (_url: any, init: any) => {
    capturedBody = JSON.parse(init.body);
    return new Response(JSON.stringify(MOCK_MATRIX_RESPONSE), { status: 200 });
  };

  try {
    const service = new RoutesService("test-api-key");
    await service.computeRouteMatrix({
      origins: ["Point A"],
      destinations: ["Point B"],
    });

    assert.deepEqual(capturedBody.origins, [{ waypoint: { address: "Point A" } }]);
    assert.deepEqual(capturedBody.destinations, [{ waypoint: { address: "Point B" } }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("no-route error describes structured waypoints", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ routes: [] }), { status: 200 });
  };

  try {
    const service = new RoutesService("test-api-key");
    await assert.rejects(
      async () => {
        await service.computeRoutes({
          origin: { latLng: { latitude: 35.6585, longitude: 139.7454 } },
          destination: { placeId: "test-place-123" },
        });
      },
      (err: Error) => {
        assert.equal(err.message.includes("[object Object]"), false);
        assert.equal(err.message.includes("35.6585,139.7454"), true);
        assert.equal(err.message.includes("placeId:test-place-123"), true);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("no-route error prefers caller-supplied labels over waypoints", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ routes: [] }), { status: 200 });
  };

  try {
    const service = new RoutesService("test-api-key");
    await assert.rejects(
      async () => {
        await service.computeRoutes({
          origin: { placeId: "test-origin-123" },
          destination: { placeId: "test-dest-456" },
          originLabel: "Tokyo Station",
          destinationLabel: "Shibuya Station",
        });
      },
      (err: Error) => {
        assert.equal(err.message.includes("Tokyo Station"), true);
        assert.equal(err.message.includes("Shibuya Station"), true);
        assert.equal(err.message.includes("test-origin-123"), false);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
