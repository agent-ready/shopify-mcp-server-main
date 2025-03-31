// /**
//  * Webhook-related tools for the Shopify MCP Server
//  */

// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// import { z } from "zod";
// import { ShopifyClient } from "../ShopifyClient/ShopifyClient.js";
// import { config } from "../config/index.js";
// import { handleError, formatSuccess } from "../utils/errorHandler.js";

// // Define input types for better type safety
// interface SubscribeWebhookInput {
//   topic: string;
//   callbackUrl: string;
// }

// interface FindWebhookInput {
//   topic: string;
//   callbackUrl: string;
// }

// interface UnsubscribeWebhookInput {
//   webhookId: string;
// }

// /**
//  * Registers webhook-related tools with the MCP server
//  * @param server The MCP server instance
//  */
// export function registerWebhookTools(server: McpServer): void {
//   // Subscribe Webhook Tool
//   server.tool(
//     "subscribe-webhook",
//     "Subscribe to a Shopify webhook",
//     {
//       topic: z.string().describe("Webhook topic to subscribe to"),
//       callbackUrl: z.string().describe("URL to receive webhook notifications"),
//     },
//     async ({ topic, callbackUrl }: SubscribeWebhookInput) => {
//       const client = new ShopifyClient();
//       try {
//         // TODO: Implement webhook subscription
//         // This requires implementing the webhook subscription mutation in the ShopifyClient
//         return formatSuccess({
//           message: "Webhook subscription not yet implemented",
//           topic,
//           callbackUrl,
//         });
//       } catch (error) {
//         return handleError("Failed to subscribe to webhook", error);
//       }
//     }
//   );

//   // Find Webhook Tool
//   server.tool(
//     "find-webhook",
//     "Find a webhook by topic and callback URL",
//     {
//       topic: z.string().describe("Webhook topic to search for"),
//       callbackUrl: z.string().describe("Callback URL to search for"),
//     },
//     async ({ topic, callbackUrl }: FindWebhookInput) => {
//       const client = new ShopifyClient();
//       try {
//         // TODO: Implement webhook search
//         // This requires implementing the webhook search query in the ShopifyClient
//         return formatSuccess({
//           message: "Webhook search not yet implemented",
//           topic,
//           callbackUrl,
//         });
//       } catch (error) {
//         return handleError("Failed to find webhook", error);
//       }
//     }
//   );

//   // Unsubscribe Webhook Tool
//   server.tool(
//     "unsubscribe-webhook",
//     "Unsubscribe from a Shopify webhook",
//     {
//       webhookId: z.string().describe("ID of the webhook to unsubscribe from"),
//     },
//     async ({ webhookId }: UnsubscribeWebhookInput) => {
//       const client = new ShopifyClient();
//       try {
//         // TODO: Implement webhook unsubscription
//         // This requires implementing the webhook deletion mutation in the ShopifyClient
//         return formatSuccess({
//           message: "Webhook unsubscription not yet implemented",
//           webhookId,
//         });
//       } catch (error) {
//         return handleError("Failed to unsubscribe from webhook", error);
//       }
//     }
//   );
// }
