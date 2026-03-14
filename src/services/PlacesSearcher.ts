import { GoogleMapsTools } from "./toolclass.js";
import { NewPlacesService } from "./NewPlacesService.js";

interface SearchResponse {
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

interface TimezoneResponse {
  success: boolean;
  error?: string;
  data?: {
    timeZoneId: string;
    timeZoneName: string;
    utcOffset: number;
    dstOffset: number;
    localTime: string;
  };
}

interface WeatherResponse {
  success: boolean;
  error?: string;
  data?: any;
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
  private newPlacesService: NewPlacesService;

  constructor(apiKey?: string) {
    this.mapsTools = new GoogleMapsTools(apiKey);
    this.newPlacesService = new NewPlacesService(apiKey);
  }

  async searchNearby(params: {
    center: { value: string; isCoordinates: boolean };
    keyword?: string;
    radius?: number;
    openNow?: boolean;
    minRating?: number;
  }): Promise<SearchResponse> {
    try {
      const location = await this.mapsTools.getLocation(params.center);
      const places = await this.newPlacesService.searchNearby({
        location,
        keyword: params.keyword,
        radius: params.radius,
      });

      let filteredPlaces = places;
      if (params.openNow) {
        filteredPlaces = filteredPlaces.filter((p: any) => p.opening_hours?.open_now === true);
      }
      if (params.minRating) {
        filteredPlaces = filteredPlaces.filter((p: any) => (p.rating || 0) >= (params.minRating || 0));
      }

      return {
        location: location,
        success: true,
        data: filteredPlaces.map((place: any) => ({
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

  async searchText(params: {
    query: string;
    locationBias?: { latitude: number; longitude: number; radius?: number };
    openNow?: boolean;
    minRating?: number;
    includedType?: string;
  }): Promise<SearchResponse> {
    try {
      const places = await this.newPlacesService.searchText({
        textQuery: params.query,
        locationBias: params.locationBias
          ? {
              lat: params.locationBias.latitude,
              lng: params.locationBias.longitude,
              radius: params.locationBias.radius,
            }
          : undefined,
        openNow: params.openNow,
        minRating: params.minRating,
        includedType: params.includedType,
      });

      return {
        success: true,
        data: places.map((place: any) => ({
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
        error: error instanceof Error ? error.message : "An error occurred during text search",
      };
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    try {
      const details = await this.newPlacesService.getPlaceDetails(placeId);

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
          reviews: details.reviews?.map((review: any) => ({
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

  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
  ): Promise<DistanceMatrixResponse> {
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

  async getDirections(
    origin: string,
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: string,
    arrival_time?: string
  ): Promise<DirectionsResponse> {
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

  async getTimezone(latitude: number, longitude: number, timestamp?: number): Promise<TimezoneResponse> {
    try {
      const result = await this.mapsTools.getTimezone(latitude, longitude, timestamp);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting timezone",
      };
    }
  }

  async getWeather(
    latitude: number,
    longitude: number,
    type: "current" | "forecast_daily" | "forecast_hourly" = "current",
    forecastDays?: number,
    forecastHours?: number
  ): Promise<WeatherResponse> {
    try {
      const result = await this.mapsTools.getWeather(latitude, longitude, type, forecastDays, forecastHours);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting weather",
      };
    }
  }

  // --------------- Composite Tools ---------------

  async exploreArea(params: { location: string; types?: string[]; radius?: number; topN?: number }): Promise<any> {
    const types = params.types || ["restaurant", "cafe", "attraction"];
    const radius = params.radius || 1000;
    const topN = params.topN || 3;

    // 1. Geocode
    const geo = await this.geocode(params.location);
    if (!geo.success || !geo.data) throw new Error(geo.error || "Geocode failed");
    const { lat, lng } = geo.data.location;

    // 2. Search each type
    const categories: any[] = [];
    for (const type of types) {
      const search = await this.searchNearby({
        center: { value: `${lat},${lng}`, isCoordinates: true },
        keyword: type,
        radius,
      });
      if (!search.success || !search.data) continue;

      // 3. Get details for top N
      const topPlaces = search.data.slice(0, topN);
      const detailed = [];
      for (const place of topPlaces) {
        if (!place.place_id) continue;
        const details = await this.getPlaceDetails(place.place_id);
        detailed.push({
          name: place.name,
          address: place.address,
          rating: place.rating,
          total_ratings: place.total_ratings,
          open_now: place.open_now,
          phone: details.data?.phone,
          website: details.data?.website,
        });
      }
      categories.push({ type, count: search.data.length, top: detailed });
    }

    return {
      success: true,
      data: {
        location: { address: geo.data.formatted_address, lat, lng },
        radius,
        categories,
      },
    };
  }

  async planRoute(params: {
    stops: string[];
    mode?: "driving" | "walking" | "bicycling" | "transit";
    optimize?: boolean;
  }): Promise<any> {
    const mode = params.mode || "driving";
    const stops = params.stops;
    if (stops.length < 2) throw new Error("Need at least 2 stops");

    // 1. Geocode all stops
    const geocoded: Array<{ originalName: string; address: string; lat: number; lng: number }> = [];
    for (const stop of stops) {
      const geo = await this.geocode(stop);
      if (!geo.success || !geo.data) throw new Error(`Failed to geocode: ${stop}`);
      geocoded.push({
        originalName: stop,
        address: geo.data.formatted_address,
        lat: geo.data.location.lat,
        lng: geo.data.location.lng,
      });
    }

    // 2. If optimize requested and > 2 stops, use distance-matrix + nearest-neighbor
    //    Use driving mode for optimization (transit matrix requires departure_time and often returns null)
    let orderedStops = geocoded;
    if (params.optimize !== false && geocoded.length > 2) {
      const matrix = await this.calculateDistanceMatrix(stops, stops, "driving");
      if (matrix.success && matrix.data) {
        // Nearest-neighbor from first stop
        const visited = new Set<number>([0]);
        const order = [0];
        let current = 0;
        while (visited.size < geocoded.length) {
          let bestIdx = -1;
          let bestDuration = Infinity;
          for (let i = 0; i < geocoded.length; i++) {
            if (visited.has(i)) continue;
            const dur = matrix.data.durations[current]?.[i]?.value ?? Infinity;
            if (dur < bestDuration) {
              bestDuration = dur;
              bestIdx = i;
            }
          }
          if (bestIdx === -1) break;
          visited.add(bestIdx);
          order.push(bestIdx);
          current = bestIdx;
        }
        orderedStops = order.map((i) => geocoded[i]);
      }
    }

    // 3. Get directions between consecutive stops (use original names for reliable results)
    const legs: any[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    for (let i = 0; i < orderedStops.length - 1; i++) {
      const dir = await this.getDirections(orderedStops[i].originalName, orderedStops[i + 1].originalName, mode);
      if (dir.success && dir.data) {
        totalDistance += dir.data.total_distance.value;
        totalDuration += dir.data.total_duration.value;
        legs.push({
          from: orderedStops[i].originalName,
          to: orderedStops[i + 1].originalName,
          distance: dir.data.total_distance.text,
          duration: dir.data.total_duration.text,
        });
      } else {
        legs.push({
          from: orderedStops[i].originalName,
          to: orderedStops[i + 1].originalName,
          distance: "unknown",
          duration: "unknown",
          note: dir.error || "Directions unavailable for this segment",
        });
      }
    }

    return {
      success: true,
      data: {
        mode,
        optimized: params.optimize !== false && geocoded.length > 2,
        stops: orderedStops.map((s) => `${s.originalName} (${s.address})`),
        legs,
        total_distance: `${(totalDistance / 1000).toFixed(1)} km`,
        total_duration: `${Math.round(totalDuration / 60)} min`,
      },
    };
  }

  async comparePlaces(params: {
    query: string;
    userLocation?: { latitude: number; longitude: number };
    limit?: number;
  }): Promise<any> {
    const limit = params.limit || 5;

    // 1. Search
    const search = await this.searchText({ query: params.query });
    if (!search.success || !search.data) throw new Error(search.error || "Search failed");

    const places = search.data.slice(0, limit);

    // 2. Get details for each
    const compared: any[] = [];
    for (const place of places) {
      const details = await this.getPlaceDetails(place.place_id);
      compared.push({
        name: place.name,
        address: place.address,
        rating: place.rating,
        total_ratings: place.total_ratings,
        open_now: place.open_now,
        phone: details.data?.phone,
        website: details.data?.website,
        price_level: details.data?.price_level,
      });
    }

    // 3. Distance from user location (if provided)
    if (params.userLocation && compared.length > 0) {
      const origin = `${params.userLocation.latitude},${params.userLocation.longitude}`;
      const destinations = places.map((p: any) => `${p.location.lat},${p.location.lng}`);
      const matrix = await this.calculateDistanceMatrix([origin], destinations, "driving");
      if (matrix.success && matrix.data) {
        for (let i = 0; i < compared.length; i++) {
          compared[i].distance = matrix.data.distances[0]?.[i]?.text;
          compared[i].drive_time = matrix.data.durations[0]?.[i]?.text;
        }
      }
    }

    return { success: true, data: compared };
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
