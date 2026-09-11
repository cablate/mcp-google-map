import assert from "node:assert/strict";
import test from "node:test";
import { PlacesSearcher } from "../src/services/PlacesSearcher.js";

const FIXTURES: Record<
  string,
  {
    geocode?: { location: { lat: number; lng: number }; formatted_address: string; place_id: string };
    places?: { location: { lat: number; lng: number }; address: string; place_id: string; name: string };
  }
> = {
  "Tokyo Tower": {
    geocode: {
      location: { lat: 35.6585805, lng: 139.7454329 },
      formatted_address: "Tokyo Tower, Tokyo, Japan",
      place_id: "place-tokyo-tower",
    },
  },
  河口湖駅: {
    geocode: {
      location: { lat: 35.4985, lng: 138.769 },
      formatted_address: "Kawaguchiko Station, Yamanashi, Japan",
      place_id: "place-kawaguchiko",
    },
  },
  "35.6585805,139.7454329": {
    geocode: {
      location: { lat: 35.6586, lng: 139.7455 },
      formatted_address: "4-chome-2-8 Shibakoen, Minato City, Tokyo",
      place_id: "place-nearest-street-address",
    },
  },
  "Place Without Id": {
    places: {
      location: { lat: 1.23, lng: 4.56 },
      address: "Somewhere with no place ID",
      place_id: "",
      name: "Somewhere with no place ID",
    },
  },
  "精進湖 他根浜": {
    places: {
      location: { lat: 35.4906841, lng: 138.6046066 },
      address: "Tatego-Hama Beach, Fujikawaguchiko",
      place_id: "ChIJ13ziPsznG2ARIqd4uJcjN0s",
      name: "Tatego-Hama Beach",
    },
  },
};

function createSearcher(captured: { textQueries: string[]; routeParams: any; nearbyCenters: string[] }) {
  const searcher = new PlacesSearcher("test-api-key");

  searcher.geocode = async (address: string) => {
    const fixture = FIXTURES[address];
    if (fixture?.geocode) {
      return { success: true, data: fixture.geocode };
    }
    return { success: false, error: `No location found for: ${address}` };
  };

  searcher.searchText = async (params: { query: string }) => {
    captured.textQueries.push(params.query);
    const fixture = FIXTURES[params.query];
    if (fixture?.places) {
      return { success: true, data: [fixture.places] };
    }
    return { success: true, data: [] };
  };

  (searcher as unknown as { routesService: any }).routesService = {
    computeRoutes: async (params: any) => {
      captured.routeParams = params;
      return {
        routes: [
          {
            description: "Mock Route",
            distanceMeters: 1000,
            duration: "600s",
            legs: [
              { distanceMeters: 500, duration: "300s" },
              { distanceMeters: 500, duration: "300s" },
            ],
          },
        ],
      };
    },
  };

  searcher.searchNearby = async (params: any) => {
    if (params.center?.value) {
      captured.nearbyCenters.push(params.center.value);
    }
    return { success: true, data: [] };
  };

  return searcher;
}

test("planRoute sends resolved waypoints, not raw strings", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  await searcher.planRoute({ stops: ["Tokyo Tower", "河口湖駅"] });

  assert.deepEqual(captured.routeParams.origin, { placeId: "place-tokyo-tower" });
  assert.deepEqual(captured.routeParams.destination, { placeId: "place-kawaguchiko" });
});

test("planRoute routes to the same place it labels", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  const result = await searcher.planRoute({
    stops: ["Tokyo Tower", "精進湖 他根浜", "河口湖駅"],
    optimize: false,
  });

  assert.deepEqual(captured.routeParams.intermediates, [{ placeId: "ChIJ13ziPsznG2ARIqd4uJcjN0s" }]);
  assert.equal(result.data.stops[1], "精進湖 他根浜 (Tatego-Hama Beach, Fujikawaguchiko)");
});

test("planRoute falls back to Places Text Search when geocoding finds nothing", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  await searcher.planRoute({ stops: ["Tokyo Tower", "精進湖 他根浜"] });

  assert.deepEqual(captured.textQueries, ["精進湖 他根浜"]);
});

test("planRoute throws when neither geocoding nor text search resolves a stop", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  await assert.rejects(
    async () => {
      await searcher.planRoute({ stops: ["Tokyo Tower", "NonExistentUnknownPlace123"] });
    },
    (err: Error) => {
      return err.message.includes("NonExistentUnknownPlace123");
    }
  );
});

test("planRoute rejects unusable coordinates without calling any API", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);
  let geocodeCalls = 0;
  searcher.geocode = async () => {
    geocodeCalls += 1;
    return { success: false, error: "should not be called" };
  };

  // Out of range, so it is not a usable point. It must not reach Text Search
  // either, which would happily return an unrelated place for the numbers.
  await assert.rejects(
    async () => {
      await searcher.planRoute({ stops: ["99.9,99.9", "Tokyo Tower"] });
    },
    (err: Error) => err.message.includes("99.9,99.9")
  );
  assert.equal(geocodeCalls, 0);
  assert.deepEqual(captured.textQueries, []);
});

test("exploreArea falls back to Places Text Search when geocoding finds nothing", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  const result = await searcher.exploreArea({ location: "精進湖 他根浜" });

  assert.deepEqual(captured.nearbyCenters, [
    "35.4906841,138.6046066",
    "35.4906841,138.6046066",
    "35.4906841,138.6046066",
  ]);
  assert.equal(result.data.location.address, "Tatego-Hama Beach, Fujikawaguchiko");
  assert.equal(result.data.location.lat, 35.4906841);
  assert.equal(result.data.location.lng, 138.6046066);
});

test("planRoute falls back to coordinates when a resolved place has no place ID", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  await searcher.planRoute({ stops: ["Tokyo Tower", "Place Without Id"] });

  assert.deepEqual(captured.routeParams.destination, {
    latLng: { latitude: 1.23, longitude: 4.56 },
  });
});

test("planRoute routes coordinate stops through the caller's exact point", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);

  await searcher.planRoute({ stops: ["35.6585805,139.7454329", "河口湖駅"] });

  // Not { placeId: "place-nearest-street-address" }: geocoding a coordinate
  // only supplies a display address, it must not move the waypoint.
  assert.deepEqual(captured.routeParams.origin, {
    latLng: { latitude: 35.6585805, longitude: 139.7454329 },
  });
});

test("planRoute routes coordinate stops even when geocoding is unavailable", async () => {
  const captured = { textQueries: [], routeParams: null as any, nearbyCenters: [] };
  const searcher = createSearcher(captured);
  searcher.geocode = async () => ({ success: false, error: "Geocoding API has not been used in project" });

  const result = await searcher.planRoute({ stops: ["35.6585805,139.7454329", "35.7147651,139.7966553"] });

  assert.deepEqual(captured.routeParams.origin, {
    latLng: { latitude: 35.6585805, longitude: 139.7454329 },
  });
  // No display address available, so the input stands in for it.
  assert.equal(result.data.stops[0], "35.6585805,139.7454329 (35.6585805,139.7454329)");
  assert.deepEqual(captured.textQueries, []);
});
