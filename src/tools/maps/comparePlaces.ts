import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_compare_places";
const DESCRIPTION =
  "Compare multiple places side-by-side in one call — searches by query, gets details for each result, and optionally calculates distance from your location. Use when the user asks 'which restaurant should I pick', 'compare these hotels', or needs a decision table. Replaces the manual chain of search-places → place-details → distance-matrix.";

const SCHEMA = {
  query: z.string().describe("Search query (e.g., 'ramen near Shibuya', 'hotels in Taipei')"),
  userLocation: z
    .object({
      latitude: z.number().describe("Your latitude"),
      longitude: z.number().describe("Your longitude"),
    })
    .optional()
    .describe("Your current location — if provided, adds distance and drive time to each result"),
  limit: z.number().optional().describe("Max places to compare (default: 5)"),
};

export type ComparePlacesParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const searcher = new PlacesSearcher(apiKey);
    const result = await searcher.comparePlaces(params);

    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      isError: false,
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error comparing places: ${error.message}` }],
    };
  }
}

export const ComparePlaces = { NAME, DESCRIPTION, SCHEMA, ACTION };
