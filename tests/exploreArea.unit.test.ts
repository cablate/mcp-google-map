import assert from "node:assert/strict";
import test from "node:test";
import { PlacesSearcher } from "../src/services/PlacesSearcher.js";

function createSearcher(searches: string[]): PlacesSearcher {
  const searcher = new PlacesSearcher("test-api-key");

  searcher.geocode = async () => ({
    success: true,
    data: {
      location: { lat: 25.033, lng: 121.5654 },
      formatted_address: "Taipei 101",
      place_id: "test-place-id",
    },
  });
  searcher.searchNearby = async (params) => {
    if (params.keyword) searches.push(params.keyword);
    return { success: true, data: [] };
  };

  return searcher;
}

test("exploreArea uses valid Places API types by default", async () => {
  const searches: string[] = [];
  const searcher = createSearcher(searches);

  await searcher.exploreArea({ location: "Taipei 101" });

  assert.deepEqual(searches, ["restaurant", "cafe", "tourist_attraction"]);
  assert.equal(searches.includes("attraction"), false);
});

test("exploreArea preserves caller-supplied place types", async () => {
  const searches: string[] = [];
  const searcher = createSearcher(searches);

  await searcher.exploreArea({ location: "Taipei 101", types: ["museum", "park"] });

  assert.deepEqual(searches, ["museum", "park"]);
});
