/**
 * Shop-related tools for the Shopify MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyClient } from "../ShopifyClient/ShopifyClient.js";
import { config } from "../config/index.js";
import { handleError, formatSuccess } from "../utils/errorHandler.js";

// Define input types for better type safety
interface GetCollectionsInput {
  limit?: number;
  name?: string;
}

/**
 * Registers shop-related tools with the MCP server
 * @param server The MCP server instance
 */
export function registerShopTools(server: McpServer): void {
  // Get Collections Tool
  server.tool(
    "get-collections",
    "Get collections with optional filtering",
    {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of collections to return"),
      name: z.string().optional().describe("Filter collections by name"),
    },
    async ({ limit = 10, name }: GetCollectionsInput) => {
      const client = new ShopifyClient();
      try {
        const collections = await client.loadCollections(
          config.accessToken,
          config.shopDomain,
          {
            limit,
            query: name ? `title:${name}` : undefined,
          }
        );
        return formatSuccess(collections);
      } catch (error) {
        return handleError("Failed to retrieve collections", error);
      }
    }
  );
}

// Get Shop Info Tool
// server.tool("get-shop-info", "Get basic shop information", {}, async () => {
//   const client = new ShopifyClient();
//   try {
//     const shop = await client.shop(
//       config.accessToken,
//       config.shopDomain
//     );
//     // TODO: Implement shop info retrieval
//     // This requires implementing the shop info query in the ShopifyClient
//     return formatSuccess({
//       message: "Shop info retrieval not yet implemented",
//       shopDomain: config.shopDomain,
//     });
//   } catch (error) {
//     return handleError("Failed to retrieve shop information", error);
//   }
// });

//   // Get Shop Details Tool
//   server.tool(
//     "get-shop-details",
//     "Get detailed shop information",
//     {},
//     async () => {
//       const client = new ShopifyClient();
//       try {
//         // TODO: Implement shop details retrieval
//         // This requires implementing the shop details query in the ShopifyClient
//         return formatSuccess({
//           message: "Shop details retrieval not yet implemented",
//           shopDomain: config.shopDomain,
//         });
//       } catch (error) {
//         return handleError("Failed to retrieve shop details", error);
//       }
//     }
//   );
// }
