import { Client, Language } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import { Logger } from "../index.js";
import { RoutesService } from "./RoutesService.js";

dotenv.config();

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  place_id?: string;
}

/**
 * Extracts a meaningful, actionable error message from Google Maps API errors.
 */
function extractErrorMessage(error: any): string {
  const statusCode = error?.response?.status;
  const apiError = error?.response?.data?.error_message;
  const apiStatus = error?.response?.data?.status;

  // Map common HTTP status codes to actionable messages
  if (statusCode === 403) {
    return "API key invalid or required API not enabled. Check: console.cloud.google.com → APIs & Services → Enable the relevant API (Places, Geocoding, etc.)";
  }
  if (statusCode === 429) {
    return "API quota exceeded. Wait and retry, or check quota at console.cloud.google.com → Quotas";
  }

  // Map Google Maps API status codes
  if (apiStatus === "ZERO_RESULTS") {
    return "No results found. Try broader search terms or a larger radius.";
  }
  if (apiStatus === "OVER_QUERY_LIMIT") {
    return "API quota exceeded. Wait and retry, or upgrade your billing plan.";
  }
  if (apiStatus === "REQUEST_DENIED") {
    return `Request denied by Google Maps API. ${apiError || "Check your API key and enabled APIs."}`;
  }
  if (apiStatus === "INVALID_REQUEST") {
    return `Invalid request parameters. ${apiError || "Check your input values."}`;
  }

  if (apiError) {
    return `${apiError} (HTTP ${statusCode})`;
  }

  return error instanceof Error ? error.message : String(error);
}

export class GoogleMapsTools {
  private client: Client;
  private readonly defaultLanguage: Language = Language.en;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.client = new Client({});
    // Use provided API key, or fall back to environment variable
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is required");
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
          language: this.defaultLanguage,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error(`No location found for address: "${address}"`);
      }

      const result = response.data.results[0];
      const location = result.geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
      };
    } catch (error: any) {
      Logger.error("Error in geocodeAddress:", error);
      throw new Error(`Failed to geocode address "${address}": ${extractErrorMessage(error)}`);
    }
  }

  private parseCoordinates(coordString: string): GeocodeResult {
    const coords = coordString.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      throw new Error(
        `Invalid coordinate format: "${coordString}". Please use "latitude,longitude" format (e.g., "25.033,121.564"`
      );
    }
    return { lat: coords[0], lng: coords[1] };
  }

  async getLocation(center: { value: string; isCoordinates: boolean }): Promise<GeocodeResult> {
    if (center.isCoordinates) {
      return this.parseCoordinates(center.value);
    }
    return this.geocodeAddress(center.value);
  }

  async geocode(address: string): Promise<{
    location: { lat: number; lng: number };
    formatted_address: string;
    place_id: string;
  }> {
    try {
      const result = await this.geocodeAddress(address);
      return {
        location: { lat: result.lat, lng: result.lng },
        formatted_address: result.formatted_address || "",
        place_id: result.place_id || "",
      };
    } catch (error: any) {
      Logger.error("Error in geocode:", error);
      throw new Error(`Failed to geocode address "${address}": ${extractErrorMessage(error)}`);
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    formatted_address: string;
    place_id: string;
    address_components: any[];
  }> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          language: this.defaultLanguage,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error(`No address found for coordinates: (${latitude}, ${longitude})`);
      }

      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components,
      };
    } catch (error: any) {
      Logger.error("Error in reverseGeocode:", error);
      throw new Error(
        `Failed to reverse geocode coordinates (${latitude}, ${longitude}): ${extractErrorMessage(error)}`
      );
    }
  }

  async searchAlongRoute(params: {
    textQuery: string;
    origin: string;
    destination: string;
    mode?: string;
    maxResults?: number;
  }): Promise<{ places: any[]; route: { distance: string; duration: string; polyline: string } }> {
    try {
      // Step 1: Get directions via Routes API to obtain the encoded polyline
      const routesService = new RoutesService(this.apiKey);
      const directions = await routesService.computeRoutes({
        origin: params.origin,
        destination: params.destination,
        mode: params.mode || "walking",
      });

      const polyline = directions.routes[0]?.polyline?.encodedPolyline;
      if (!polyline) {
        throw new Error("Could not get route polyline");
      }

      // Step 2: Call Places searchText REST API with searchAlongRouteParameters
      const maxResults = Math.min(params.maxResults || 5, 20);
      const fieldMask =
        "places.displayName,places.id,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours.openNow";

      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          textQuery: params.textQuery,
          searchAlongRouteParameters: {
            polyline: {
              encodedPolyline: polyline,
            },
          },
          maxResultCount: maxResults,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const places = (data.places || []).map((place: any) => ({
        name: place.displayName?.text || "",
        place_id: place.id || "",
        formatted_address: place.formattedAddress || "",
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        rating: place.rating || 0,
        user_ratings_total: place.userRatingCount || 0,
        open_now: place.currentOpeningHours?.openNow ?? null,
      }));

      return {
        places,
        route: {
          distance: directions.total_distance.text,
          duration: directions.total_duration.text,
          polyline,
        },
      };
    } catch (error: any) {
      Logger.error("Error in searchAlongRoute:", error);
      throw new Error(error.message || "Failed to search along route");
    }
  }

  async getWeather(
    latitude: number,
    longitude: number,
    type: "current" | "forecast_daily" | "forecast_hourly" = "current",
    forecastDays?: number,
    forecastHours?: number
  ): Promise<any> {
    try {
      const baseParams = `key=${this.apiKey}&location.latitude=${latitude}&location.longitude=${longitude}`;
      let url: string;

      switch (type) {
        case "forecast_daily": {
          const days = Math.min(Math.max(forecastDays || 5, 1), 10);
          url = `https://weather.googleapis.com/v1/forecast/days:lookup?${baseParams}&days=${days}`;
          break;
        }
        case "forecast_hourly": {
          const hours = Math.min(Math.max(forecastHours || 24, 1), 240);
          url = `https://weather.googleapis.com/v1/forecast/hours:lookup?${baseParams}&hours=${hours}`;
          break;
        }
        default:
          url = `https://weather.googleapis.com/v1/currentConditions:lookup?${baseParams}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}`;

        if (msg.includes("not supported for this location")) {
          throw new Error(
            `Weather data is not available for this location (${latitude}, ${longitude}). ` +
              "The Google Weather API has limited coverage — China, Japan, South Korea, Cuba, Iran, North Korea, and Syria are unsupported. " +
              "Try a location in North America, Europe, or Oceania."
          );
        }

        throw new Error(msg);
      }

      const data = await response.json();

      if (type === "current") {
        return {
          temperature: data.temperature,
          feelsLike: data.feelsLikeTemperature,
          humidity: data.relativeHumidity,
          wind: data.wind,
          conditions: data.weatherCondition?.description?.text || data.weatherCondition?.type,
          uvIndex: data.uvIndex,
          precipitation: data.precipitation,
          visibility: data.visibility,
          pressure: data.airPressure,
          cloudCover: data.cloudCover,
          isDayTime: data.isDaytime,
        };
      }

      // forecast_daily or forecast_hourly — return as-is with light cleanup
      return data;
    } catch (error: any) {
      Logger.error("Error in getWeather:", error);
      throw new Error(error.message || `Failed to get weather for (${latitude}, ${longitude})`);
    }
  }

  async getAirQuality(
    latitude: number,
    longitude: number,
    includeHealthRecommendations: boolean = true,
    includePollutants: boolean = false
  ): Promise<any> {
    try {
      const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${this.apiKey}`;

      const extraComputations: string[] = [];
      if (includeHealthRecommendations) {
        extraComputations.push("HEALTH_RECOMMENDATIONS");
      }
      if (includePollutants) {
        extraComputations.push("POLLUTANT_CONCENTRATION");
      }

      const body: any = {
        location: { latitude, longitude },
      };
      if (extraComputations.length > 0) {
        body.extraComputations = extraComputations;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();

      // Extract the primary index
      const indexes = data.indexes || [];
      const primaryIndex = indexes[0];

      const result: any = {
        dateTime: data.dateTime,
        regionCode: data.regionCode,
        aqi: primaryIndex?.aqi,
        category: primaryIndex?.category,
        dominantPollutant: primaryIndex?.dominantPollutant,
        color: primaryIndex?.color,
      };

      // Include all available indexes (universal + local)
      if (indexes.length > 1) {
        result.indexes = indexes.map((idx: any) => ({
          code: idx.code,
          displayName: idx.displayName,
          aqi: idx.aqi,
          category: idx.category,
          dominantPollutant: idx.dominantPollutant,
        }));
      }

      // Health recommendations
      if (data.healthRecommendations) {
        result.healthRecommendations = data.healthRecommendations;
      }

      // Pollutants
      if (data.pollutants) {
        result.pollutants = data.pollutants.map((p: any) => ({
          code: p.code,
          displayName: p.displayName,
          concentration: p.concentration,
          additionalInfo: p.additionalInfo,
        }));
      }

      return result;
    } catch (error: any) {
      Logger.error("Error in getAirQuality:", error);
      throw new Error(error.message || `Failed to get air quality for (${latitude}, ${longitude})`);
    }
  }

  async getStaticMap(params: {
    center?: string;
    zoom?: number;
    size?: string;
    maptype?: string;
    markers?: string[];
    path?: string[];
  }): Promise<{ base64: string; size: number; dimensions: string }> {
    try {
      const dimensions = params.size || "600x400";
      const queryParts: string[] = [
        `key=${this.apiKey}`,
        `size=${dimensions}`,
        `maptype=${params.maptype || "roadmap"}`,
      ];

      if (params.center) {
        queryParts.push(`center=${encodeURIComponent(params.center)}`);
      }
      if (params.zoom !== undefined) {
        queryParts.push(`zoom=${params.zoom}`);
      }
      if (params.markers) {
        for (const marker of params.markers) {
          queryParts.push(`markers=${encodeURIComponent(marker)}`);
        }
      }
      if (params.path) {
        for (const p of params.path) {
          queryParts.push(`path=${encodeURIComponent(p)}`);
        }
      }

      const url = `https://maps.googleapis.com/maps/api/staticmap?${queryParts.join("&")}`;

      // Check URL length limit
      if (url.length > 16384) {
        throw new Error(`URL exceeds 16,384 character limit (${url.length}). Reduce markers or path points.`);
      }

      const response = await fetch(url);

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/")) {
          const errorText = await response.text();
          throw new Error(`Static Maps API error: ${errorText}`);
        }
        throw new Error(`Static Maps API returned HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");

      return {
        base64,
        size: buffer.length,
        dimensions,
      };
    } catch (error: any) {
      Logger.error("Error in getStaticMap:", error);
      throw new Error(error.message || "Failed to generate static map");
    }
  }

  async getTimezone(
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<{ timeZoneId: string; timeZoneName: string; utcOffset: number; dstOffset: number; localTime: string }> {
    try {
      const ts = timestamp ? Math.floor(timestamp / 1000) : Math.floor(Date.now() / 1000);

      const response = await this.client.timezone({
        params: {
          location: { lat: latitude, lng: longitude },
          timestamp: ts,
          key: this.apiKey,
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Timezone API returned status: ${result.status}`);
      }

      const totalOffset = (result.rawOffset + result.dstOffset) * 1000;
      const localTime = new Date(ts * 1000 + totalOffset).toISOString().replace("Z", "");

      return {
        timeZoneId: result.timeZoneId,
        timeZoneName: result.timeZoneName,
        utcOffset: result.rawOffset,
        dstOffset: result.dstOffset,
        localTime,
      };
    } catch (error: any) {
      Logger.error("Error in getTimezone:", error);
      throw new Error(`Failed to get timezone for (${latitude}, ${longitude}): ${extractErrorMessage(error)}`);
    }
  }

  async getElevation(
    locations: Array<{ latitude: number; longitude: number }>
  ): Promise<Array<{ elevation: number; location: { lat: number; lng: number } }>> {
    try {
      const formattedLocations = locations.map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
      }));

      const response = await this.client.elevation({
        params: {
          locations: formattedLocations,
          key: this.apiKey,
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Failed to get elevation data with status: ${result.status}`);
      }

      return result.results.map((item: any, index: number) => ({
        elevation: item.elevation,
        location: formattedLocations[index],
      }));
    } catch (error: any) {
      Logger.error("Error in getElevation:", error);
      throw new Error(
        `Failed to get elevation data for ${locations.length} location(s): ${extractErrorMessage(error)}`
      );
    }
  }
}
