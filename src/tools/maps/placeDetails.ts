import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_place_details";
const DESCRIPTION =
  "Get comprehensive details for a specific place using its Google Maps place_id. Use after search_nearby or maps_search_places to get full information including reviews, phone number, website, and opening hours. Set maxPhotos (1-10) to include photo URLs — omit or set to 0 for no photos (saves tokens).";

const SCHEMA = {
  placeId: z.string().describe("Google Maps place ID"),
  maxPhotos: z
    .number()
    .int()
    .min(0)
    .max(10)
    .optional()
    .describe("Number of photo URLs to include (0 = none, max 10). Omit to skip photos and save tokens."),
};

export type PlaceDetailsParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getPlaceDetails(params.placeId, params.maxPhotos || 0);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get place details" }],
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
      content: [{ type: "text", text: `Error getting place details: ${errorMessage}` }],
    };
  }
}

export const PlaceDetails = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
