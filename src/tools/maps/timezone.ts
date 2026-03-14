import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_timezone";
const DESCRIPTION =
  "Get the timezone and current local time for a location. Use when the user asks 'what time is it in Tokyo', needs to coordinate a meeting across timezones, or is planning travel across timezone boundaries. Returns timezone ID, UTC/DST offsets, and computed local time.";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
  timestamp: z
    .number()
    .optional()
    .describe("Unix timestamp in ms to query timezone at a specific moment (defaults to now)"),
};

export type TimezoneParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getTimezone(params.latitude, params.longitude, params.timestamp);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get timezone data" }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting timezone: ${errorMessage}` }],
    };
  }
}

export const Timezone = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
