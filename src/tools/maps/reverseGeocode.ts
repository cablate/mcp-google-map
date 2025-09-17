import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_reverse_geocode";
const DESCRIPTION = "Convert geographic coordinates (latitude and longitude) to a human-readable address";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
};

export type ReverseGeocodeParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    // Create a new PlacesSearcher instance with the current request's API key
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.reverseGeocode(params.latitude, params.longitude);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to reverse geocode coordinates" }],
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
      content: [{ type: "text", text: `Error reverse geocoding: ${errorMessage}` }],
    };
  }
}

export const ReverseGeocode = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};