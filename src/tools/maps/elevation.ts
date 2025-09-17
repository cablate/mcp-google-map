import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_elevation";
const DESCRIPTION = "Get elevation data (height above sea level) for specific geographic locations";

const SCHEMA = {
  locations: z.array(z.object({
    latitude: z.number().describe("Latitude coordinate"),
    longitude: z.number().describe("Longitude coordinate"),
  })).describe("List of locations to get elevation data for"),
};

export type ElevationParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    // Create a new PlacesSearcher instance with the current request's API key
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getElevation(params.locations);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get elevation data" }],
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
      content: [{ type: "text", text: `Error getting elevation data: ${errorMessage}` }],
    };
  }
}

export const Elevation = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};