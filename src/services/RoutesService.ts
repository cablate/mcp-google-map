import { Logger } from "../index.js";

const ROUTES_API_BASE = "https://routes.googleapis.com";

/** Travel mode mapping: legacy lowercase → Routes API uppercase */
const TRAVEL_MODE_MAP: Record<string, string> = {
  driving: "DRIVE",
  walking: "WALK",
  bicycling: "BICYCLE",
  transit: "TRANSIT",
};

/** FieldMask for computeRoutes */
const COMPUTE_ROUTES_FIELD_MASK = [
  "routes.distanceMeters",
  "routes.duration",
  "routes.description",
  "routes.polyline.encodedPolyline",
  "routes.legs.distanceMeters",
  "routes.legs.duration",
  "routes.legs.startLocation",
  "routes.legs.endLocation",
  "routes.legs.steps.navigationInstruction",
  "routes.legs.steps.distanceMeters",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.startLocation",
  "routes.legs.steps.endLocation",
  "routes.legs.polyline",
  "routes.optimizedIntermediateWaypointIndex",
].join(",");

/** FieldMask for computeRouteMatrix */
const COMPUTE_ROUTE_MATRIX_FIELD_MASK =
  "originIndex,destinationIndex,distanceMeters,duration,status,condition";

/**
 * Parse Routes API duration string ("1234s") to seconds.
 */
export function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/^(\d+)s$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Format meters to human-readable distance.
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/**
 * Format seconds to human-readable duration.
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins > 0
      ? `${hours} hour${hours > 1 ? "s" : ""} ${mins} min${mins > 1 ? "s" : ""}`
      : `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  const mins = Math.round(seconds / 60);
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

/**
 * Convert address/coordinates string to Routes API Waypoint.
 */
function toWaypoint(location: string): any {
  const coordMatch = location.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
  if (coordMatch) {
    return {
      location: {
        latLng: {
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
        },
      },
    };
  }
  return { address: location };
}

/**
 * Routes API REST client.
 *
 * Uses native fetch() to call Google Routes API endpoints.
 * Follows the same pattern as getWeather/getAirQuality/searchAlongRoute.
 */
export class RoutesService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is required");
    }
  }

  /**
   * Compute routes using Routes API.
   * Returns response compatible with existing DirectionsResponse.data interface.
   */
  async computeRoutes(params: {
    origin: string;
    destination: string;
    mode?: string;
    departureTime?: Date;
    arrivalTime?: Date;
    intermediates?: string[];
    optimizeWaypointOrder?: boolean;
  }): Promise<{
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
    arrival_time: string;
    departure_time: string;
    optimizedIntermediateWaypointIndex?: number[];
  }> {
    const travelMode = TRAVEL_MODE_MAP[params.mode || "driving"] || "DRIVE";

    const requestBody: any = {
      origin: toWaypoint(params.origin),
      destination: toWaypoint(params.destination),
      travelMode,
      computeAlternativeRoutes: false,
    };

    // routingPreference only valid for DRIVE mode
    if (travelMode === "DRIVE") {
      requestBody.routingPreference = "TRAFFIC_AWARE";
    }

    // Departure/arrival time (only set if explicitly provided — Routes API rejects past timestamps)
    if (params.arrivalTime) {
      requestBody.arrivalTime = params.arrivalTime.toISOString();
    } else if (params.departureTime) {
      requestBody.departureTime = params.departureTime.toISOString();
    }

    // Intermediates for multi-stop
    if (params.intermediates && params.intermediates.length > 0) {
      requestBody.intermediates = params.intermediates.map(toWaypoint);
    }

    // Waypoint optimization (not supported for TRANSIT)
    if (
      params.optimizeWaypointOrder &&
      params.intermediates &&
      params.intermediates.length > 0 &&
      travelMode !== "TRANSIT"
    ) {
      requestBody.optimizeWaypointOrder = true;
    }

    const response = await fetch(`${ROUTES_API_BASE}/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": COMPUTE_ROUTES_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error(
        `No route found from "${params.origin}" to "${params.destination}" with mode: ${params.mode || "driving"}`
      );
    }

    const route = data.routes[0];
    const totalDistanceMeters = route.distanceMeters || 0;
    const totalDurationSeconds = parseDuration(route.duration);

    return {
      routes: data.routes,
      summary: route.description || "",
      total_distance: {
        value: totalDistanceMeters,
        text: formatDistance(totalDistanceMeters),
      },
      total_duration: {
        value: totalDurationSeconds,
        text: formatDuration(totalDurationSeconds),
      },
      arrival_time: "",
      departure_time: "",
      ...(route.optimizedIntermediateWaypointIndex
        ? { optimizedIntermediateWaypointIndex: route.optimizedIntermediateWaypointIndex }
        : {}),
    };
  }

  /**
   * Compute route matrix using Routes API.
   * Returns response compatible with existing DistanceMatrixResponse.data interface.
   */
  async computeRouteMatrix(params: {
    origins: string[];
    destinations: string[];
    mode?: string;
  }): Promise<{
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  }> {
    const travelMode = TRAVEL_MODE_MAP[params.mode || "driving"] || "DRIVE";

    const requestBody: any = {
      origins: params.origins.map((o) => ({ waypoint: toWaypoint(o) })),
      destinations: params.destinations.map((d) => ({ waypoint: toWaypoint(d) })),
      travelMode,
    };

    // routingPreference only valid for DRIVE mode
    if (travelMode === "DRIVE") {
      requestBody.routingPreference = "TRAFFIC_AWARE";
    }

    const response = await fetch(`${ROUTES_API_BASE}/distanceMatrix/v2:computeRouteMatrix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": COMPUTE_ROUTE_MATRIX_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    const elements: any[] = await response.json();

    // Rebuild 2D matrix from flat array
    const rowCount = params.origins.length;
    const colCount = params.destinations.length;
    const distances: any[][] = Array.from({ length: rowCount }, () => Array(colCount).fill(null));
    const durations: any[][] = Array.from({ length: rowCount }, () => Array(colCount).fill(null));

    for (const element of elements) {
      const i = element.originIndex;
      const j = element.destinationIndex;
      if (i === undefined || j === undefined) continue;
      if (element.condition === "ROUTE_NOT_FOUND") continue;

      const distMeters = element.distanceMeters || 0;
      const durSeconds = parseDuration(element.duration);

      distances[i][j] = {
        value: distMeters,
        text: formatDistance(distMeters),
      };
      durations[i][j] = {
        value: durSeconds,
        text: formatDuration(durSeconds),
      };
    }

    // Routes API doesn't return resolved addresses; use input strings
    return {
      distances,
      durations,
      origin_addresses: params.origins,
      destination_addresses: params.destinations,
    };
  }
}
