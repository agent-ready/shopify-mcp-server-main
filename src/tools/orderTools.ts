/**
 * Order-related tools for the Shopify MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyClient } from "../ShopifyClient/ShopifyClient.js";
import { config } from "../config/index.js";
import { handleError, formatSuccess } from "../utils/errorHandler.js";
import { formatOrder } from "../utils/formatters.js";

// Define input types for better type safety
interface GetOrdersInput {
  first?: number;
  after?: string;
  query?: string;
  sortKey?:
    | "PROCESSED_AT"
    | "TOTAL_PRICE"
    | "ID"
    | "CREATED_AT"
    | "UPDATED_AT"
    | "ORDER_NUMBER";
  reverse?: boolean;
}

interface GetOrderInput {
  orderId: string;
}

interface CreateDraftOrderInput {
  lineItems: Array<{
    variantId: string;
    quantity: number;
  }>;
  email: string;
  shippingAddress: {
    address1: string;
    address2?: string;
    countryCode: string;
    firstName: string;
    lastName: string;
    zip: string;
    city: string;
    country: string;
    province?: string;
    provinceCode?: string;
    phone?: string;
  };
  note?: string;
}

interface CompleteDraftOrderInput {
  draftOrderId: string;
  variantId: string;
}

/**
 * Registers order-related tools with the MCP server
 * @param server The MCP server instance
 */
export function registerOrderTools(server: McpServer): void {
  // Get Orders Tool
  server.tool(
    "get-orders",
    "Get orders with advanced filtering and sorting",
    {
      first: z.number().optional().describe("Limit of orders to return"),
      after: z.string().optional().describe("Next page cursor"),
      query: z.string().optional().describe("Filter orders using query syntax"),
      sortKey: z
        .enum([
          "PROCESSED_AT",
          "TOTAL_PRICE",
          "ID",
          "CREATED_AT",
          "UPDATED_AT",
          "ORDER_NUMBER",
        ])
        .optional()
        .describe("Field to sort by"),
      reverse: z.boolean().optional().describe("Reverse sort order"),
    },
    async ({ first, after, query, sortKey, reverse }: GetOrdersInput) => {
      const client = new ShopifyClient();
      try {
        const orders = await client.loadOrders(
          config.accessToken,
          config.shopDomain,
          {
            first,
            after,
            query,
            sortKey,
            reverse,
          }
        );

        return formatSuccess({
          orders: orders.orders.map(formatOrder),
          pageInfo: orders.pageInfo,
        });
      } catch (error) {
        return handleError("Failed to retrieve orders", error);
      }
    }
  );

  // Get Order Tool
  // server.tool(
  //   "get-order",
  //   "Get a single order by ID",
  //   {
  //     orderId: z.string().describe("ID of the order to retrieve"),
  //   },
  //   async ({ orderId }: GetOrderInput) => {
  //     const client = new ShopifyClient();
  //     try {

  //       const order = await client.order(
  //         config.accessToken,
  //         config.shopDomain,
  //         { orderId }
  //       );
  //       // TODO: Implement single order retrieval
  //       // This requires implementing the order retrieval query in the ShopifyClient
  //       return formatSuccess({
  //         message: "Single order retrieval not yet implemented",
  //         orderId,
  //       });
  //     } catch (error) {
  //       return handleError(`Failed to retrieve order ${orderId}`, error);
  //     }
  //   }
  // );

  // Create Draft Order Tool
  server.tool(
    "create-draft-order",
    "Create a draft order",
    {
      lineItems: z
        .array(
          z.object({
            variantId: z.string().describe("ID of the variant"),
            quantity: z.number().describe("Quantity of the variant"),
          })
        )
        .describe("Array of items with variantId and quantity"),
      email: z.string().describe("Customer email"),
      shippingAddress: z
        .object({
          address1: z.string().describe("Address line 1"),
          address2: z.string().optional().describe("Address line 2"),
          countryCode: z.string().describe("Country code (e.g., US, CA)"),
          firstName: z.string().describe("First name"),
          lastName: z.string().describe("Last name"),
          zip: z.string().describe("ZIP/Postal code"),
          city: z.string().describe("City"),
          country: z.string().describe("Country name"),
          province: z.string().optional().describe("Province/State name"),
          provinceCode: z.string().optional().describe("Province/State code"),
          phone: z.string().optional().describe("Phone number"),
        })
        .describe("Shipping address details"),
      note: z.string().optional().describe("Optional note for the order"),
    },
    async ({
      lineItems,
      email,
      shippingAddress,
      note,
    }: CreateDraftOrderInput) => {
      const client = new ShopifyClient();
      try {
        const draftOrder = await client.createDraftOrder(
          config.accessToken,
          config.shopDomain,
          {
            lineItems,
            email,
            shippingAddress,
            billingAddress: shippingAddress, // Use shipping address as billing address
            tags: "",
            note: note || "",
          },
          `draft-order-${Date.now()}` // Generate a unique idempotency key
        );

        return formatSuccess({
          draftOrderId: draftOrder.draftOrderId,
          draftOrderName: draftOrder.draftOrderName,
        });
      } catch (error) {
        return handleError("Failed to create draft order", error);
      }
    }
  );

  // Complete Draft Order Tool
  server.tool(
    "complete-draft-order",
    "Complete a draft order",
    {
      draftOrderId: z.string().describe("ID of the draft order to complete"),
      variantId: z.string().describe("ID of the variant in the draft order"),
    },
    async ({ draftOrderId, variantId }: CompleteDraftOrderInput) => {
      const client = new ShopifyClient();
      try {
        const completedOrder = await client.completeDraftOrder(
          config.accessToken,
          config.shopDomain,
          draftOrderId,
          variantId
        );

        return formatSuccess({
          draftOrderId: completedOrder.draftOrderId,
          draftOrderName: completedOrder.draftOrderName,
          orderId: completedOrder.orderId,
        });
      } catch (error) {
        return handleError(
          `Failed to complete draft order ${draftOrderId}`,
          error
        );
      }
    }
  );
}
