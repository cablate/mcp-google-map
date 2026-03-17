import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";
import { getCurrentApiKey } from "../../utils/requestContext.js";

const NAME = "maps_batch_geocode";
const DESCRIPTION =
  "Geocode multiple addresses in one call — up to 50 addresses, returns coordinates for each. Use when the user provides a list of addresses and needs all their coordinates, e.g. 'geocode these 10 offices' or 'get coordinates for all these restaurants'. For more than 50, use the CLI batch-geocode command instead.";

const SCHEMA = {
  addresses: z.array(z.string()).min(1).max(50).describe("List of addresses or landmark names to geocode (max 50)"),
};

export type BatchGeocodeParams = z.infer<z.ZodObject<typeof SCHEMA>>;

async function ACTION(params: any): Promise<{ content: any[]; isError?: boolean }> {
  try {
    const apiKey = getCurrentApiKey();
    const searcher = new PlacesSearcher(apiKey);
    const addresses: string[] = params.addresses;

    const results = await Promise.all(
      addresses.map(async (address: string) => {
        try {
          const result = await searcher.geocode(address);
          return { address, ...result };
        } catch (error: any) {
          return { address, success: false, error: error.message };
        }
      })
    );

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: addresses.length, succeeded, failed, results }, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error batch geocoding: ${errorMessage}` }],
    };
  }
}

export const BatchGeocode = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};
