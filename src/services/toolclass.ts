import { Client, Language, TravelMode } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import { Logger } from "../index.js";

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

  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
  ): Promise<{
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  }> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: origins,
          destinations: destinations,
          mode: mode as TravelMode,
          language: this.defaultLanguage,
          key: this.apiKey,
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Distance matrix calculation failed with status: ${result.status}`);
      }

      const distances: any[][] = [];
      const durations: any[][] = [];

      result.rows.forEach((row: any) => {
        const distanceRow: any[] = [];
        const durationRow: any[] = [];

        row.elements.forEach((element: any) => {
          if (element.status === "OK") {
            distanceRow.push({
              value: element.distance.value,
              text: element.distance.text,
            });
            durationRow.push({
              value: element.duration.value,
              text: element.duration.text,
            });
          } else {
            distanceRow.push(null);
            durationRow.push(null);
          }
        });

        distances.push(distanceRow);
        durations.push(durationRow);
      });

      return {
        distances: distances,
        durations: durations,
        origin_addresses: result.origin_addresses,
        destination_addresses: result.destination_addresses,
      };
    } catch (error: any) {
      Logger.error("Error in calculateDistanceMatrix:", error);
      throw new Error(`Failed to calculate distance matrix: ${extractErrorMessage(error)}`);
    }
  }

  async getDirections(
    origin: string,
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: Date,
    arrival_time?: Date
  ): Promise<{
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
    arrival_time: string;
    departure_time: string;
  }> {
    try {
      let apiArrivalTime: number | undefined = undefined;
      if (arrival_time) {
        apiArrivalTime = Math.floor(arrival_time.getTime() / 1000);
      }

      let apiDepartureTime: number | "now" | undefined = undefined;
      if (!apiArrivalTime) {
        if (departure_time instanceof Date) {
          apiDepartureTime = Math.floor(departure_time.getTime() / 1000);
        } else if (departure_time) {
          apiDepartureTime = departure_time as unknown as "now";
        } else {
          apiDepartureTime = "now";
        }
      }

      const response = await this.client.directions({
        params: {
          origin: origin,
          destination: destination,
          mode: mode as TravelMode,
          language: this.defaultLanguage,
          key: this.apiKey,
          arrival_time: apiArrivalTime,
          departure_time: apiDepartureTime,
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(
          `Failed to get directions with status: ${result.status} (arrival_time: ${apiArrivalTime}, departure_time: ${apiDepartureTime}`
        );
      }

      if (result.routes.length === 0) {
        throw new Error(`No route found from "${origin}" to "${destination}" with mode: ${mode}`);
      }

      const route = result.routes[0];
      const legs = route.legs[0];

      const formatTime = (timeInfo: any) => {
        if (!timeInfo || typeof timeInfo.value !== "number") return "";
        const date = new Date(timeInfo.value * 1000);
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        };
        if (timeInfo.time_zone && typeof timeInfo.time_zone === "string") {
          options.timeZone = timeInfo.time_zone;
        }
        return date.toLocaleString(this.defaultLanguage.toString(), options);
      };

      return {
        routes: result.routes,
        summary: route.summary,
        total_distance: {
          value: legs.distance.value,
          text: legs.distance.text,
        },
        total_duration: {
          value: legs.duration.value,
          text: legs.duration.text,
        },
        arrival_time: formatTime(legs.arrival_time),
        departure_time: formatTime(legs.departure_time),
      };
    } catch (error: any) {
      Logger.error("Error in getDirections:", error);
      throw new Error(`Failed to get directions from "${origin}" to "${destination}": ${extractErrorMessage(error)}`);
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
