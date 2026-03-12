import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_search_places";
const DESCRIPTION =
  "Search for places using a free-text query like 'sushi restaurants in Tokyo' or 'best coffee shops near Central Park'. More flexible than search_nearby — supports natural language queries, optional location bias, rating filters, and open-now filtering. Use when the user describes what they're looking for in words rather than by type and coordinates.";

const SCHEMA = {
  query: z.string().describe("Text search query (e.g., 'Italian restaurants in Manhattan', 'hotels near Taipei 101')"),
  locationBias: z
    .object({
      latitude: z.number().describe("Latitude to bias results toward"),
      longitude: z.number().describe("Longitude to bias results toward"),
      radius: z.number().optional().describe("Bias radius in meters (default: 5000)"),
    })
    .optional()
    .describe("Optional location to bias results toward"),
  openNow: z.boolean().optional().describe("Only return places that are currently open"),
  minRating: z.number().optional().describe("Minimum rating filter (1.0 - 5.0)"),
  includedType: z.string().optional().describe("Filter by place type (e.g., restaurant, cafe, hotel)"),
};

export type SearchPlacesParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.searchText({
      query: params.query,
      locationBias: params.locationBias,
      openNow: params.openNow,
      minRating: params.minRating,
      includedType: params.includedType,
    });

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to search places" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error searching places: ${errorMessage}` }],
    };
  }
}

export const SearchPlaces = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
