import { calculateShipping as shippingCost } from "./shipping.ts";
import { calculateSubtotal } from "./pricing.ts";
import { applyDiscount } from "./discount.ts";
import type { OrderInput, Quote } from "../types.ts";

// Quote calculation shares shipping logic through a named import alias.
export function estimateOrder(input: OrderInput): Quote {
  const subtotal = calculateSubtotal(input.items);
  const discount = applyDiscount(subtotal, input.coupon);
  const shipping = shippingCost(input.items, input.customer.region);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
