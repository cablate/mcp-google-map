import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_local_rank_tracker";
const DESCRIPTION =
  "Track a business's local search ranking across a geographic grid (like LocalFalcon). Searches the same keyword from multiple coordinates around a center point to see how rank varies by location. Returns rank at each grid point, top-3 competitors per point, and summary metrics (ARP, ATRP, SoLV). Useful for local SEO analysis.";

const SCHEMA = {
  keyword: z.string().describe("Search keyword to track ranking for (e.g., 'dentist', 'coffee shop', 'pizza')"),
  placeId: z.string().describe("Google Maps place_id of the target business to track"),
  center: z
    .object({
      latitude: z.number().describe("Center latitude of the grid"),
      longitude: z.number().describe("Center longitude of the grid"),
    })
    .describe("Center coordinate for the grid (typically the business location)"),
  gridSize: z
    .number()
    .int()
    .min(3)
    .max(7)
    .optional()
    .describe("Grid dimension (3 = 3×3 = 9 points, 5 = 5×5 = 25 points, 7 = 7×7 = 49 points). Default: 3"),
  gridSpacing: z
    .number()
    .min(100)
    .max(10000)
    .optional()
    .describe("Distance between grid points in meters (100-10000). Default: 1000"),
};

export type LocalRankTrackerParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.localRankTracker(params);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to track local rank" }],
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
      content: [{ type: "text", text: `Error tracking local rank: ${errorMessage}` }],
    };
  }
}

export const LocalRankTracker = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
