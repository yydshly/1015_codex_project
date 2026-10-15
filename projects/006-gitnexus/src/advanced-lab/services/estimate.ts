import { calculateShipping as shippingCost } from "./shipping.ts";

export function estimateOrder(subtotal: number): number {
  return subtotal + shippingCost(subtotal, "local");
}
