import {
  ProductVariant,
  ShopifyClientPort,
  ProductNode,
  LoadProductsResponse,
} from "../ShopifyClient/ShopifyClientPort.js";
import { ShopifyClient } from "../ShopifyClient/ShopifyClient.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config/index.js";
import { handleError, formatSuccess } from "../utils/errorHandler.js";

export async function getVariantPrice(
  client: ShopifyClientPort,
  accessToken: string,
  myshopifyDomain: string,
  variant: ProductVariant
): Promise<string> {
  return variant.price;
}

// Extended capabilities
export async function getProductInventoryStatus(
  client: ShopifyClientPort,
  accessToken: string,
  myshopifyDomain: string,
  variant: ProductVariant
): Promise<{
  isAvailable: boolean;
  inventoryPolicy: "CONTINUE" | "DENY";
}> {
  return {
    isAvailable: variant.availableForSale,
    inventoryPolicy: variant.inventoryPolicy,
  };
}

export async function getProductFullDetails(
  client: ShopifyClientPort,
  accessToken: string,
  myshopifyDomain: string,
  productId: string
): Promise<{
  product: {
    id: string;
    title: string;
    description: string;
    variants: ProductVariant[];
    images: Array<{
      src: string;
      alt?: string;
    }>;
  };
}> {
  const response = await client.loadProducts(
    accessToken,
    myshopifyDomain,
    null,
    1
  );

  const product = response.products.find(
    (p: ProductNode) => p.id === productId
  );
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  return {
    product: {
      id: product.id,
      title: product.title,
      description: product.description,
      variants: product.variants.edges.map(
        (e: { node: ProductVariant }) => e.node
      ),
      images: product.images.edges.map(
        (e: { node: { src: string; alt?: string } }) => ({
          src: e.node.src,
          alt: e.node.alt || undefined,
        })
      ),
    },
  };
}

export async function searchProductsByAttributes(
  client: ShopifyClientPort,
  accessToken: string,
  myshopifyDomain: string,
  attributes: {
    title?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    collection?: string;
  }
): Promise<
  Array<{
    id: string;
    title: string;
    price: string;
    availableForSale: boolean;
  }>
> {
  let products: ProductNode[] = [];

  if (attributes.priceRange) {
    const priceResponse = await client.searchProductsByPriceRange(
      accessToken,
      myshopifyDomain,
      {
        minPrice: attributes.priceRange.min,
        maxPrice: attributes.priceRange.max,
      }
    );
    products = priceResponse.products;
  } else if (attributes.collection) {
    const collectionResponse = await client.loadProductsByCollectionId(
      accessToken,
      myshopifyDomain,
      attributes.collection
    );
    products = collectionResponse.products;
  } else {
    const response = await client.loadProducts(
      accessToken,
      myshopifyDomain,
      attributes.title || null
    );
    products = response.products;
  }

  return products.map((product: ProductNode) => ({
    id: product.id,
    title: product.title,
    price: product.variants.edges[0]?.node.price || "0",
    availableForSale: product.variants.edges[0]?.node.availableForSale || false,
  }));
}

// export async function getProductAnalytics(
//   client: ShopifyClientPort,
//   accessToken: string,
//   myshopifyDomain: string,
//   productId: string,
//   timeframe?: {
//     start: Date;
//     end: Date;
//   }
// ): Promise<{
//   views: number;
//   addToCart: number;
//   purchases: number;
//   revenue: number;
//   conversionRate: number;
// }> {
//   // This is a mock implementation since Shopify's Admin API doesn't directly provide analytics
//   // In a real implementation, you would integrate with Shopify Analytics API or a third-party analytics service
//   return {
//     views: 1000,
//     addToCart: 100,
//     purchases: 50,
//     revenue: 2500,
//     conversionRate: 5,
//   };
// }

// export async function bulkUpdateProducts(
//   client: ShopifyClientPort,
//   accessToken: string,
//   myshopifyDomain: string,
//   updates: Array<{
//     id: string;
//     price?: string;
//     compareAtPrice?: string;
//     inventoryQuantity?: number;
//     title?: string;
//     description?: string;
//   }>
// ): Promise<
//   Array<{
//     id: string;
//     success: boolean;
//     error?: string;
//   }>
// > {
//   // This would be implemented using Shopify's Bulk Operations API
//   // For now, returning mock success responses
//   return updates.map((update) => ({
//     id: update.id,
//     success: true,
//   }));
// }

/**
 * Registers product-related tools with the MCP server
 * @param server The MCP server instance
 */
export function registerProductTools(server: McpServer): void {
  // Get Product Details Tool
  server.tool(
    "get-product-details",
    "Get full details of a product including variants and images",
    {
      productId: z.string().describe("ID of the product to retrieve"),
    },
    async ({ productId }: { productId: string }) => {
      const client = new ShopifyClient();
      try {
        const result = await getProductFullDetails(
          client,
          config.accessToken,
          config.shopDomain,
          productId
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError(`Failed to retrieve product ${productId}`, error);
      }
    }
  );

  // Get Product Inventory Status Tool
  server.tool(
    "get-product-inventory",
    "Get inventory status of a product variant",
    {
      variantId: z.string().describe("ID of the variant to check"),
    },
    async ({ variantId }: { variantId: string }) => {
      const client = new ShopifyClient();
      try {
        const response = await client.loadProducts(
          config.accessToken,
          config.shopDomain,
          null
        );

        const variant = response.products
          .flatMap((p: ProductNode) => p.variants.edges)
          .find((e: { node: ProductVariant }) => e.node.id === variantId)?.node;

        if (!variant) {
          throw new Error(`Variant not found: ${variantId}`);
        }

        const result = await getProductInventoryStatus(
          client,
          config.accessToken,
          config.shopDomain,
          variant
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError(
          `Failed to get inventory status for variant ${variantId}`,
          error
        );
      }
    }
  );

  // Search Products Tool
  server.tool(
    "search-products",
    "Search products by various attributes",
    {
      title: z.string().optional().describe("Product title to search for"),
      priceRange: z
        .object({
          min: z.number().describe("Minimum price"),
          max: z.number().describe("Maximum price"),
        })
        .optional()
        .describe("Price range to filter by"),
      collection: z.string().optional().describe("Collection ID to filter by"),
    },
    async ({
      title,
      priceRange,
      collection,
    }: {
      title?: string;
      priceRange?: { min: number; max: number };
      collection?: string;
    }) => {
      const client = new ShopifyClient();
      try {
        const result = await searchProductsByAttributes(
          client,
          config.accessToken,
          config.shopDomain,
          { title, priceRange, collection }
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError("Failed to search products", error);
      }
    }
  );

  // Create Product Tool
  server.tool(
    "create-product",
    "Create a new product",
    {
      title: z.string().describe("Product title"),
      description: z.string().describe("Product description"),
      vendor: z.string().optional().describe("Product vendor"),
      productType: z.string().optional().describe("Product type"),
      tags: z.array(z.string()).optional().describe("Product tags"),
      variants: z
        .array(
          z.object({
            title: z.string().describe("Variant title"),
            price: z.number().describe("Variant price"),
            sku: z.string().optional().describe("Variant SKU"),
            inventory: z.number().describe("Initial inventory quantity"),
            requiresShipping: z
              .boolean()
              .optional()
              .describe("Whether shipping is required"),
            taxable: z
              .boolean()
              .optional()
              .describe("Whether the variant is taxable"),
          })
        )
        .describe("Product variants"),
    },
    async (productData: {
      title: string;
      description: string;
      vendor?: string;
      productType?: string;
      tags?: string[];
      variants: Array<{
        title: string;
        price: number;
        sku?: string;
        inventory: number;
        requiresShipping?: boolean;
        taxable?: boolean;
      }>;
    }) => {
      const client = new ShopifyClient();
      try {
        const result = await client.createProduct(
          config.accessToken,
          config.shopDomain,
          productData
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError("Failed to create product", error);
      }
    }
  );

  // Update Product Tool
  server.tool(
    "update-product",
    "Update an existing product",
    {
      productId: z.string().describe("ID of the product to update"),
      title: z.string().optional().describe("New product title"),
      description: z.string().optional().describe("New product description"),
      status: z
        .enum(["ACTIVE", "ARCHIVED", "DRAFT"])
        .optional()
        .describe("Product status"),
      vendor: z.string().optional().describe("New vendor name"),
      productType: z.string().optional().describe("New product type"),
      tags: z.array(z.string()).optional().describe("New product tags"),
    },
    async ({
      productId,
      ...updateData
    }: {
      productId: string;
      title?: string;
      description?: string;
      status?: "ACTIVE" | "ARCHIVED" | "DRAFT";
      vendor?: string;
      productType?: string;
      tags?: string[];
    }) => {
      const client = new ShopifyClient();
      try {
        const result = await client.updateProduct(
          config.accessToken,
          config.shopDomain,
          productId,
          updateData
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError(`Failed to update product ${productId}`, error);
      }
    }
  );

  // Bulk Update Products Tool
  server.tool(
    "bulk-update-products",
    "Update multiple products at once",
    {
      updates: z
        .array(
          z.object({
            productId: z.string().describe("ID of the product to update"),
            title: z.string().optional().describe("New product title"),
            description: z
              .string()
              .optional()
              .describe("New product description"),
            status: z
              .enum(["ACTIVE", "ARCHIVED", "DRAFT"])
              .optional()
              .describe("Product status"),
            vendor: z.string().optional().describe("New vendor name"),
            productType: z.string().optional().describe("New product type"),
            tags: z.array(z.string()).optional().describe("New product tags"),
          })
        )
        .describe("Array of product updates"),
    },
    async ({
      updates,
    }: {
      updates: Array<{
        productId: string;
        title?: string;
        description?: string;
        status?: "ACTIVE" | "ARCHIVED" | "DRAFT";
        vendor?: string;
        productType?: string;
        tags?: string[];
      }>;
    }) => {
      const client = new ShopifyClient();
      try {
        const result = await client.bulkUpdateProducts(
          config.accessToken,
          config.shopDomain,
          updates
        );
        return formatSuccess(result);
      } catch (error) {
        return handleError("Failed to bulk update products", error);
      }
    }
  );
}
