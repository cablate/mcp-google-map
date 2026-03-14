import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_weather";
const DESCRIPTION =
  "Get weather for a location — current conditions, daily forecast (10 days), or hourly forecast (240 hours). Use when the user asks 'what's the weather in Paris', is planning outdoor activities, or needs to pack for a trip. Coverage: most regions supported, but China, Japan, South Korea, Cuba, Iran, North Korea, Syria are unavailable.";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
  type: z
    .enum(["current", "forecast_daily", "forecast_hourly"])
    .optional()
    .describe("current = right now, forecast_daily = multi-day outlook, forecast_hourly = hour-by-hour"),
  forecastDays: z.number().optional().describe("Number of forecast days (1-10, only for forecast_daily, default: 5)"),
  forecastHours: z
    .number()
    .optional()
    .describe("Number of forecast hours (1-240, only for forecast_hourly, default: 24)"),
};

export type WeatherParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getWeather(
      params.latitude,
      params.longitude,
      params.type || "current",
      params.forecastDays,
      params.forecastHours
    );

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
