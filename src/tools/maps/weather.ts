import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_weather";
const DESCRIPTION =
  "Get current weather conditions or forecast for a geographic location. Returns temperature, humidity, wind, UV index, precipitation, and more. Supports current conditions, daily forecast (up to 10 days), and hourly forecast (up to 240 hours). Note: coverage varies by region — China, Japan, South Korea, Cuba, Iran, North Korea, Syria are unsupported or limited. Use when the user asks about weather at a destination, is planning outdoor activities, or needs weather for travel planning.";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
  type: z
    .enum(["current", "forecast_daily", "forecast_hourly"])
    .optional()
    .describe("Weather data type: current (default), forecast_daily (up to 10 days), forecast_hourly (up to 240 hours)"),
  forecastDays: z
    .number()
    .optional()
    .describe("Number of forecast days (1-10, only for forecast_daily, default: 5)"),
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
