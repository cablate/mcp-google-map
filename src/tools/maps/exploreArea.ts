import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_explore_area";
const DESCRIPTION =
  "Explore what's around a location in one call — searches multiple place types, gets details for the top results, and returns a categorized summary. Use when the user asks 'what's around here', 'explore the area near my hotel', or needs a quick overview of a neighborhood. Replaces the manual chain of geocode → search-nearby → place-details.";

const SCHEMA = {
  location: z.string().describe("Address or landmark to explore around"),
  types: z
    .array(z.string())
    .optional()
    .describe("Place types to search (default: restaurant, cafe, attraction). Examples: hotel, bar, park, museum"),
  radius: z.number().optional().describe("Search radius in meters (default: 1000)"),
  topN: z.number().optional().describe("Number of top results per type to get details for (default: 3)"),
};

export type ExploreAreaParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const searcher = new PlacesSearcher(apiKey);
    const result = await searcher.exploreArea(params);

    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      isError: false,
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error exploring area: ${error.message}` }],
    };
  }
}

export const ExploreArea = { NAME, DESCRIPTION, SCHEMA, ACTION };
