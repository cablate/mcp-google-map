import { ToolConfig } from "./core/BaseMcpServer.js";

// Import tool definitions
import { SearchNearby, SearchNearbyParams } from "./tools/maps/searchNearby.js";
import { PlaceDetails, PlaceDetailsParams } from "./tools/maps/placeDetails.js";
import { Geocode, GeocodeParams } from "./tools/maps/geocode.js";
import { ReverseGeocode, ReverseGeocodeParams } from "./tools/maps/reverseGeocode.js";
import { DistanceMatrix, DistanceMatrixParams } from "./tools/maps/distanceMatrix.js";
import { Directions, DirectionsParams } from "./tools/maps/directions.js";
import { Elevation, ElevationParams } from "./tools/maps/elevation.js";
import { SearchPlaces, SearchPlacesParams } from "./tools/maps/searchPlaces.js";
import { Timezone, TimezoneParams } from "./tools/maps/timezone.js";
import { Weather, WeatherParams } from "./tools/maps/weather.js";
import { ExploreArea, ExploreAreaParams } from "./tools/maps/exploreArea.js";
import { PlanRoute, PlanRouteParams } from "./tools/maps/planRoute.js";
import { ComparePlaces, ComparePlacesParams } from "./tools/maps/comparePlaces.js";

// All Google Maps tools are read-only API queries
const MAPS_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

interface ServerInstanceConfig {
  name: string;
  portEnvVar: string;
  tools: ToolConfig[];
}

const serverConfigs: ServerInstanceConfig[] = [
  {
    name: "MCP-Server",
    portEnvVar: "MCP_SERVER_PORT",
    tools: [
      {
        name: SearchNearby.NAME,
        description: SearchNearby.DESCRIPTION,
        schema: SearchNearby.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: SearchNearbyParams) => SearchNearby.ACTION(params),
      },
      {
        name: PlaceDetails.NAME,
        description: PlaceDetails.DESCRIPTION,
        schema: PlaceDetails.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: PlaceDetailsParams) => PlaceDetails.ACTION(params),
      },
      {
        name: Geocode.NAME,
        description: Geocode.DESCRIPTION,
        schema: Geocode.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: GeocodeParams) => Geocode.ACTION(params),
      },
      {
        name: ReverseGeocode.NAME,
        description: ReverseGeocode.DESCRIPTION,
        schema: ReverseGeocode.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: ReverseGeocodeParams) => ReverseGeocode.ACTION(params),
      },
      {
        name: DistanceMatrix.NAME,
        description: DistanceMatrix.DESCRIPTION,
        schema: DistanceMatrix.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: DistanceMatrixParams) => DistanceMatrix.ACTION(params),
      },
      {
        name: Directions.NAME,
        description: Directions.DESCRIPTION,
        schema: Directions.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: DirectionsParams) => Directions.ACTION(params),
      },
      {
        name: Elevation.NAME,
        description: Elevation.DESCRIPTION,
        schema: Elevation.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: ElevationParams) => Elevation.ACTION(params),
      },
      {
        name: SearchPlaces.NAME,
        description: SearchPlaces.DESCRIPTION,
        schema: SearchPlaces.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: SearchPlacesParams) => SearchPlaces.ACTION(params),
      },
      {
        name: Timezone.NAME,
        description: Timezone.DESCRIPTION,
        schema: Timezone.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: TimezoneParams) => Timezone.ACTION(params),
      },
      {
        name: Weather.NAME,
        description: Weather.DESCRIPTION,
        schema: Weather.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: WeatherParams) => Weather.ACTION(params),
      },
      {
        name: ExploreArea.NAME,
        description: ExploreArea.DESCRIPTION,
        schema: ExploreArea.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: ExploreAreaParams) => ExploreArea.ACTION(params),
      },
      {
        name: PlanRoute.NAME,
        description: PlanRoute.DESCRIPTION,
        schema: PlanRoute.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: PlanRouteParams) => PlanRoute.ACTION(params),
      },
      {
        name: ComparePlaces.NAME,
        description: ComparePlaces.DESCRIPTION,
        schema: ComparePlaces.SCHEMA,
        annotations: MAPS_TOOL_ANNOTATIONS,
        action: (params: ComparePlacesParams) => ComparePlaces.ACTION(params),
      },
    ],
  },
];

export default serverConfigs;
