import { GoogleMapsTools } from "./toolclass.js";
import { NewPlacesService } from "./NewPlacesService.js";
import { RoutesService, parseDuration, formatDistance, formatDuration } from "./RoutesService.js";

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

interface StaticMapResponse {
  success: boolean;
  error?: string;
  data?: {
    base64: string;
    size: number;
    dimensions: string;
  };
}

interface AirQualityResponse {
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
  private routesService: RoutesService;

  constructor(apiKey?: string) {
    this.mapsTools = new GoogleMapsTools(apiKey);
    this.newPlacesService = new NewPlacesService(apiKey);
    this.routesService = new RoutesService(apiKey);
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
          primary_type: place.primary_type || null,
          price_level: place.price_level || null,
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
          primary_type: place.primary_type || null,
          price_level: place.price_level || null,
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

  async getPlaceDetails(placeId: string, maxPhotos: number = 0): Promise<PlaceDetailsResponse> {
    try {
      const details = await this.newPlacesService.getPlaceDetails(placeId);

      // Resolve photo URLs if requested
      let photos: Array<{ url: string; width: number; height: number }> | undefined;
      if (maxPhotos > 0 && details.photos?.length > 0) {
        const photosToFetch = details.photos.slice(0, maxPhotos);
        photos = [];
        for (const photo of photosToFetch) {
          try {
            const url = await this.newPlacesService.getPhotoUri(photo.photo_reference);
            photos.push({ url, width: photo.width, height: photo.height });
          } catch {
            // Skip failed photos silently
          }
        }
      }

      return {
        success: true,
        data: {
          name: details.name,
          address: details.formatted_address,
          location: details.geometry?.location,
          primary_type: details.primary_type || null,
          types: details.types || [],
          rating: details.rating,
          total_ratings: details.user_ratings_total,
          opening_hours: details.opening_hours,
          phone: details.formatted_phone_number,
          website: details.website,
          price_level: details.price_level,
          editorial_summary: details.editorial_summary || null,
          ...(details.parking ? { parking: details.parking } : {}),
          ...(details.accessibility ? { accessibility: details.accessibility } : {}),
          ...(details.dining_options ? { dining_options: details.dining_options } : {}),
          ...(details.serves ? { serves: details.serves } : {}),
          ...(details.atmosphere ? { atmosphere: details.atmosphere } : {}),
          ...(details.payment_options ? { payment_options: details.payment_options } : {}),
          ...(details.review_summary ? { review_summary: details.review_summary } : {}),
          ...(details.generative_summary ? { generative_summary: details.generative_summary } : {}),
          photo_count: details.photos?.length || 0,
          ...(photos && photos.length > 0 ? { photos } : {}),
          reviews: details.reviews?.map((review: any) => ({
            rating: review.rating,
            text: review.text,
            language: review.language || null,
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
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: string
  ): Promise<DistanceMatrixResponse> {
    try {
      const result = await this.routesService.computeRouteMatrix({
        origins,
        destinations,
        mode,
        ...(departure_time ? { departureTime: new Date(departure_time) } : {}),
      });

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
      const result = await this.routesService.computeRoutes({
        origin,
        destination,
        mode,
        departureTime,
        arrivalTime,
      });

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

  async getAirQuality(
    latitude: number,
    longitude: number,
    includeHealthRecommendations?: boolean,
    includePollutants?: boolean
  ): Promise<AirQualityResponse> {
    try {
      const result = await this.mapsTools.getAirQuality(
        latitude,
        longitude,
        includeHealthRecommendations,
        includePollutants
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while getting air quality",
      };
    }
  }

  async getStaticMap(params: {
    center?: string;
    zoom?: number;
    size?: string;
    maptype?: string;
    markers?: string[];
    path?: string[];
  }): Promise<StaticMapResponse> {
    try {
      const result = await this.mapsTools.getStaticMap(params);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while generating static map",
      };
    }
  }

  async searchAlongRoute(params: {
    textQuery: string;
    origin: string;
    destination: string;
    mode?: string;
    maxResults?: number;
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const result = await this.mapsTools.searchAlongRoute(params);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while searching along route",
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
    departure_time?: string;
  }): Promise<any> {
    const mode = params.mode || "driving";
    const stops = params.stops;
    if (stops.length < 2) throw new Error("Need at least 2 stops");

    // 1. Geocode all stops for display addresses
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

    // 2. Single Routes API call handles optimization + all leg directions
    const origin = stops[0];
    const destination = stops[stops.length - 1];
    const intermediates = stops.length > 2 ? stops.slice(1, -1) : undefined;
    // Optimize if requested, > 2 stops, and not transit (transit doesn't support intermediates for optimization)
    const shouldOptimize = params.optimize !== false && stops.length > 2 && mode !== "transit";

    const routeResult = await this.routesService.computeRoutes({
      origin,
      destination,
      mode,
      intermediates,
      optimizeWaypointOrder: shouldOptimize,
      ...(params.departure_time ? { departureTime: new Date(params.departure_time) } : {}),
    });

    const route = routeResult.routes[0];
    const routeLegs = route?.legs || [];

    // 3. Determine ordered stops based on optimization result
    let orderedStops: typeof geocoded;
    if (shouldOptimize && routeResult.optimizedIntermediateWaypointIndex) {
      const optimizedOrder = routeResult.optimizedIntermediateWaypointIndex;
      const intermediateGeocoded = geocoded.slice(1, -1);
      orderedStops = [
        geocoded[0],
        ...optimizedOrder.map((i: number) => intermediateGeocoded[i]),
        geocoded[geocoded.length - 1],
      ];
    } else {
      orderedStops = geocoded;
    }

    // 4. Build legs from Routes API response
    const legs: any[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < orderedStops.length - 1; i++) {
      const leg = routeLegs[i];
      if (leg) {
        const distMeters = leg.distanceMeters || 0;
        const durSeconds = parseDuration(leg.duration);
        totalDistance += distMeters;
        totalDuration += durSeconds;
        legs.push({
          from: orderedStops[i].originalName,
          to: orderedStops[i + 1].originalName,
          distance: formatDistance(distMeters),
          duration: formatDuration(durSeconds),
        });
      } else {
        legs.push({
          from: orderedStops[i].originalName,
          to: orderedStops[i + 1].originalName,
          distance: "unknown",
          duration: "unknown",
          note: "Directions unavailable for this segment",
        });
      }
    }

    return {
      success: true,
      data: {
        mode,
        optimized: shouldOptimize,
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
        primary_type: details.data?.primary_type || place.primary_type || null,
        rating: place.rating,
        total_ratings: place.total_ratings,
        opening_hours: details.data?.opening_hours,
        phone: details.data?.phone,
        website: details.data?.website,
        price_level: details.data?.price_level,
        ...(details.data?.parking ? { parking: details.data.parking } : {}),
        ...(details.data?.serves ? { serves: details.data.serves } : {}),
        ...(details.data?.atmosphere ? { atmosphere: details.data.atmosphere } : {}),
        ...(details.data?.dining_options ? { dining_options: details.data.dining_options } : {}),
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
