import { validate } from "../services/customer.ts";
import { checkoutOrder } from "../services/checkout.ts";
import type { OrderInput, SavedOrder } from "../types.ts";

// HTTP route equivalent: POST /orders.
export function submitOrder(input: OrderInput): SavedOrder {
  validate(input.customer);
  return checkoutOrder(input);
}
