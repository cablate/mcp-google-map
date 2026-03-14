import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_weather";
const DESCRIPTION =
  "Get current weather conditions for a geographic location. Returns temperature, humidity, wind, UV index, precipitation, and more. Use when the user asks about weather at a destination, is planning outdoor activities, or needs to factor weather into travel plans. Requires Weather API enabled in Google Cloud Console.";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
};

export type WeatherParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getWeather(params.latitude, params.longitude);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get weather data" }],
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
      content: [{ type: "text", text: `Error getting weather: ${errorMessage}` }],
    };
  }
}

export const Weather = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
