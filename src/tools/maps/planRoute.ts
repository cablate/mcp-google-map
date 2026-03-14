import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_plan_route";
const DESCRIPTION =
  "Plan an optimized multi-stop route in one call — geocodes all stops, finds the most efficient visit order using distance-matrix, and returns step-by-step directions between each stop. Use when the user says 'visit these 5 places efficiently', 'plan a route through A, B, C', or needs a multi-stop itinerary. Replaces the manual chain of geocode → distance-matrix → directions.";

const SCHEMA = {
  stops: z.array(z.string()).min(2).describe("List of addresses or landmarks to visit (minimum 2)"),
  mode: z.enum(["driving", "walking", "bicycling", "transit"]).optional().describe("Travel mode (default: driving)"),
  optimize: z
    .boolean()
    .optional()
    .describe("Auto-optimize visit order by nearest-neighbor (default: true). Set false to keep original order."),
};

export type PlanRouteParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const searcher = new PlacesSearcher(apiKey);
    const result = await searcher.planRoute(params);

    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      isError: false,
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error planning route: ${error.message}` }],
    };
  }
}

export const PlanRoute = { NAME, DESCRIPTION, SCHEMA, ACTION };
