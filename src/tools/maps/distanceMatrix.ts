import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_distance_matrix";
const DESCRIPTION = "Calculate travel distances and durations between multiple origins and destinations for different travel modes";

const SCHEMA = {
  origins: z.array(z.string()).describe("List of origin addresses or coordinates"),
  destinations: z.array(z.string()).describe("List of destination addresses or coordinates"),
  mode: z.enum(["driving", "walking", "bicycling", "transit"]).default("driving").describe("Travel mode for calculation"),
};

export type DistanceMatrixParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    // Create a new PlacesSearcher instance with the current request's API key
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.calculateDistanceMatrix(params.origins, params.destinations, params.mode);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to calculate distance matrix" }],
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
      content: [{ type: "text", text: `Error calculating distance matrix: ${errorMessage}` }],
    };
  }
}

export const DistanceMatrix = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};