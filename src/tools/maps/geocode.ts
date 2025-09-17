import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_geocode";
const DESCRIPTION = "Convert addresses or place names to geographic coordinates (latitude and longitude)";

const SCHEMA = {
  address: z.string().describe("Address or place name to convert to coordinates"),
};

export type GeocodeParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    // Create a new PlacesSearcher instance with the current request's API key
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.geocode(params.address);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to geocode address" }],
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
      content: [{ type: "text", text: `Error geocoding address: ${errorMessage}` }],
    };
  }
}

export const Geocode = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};