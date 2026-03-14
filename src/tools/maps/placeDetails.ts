import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_place_details";
const DESCRIPTION =
  "Get comprehensive details for a specific place using its Google Maps place_id. Use after search_nearby or maps_search_places to get full information including reviews, phone number, website, opening hours, and photos. Returns everything needed to evaluate or contact a business.";

const SCHEMA = {
  placeId: z.string().describe("Google Maps place ID"),
};

export type PlaceDetailsParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    // Create a new PlacesSearcher instance with the current request's API key
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getPlaceDetails(params.placeId);

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
