import { calculateSubtotal } from "./pricing.ts";
import { applyDiscount } from "./discount.ts";
import { calculateShipping } from "./shipping.ts";
import { reserveStock } from "./inventory.ts";
import { saveOrder } from "../storage/orders.ts";
import type { OrderInput, SavedOrder } from "../types.ts";

export function checkoutOrder(input: OrderInput): SavedOrder {
  const subtotal = calculateSubtotal(input.items);
  const discount = applyDiscount(subtotal, input.coupon);
  const shipping = calculateShipping(input.items, input.customer.region);
  reserveStock(input.items);
  return saveOrder(input.customer.id, {
    subtotal, discount, shipping, total: subtotal - discount + shipping,
  });
}
