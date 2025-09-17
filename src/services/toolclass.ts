import { Client, Language, TravelMode } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import { Logger } from "../index.js";

dotenv.config();

interface SearchParams {
  location: { lat: number; lng: number };
  radius?: number;
  keyword?: string;
  openNow?: boolean;
  minRating?: number;
}

interface PlaceResult {
  name: string;
  place_id: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  place_id?: string;
}

/**
 * Extracts a meaningful error message from various error types
 * Prioritizes Google Maps API error messages when available
 */
function extractErrorMessage(error: any): string {
  // Extract Google API error message if available
  const apiError = error?.response?.data?.error_message;
  const statusCode = error?.response?.status;

  if (apiError) {
    return `${apiError} (HTTP ${statusCode})`;
  }

  // Fallback to standard error message
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

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    const searchParams = {
      location: params.location,
      radius: params.radius || 1000,
      keyword: params.keyword,
      opennow: params.openNow,
      language: this.defaultLanguage,
      key: this.apiKey,
    };

    try {
      const response = await this.client.placesNearby({
        params: searchParams,
      });

      let results = response.data.results;

      if (params.minRating) {
        results = results.filter((place) => (place.rating || 0) >= (params.minRating || 0));
      }

      return results as PlaceResult[];
    } catch (error: any) {
      Logger.error("Error in searchNearbyPlaces:", error);
      throw new Error(`Failed to search nearby places: ${extractErrorMessage(error)}`);
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ["name", "rating", "formatted_address", "opening_hours", "reviews", "geometry", "formatted_phone_number", "website", "price_level", "photos"],
          language: this.defaultLanguage,
          key: this.apiKey,
        },
      });
      return response.data.result;
    } catch (error: any) {
      Logger.error("Error in getPlaceDetails:", error);
      throw new Error(`Failed to get place details for ${placeId}: ${extractErrorMessage(error)}`);
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
      throw new Error(`Invalid coordinate format: "${coordString}". Please use "latitude,longitude" format (e.g., "25.033,121.564"`);
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
      throw new Error(`Failed to reverse geocode coordinates (${latitude}, ${longitude}): ${extractErrorMessage(error)}`);
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
        throw new Error(`Failed to get directions with status: ${result.status} (arrival_time: ${apiArrivalTime}, departure_time: ${apiDepartureTime}`);
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

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<Array<{ elevation: number; location: { lat: number; lng: number } }>> {
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
      throw new Error(`Failed to get elevation data for ${locations.length} location(s): ${extractErrorMessage(error)}`);
    }
  }
}
