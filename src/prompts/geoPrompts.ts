import { z } from "zod";

export interface PromptConfig {
  name: string;
  description: string;
  argsSchema?: Record<string, z.ZodTypeAny>;
  callback: (args: any) => { messages: Array<{ role: "user" | "assistant"; content: { type: "text"; text: string } }> };
}

const TRAVEL_PLANNER: PromptConfig = {
  name: "travel-planner",
  description: "Plan a trip with geo tools — generates an itinerary with routes, places, weather, and map images.",
  argsSchema: {
    destination: z.string().describe("Where to travel (city or region)"),
    duration: z.string().optional().describe("Trip duration, e.g. '3 days'"),
    style: z.string().optional().describe("Trip style: budget, luxury, foodie, cultural, adventure"),
  },
  callback: (args: any) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Plan a trip to ${args.destination}${args.duration ? ` for ${args.duration}` : ""}${args.style ? ` (${args.style} style)` : ""}.`,
            "",
            "Use the available geo tools in this order:",
            "1. geocode the destination to get coordinates",
            "2. explore_area to discover restaurants, attractions, and cafes",
            "3. weather + air_quality to check conditions",
            "4. plan_route to create an optimized itinerary connecting the best spots",
            "5. static_map to generate a map showing the planned route with markers",
            "",
            "For multi-day trips, create a separate route and map for each day.",
            "Present results as a structured itinerary with times, travel durations, and a map for each day.",
          ].join("\n"),
        },
      },
    ],
  }),
};

const NEIGHBORHOOD_SCOUT: PromptConfig = {
  name: "neighborhood-scout",
  description: "Analyze a neighborhood for living, working, or visiting — amenities, transit, dining, safety indicators.",
  argsSchema: {
    location: z.string().describe("Neighborhood or address to analyze"),
    priorities: z.string().optional().describe("What matters most: schools, transit, restaurants, parks, nightlife, safety"),
  },
  callback: (args: any) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Analyze the neighborhood around ${args.location}${args.priorities ? ` with focus on: ${args.priorities}` : ""}.`,
            "",
            "Use the available geo tools:",
            "1. geocode the location",
            "2. explore_area with types relevant to the priorities (restaurant, school, transit_station, park, hospital, supermarket)",
            "3. elevation to check terrain/flood risk",
            "4. distance_matrix to measure commute times to key destinations (city center, airport, train station)",
            "5. air_quality to check environmental conditions",
            "6. static_map to visualize the area with color-coded markers by category",
            "",
            "Present as a neighborhood scorecard with:",
            "- Category ratings (dining, transit, green space, etc.)",
            "- Key distances and commute times",
            "- Environmental conditions (elevation, air quality)",
            "- Top 3 highlights and potential concerns",
            "- A map showing all discovered amenities",
          ].join("\n"),
        },
      },
    ],
  }),
};

const ROUTE_OPTIMIZER: PromptConfig = {
  name: "route-optimizer",
  description: "Optimize a multi-stop route — find the best order, get directions, and visualize on a map.",
  argsSchema: {
    stops: z.string().describe("Comma-separated list of stops to visit"),
    mode: z.string().optional().describe("Travel mode: driving, walking, bicycling, transit"),
  },
  callback: (args: any) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: [
            `Optimize a route visiting these stops: ${args.stops}${args.mode ? ` by ${args.mode}` : ""}.`,
            "",
            "Use the available geo tools:",
            "1. plan_route with optimize=true to find the most efficient visit order",
            "2. static_map to visualize the optimized route with numbered markers and path",
            "",
            "Present results as:",
            "- Optimized stop order with addresses",
            "- Total distance and time",
            "- Leg-by-leg breakdown (distance, duration, key turns)",
            "- A map showing the route with numbered stops",
            args.mode === "transit"
              ? "- Include transit line names and transfer points"
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  }),
};

export const GEO_PROMPTS: PromptConfig[] = [TRAVEL_PLANNER, NEIGHBORHOOD_SCOUT, ROUTE_OPTIMIZER];
