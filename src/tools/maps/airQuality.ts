import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_air_quality";
const DESCRIPTION =
  "Get air quality for a location — AQI index, pollutant concentrations, and health recommendations by demographic group (elderly, children, athletes, pregnant women, etc.). Use when the user asks 'is the air safe', 'should I wear a mask', 'good for outdoor exercise', or is planning travel for someone with respiratory/heart conditions. Coverage: global including Japan (unlike weather). Returns both universal AQI and local index (EPA for US, AEROS for Japan, etc.).";

const SCHEMA = {
  latitude: z.number().describe("Latitude coordinate"),
  longitude: z.number().describe("Longitude coordinate"),
  includeHealthRecommendations: z
    .boolean()
    .optional()
    .describe("Include health advice per demographic group (default: true)"),
  includePollutants: z
    .boolean()
    .optional()
    .describe("Include individual pollutant concentrations — PM2.5, PM10, NO2, O3, CO, SO2 (default: false)"),
};

export type AirQualityParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getAirQuality(
      params.latitude,
      params.longitude,
      params.includeHealthRecommendations,
      params.includePollutants
    );

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get air quality data" }],
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
      content: [{ type: "text", text: `Error getting air quality: ${errorMessage}` }],
    };
  }
}

export const AirQuality = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
