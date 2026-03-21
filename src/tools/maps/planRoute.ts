import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_plan_route";
const DESCRIPTION =
  "Plan an optimized multi-stop route in one call — geocodes all stops, uses Routes API waypoint optimization (up to 25 intermediate stops) to find the most efficient visit order, and returns directions for each leg. Use when the user says 'visit these 5 places efficiently', 'plan a route through A, B, C', or needs a multi-stop itinerary. Replaces the manual chain of geocode → distance-matrix → directions. For multi-day trips: create one plan_route call per day with stops that follow a geographic arc (e.g. east→west) rather than mixing distant areas. After results, call static_map to visualize the route.";

const SCHEMA = {
  stops: z.array(z.string()).min(2).describe("List of addresses or landmarks to visit (minimum 2)"),
  mode: z.enum(["driving", "walking", "bicycling", "transit"]).optional().describe("Travel mode (default: driving)"),
  optimize: z
    .boolean()
    .optional()
    .describe(
      "Auto-optimize visit order via Routes API waypoint optimization (default: true). Set false to keep original order. Not available for transit mode."
    ),
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
