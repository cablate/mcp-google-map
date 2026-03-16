import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_static_map";
const DESCRIPTION =
  "Generate a map image with markers, paths, or routes — returned as an inline image the user can see directly in chat. PROACTIVELY call this tool after explore_area, plan_route, search_nearby, or directions to visualize results on a map — don't wait for the user to ask. Use markers from search results and path from route data. Supports roadmap, satellite, terrain, and hybrid views. Max 640x640 pixels.";

const SCHEMA = {
  center: z
    .string()
    .optional()
    .describe('Map center — "lat,lng" or address. Optional if markers or path are provided.'),
  zoom: z.number().optional().describe("Zoom level 0-21 (0 = world, 15 = streets, 21 = buildings). Default: auto-fit."),
  size: z.string().optional().describe('Image size "WxH" in pixels. Default: "600x400". Max: "640x640".'),
  maptype: z
    .enum(["roadmap", "satellite", "terrain", "hybrid"])
    .optional()
    .describe("Map style. Default: roadmap."),
  markers: z
    .array(z.string())
    .optional()
    .describe(
      'Marker descriptors. Each string: "color:red|label:A|lat,lng" or "color:blue|address". Multiple markers per string separated by |.'
    ),
  path: z
    .array(z.string())
    .optional()
    .describe(
      'Path descriptors. Each string: "color:0x0000ff|weight:3|lat1,lng1|lat2,lng2|..." to draw lines/routes on the map.'
    ),
};

export type StaticMapParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const placesSearcher = new PlacesSearcher(apiKey);
    const result = await placesSearcher.getStaticMap(params);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to generate static map" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "image",
          data: result.data!.base64,
          mimeType: "image/png",
        },
        {
          type: "text",
          text: `Map generated (${result.data!.size} bytes, ${result.data!.dimensions})`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error generating static map: ${errorMessage}` }],
    };
  }
}

export const StaticMap = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
