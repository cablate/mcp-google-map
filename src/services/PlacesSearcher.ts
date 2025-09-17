import { GoogleMapsTools } from "./toolclass.js";

interface SearchNearbyResponse {
  success: boolean;
  error?: string;
  data?: any[];
  location?: any;
}

interface PlaceDetailsResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface GeocodeResponse {
  success: boolean;
  error?: string;
  data?: {
    location: { lat: number; lng: number };
    formatted_address: string;
    place_id: string;
  };
}

interface ReverseGeocodeResponse {
  success: boolean;
  error?: string;
  data?: {
    formatted_address: string;
    place_id: string;
    address_components: any[];
  };
}

interface DistanceMatrixResponse {
  success: boolean;
  error?: string;
  data?: {
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  };
}

interface DirectionsResponse {
  success: boolean;
  error?: string;
  data?: {
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
  };
}

interface ElevationResponse {
  success: boolean;
  error?: string;
  data?: Array<{
    elevation: number;
    location: { lat: number; lng: number };
  }>;
}

export class PlacesSearcher {
  private mapsTools: GoogleMapsTools;

  constructor(apiKey?: string) {
    this.mapsTools = new GoogleMapsTools(apiKey);
  }

  async searchNearby(params: { center: { value: string; isCoordinates: boolean }; keyword?: string; radius?: number; openNow?: boolean; minRating?: number }): Promise<SearchNearbyResponse> {
    try {
      const location = await this.mapsTools.getLocation(params.center);
      const places = await this.mapsTools.searchNearbyPlaces({
        location,
        keyword: params.keyword,
        radius: params.radius,
        openNow: params.openNow,
        minRating: params.minRating,
      });

      return {
        location: location,
        success: true,
        data: places.map((place) => ({
          name: place.name,
          place_id: place.place_id,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          total_ratings: place.user_ratings_total,
          open_now: place.opening_hours?.open_now,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during search",
      };
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    try {
      const details = await this.mapsTools.getPlaceDetails(placeId);

      return {
        success: true,
        data: {
          name: details.name,
          address: details.formatted_address,
          location: details.geometry?.location,
          rating: details.rating,
          total_ratings: details.user_ratings_total,
          open_now: details.opening_hours?.open_now,
          phone: details.formatted_phone_number,
          website: details.website,
          price_level: details.price_level,
          reviews: details.reviews?.map((review) => ({
            rating: review.rating,
            text: review.text,
            time: review.time,
            author_name: review.author_name,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting place details",
      };
    }
  }

  async geocode(address: string): Promise<GeocodeResponse> {
    try {
      const result = await this.mapsTools.geocode(address);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while geocoding address",
      };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResponse> {
    try {
      const result = await this.mapsTools.reverseGeocode(latitude, longitude);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during reverse geocoding",
      };
    }
  }

  async calculateDistanceMatrix(origins: string[], destinations: string[], mode: "driving" | "walking" | "bicycling" | "transit" = "driving"): Promise<DistanceMatrixResponse> {
    try {
      const result = await this.mapsTools.calculateDistanceMatrix(origins, destinations, mode);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while calculating distance matrix",
      };
    }
  }

  async getDirections(origin: string, destination: string, mode: "driving" | "walking" | "bicycling" | "transit" = "driving", departure_time?: string, arrival_time?: string): Promise<DirectionsResponse> {
    try {
      const departureTime = departure_time ? new Date(departure_time) : new Date();
      const arrivalTime = arrival_time ? new Date(arrival_time) : undefined;
      const result = await this.mapsTools.getDirections(origin, destination, mode, departureTime, arrivalTime);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting directions",
      };
    }
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<ElevationResponse> {
    try {
      const result = await this.mapsTools.getElevation(locations);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting elevation data",
      };
    }
  }
}
