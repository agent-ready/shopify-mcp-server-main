/**
 * Error handling utilities for the Shopify MCP Server
 */

import { CustomError } from "../ShopifyClient/ShopifyClientPort.js";

/**
 * Standard error response format for MCP tools
 */
export interface ErrorResponse {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError: boolean;
}

/**
 * Handles errors in a consistent way across all MCP tools
 * @param defaultMessage Default error message if specific error details are not available
 * @param error The error object that was caught
 * @returns Formatted error response for MCP
 */
export function handleError(
  defaultMessage: string,
  error: unknown
): ErrorResponse {
  if (error instanceof CustomError) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
      error: {
        code: error.code,
        contextData: error.contextData,
        innerError: error.innerError,
      },
    };
  }

  if (error instanceof Error) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
      error: error.stack,
    };
  }

  return {
    content: [{ type: "text", text: defaultMessage }],
    isError: true,
    error: String(error),
  };
}

/**
 * Formats a successful response for MCP tools
 * @param data The data to format
 * @returns Formatted success response for MCP
 */
export function formatSuccess(data: any): {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
} {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    data,
  };
}
