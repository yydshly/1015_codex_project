import type { CartItem } from "../types.ts";

// Same symbol name as customer.validate, with different callers.
export function validate(items: CartItem[]): void {
  if (!items.length || items.some(item => item.quantity < 1)) {
    throw new Error("Cart must contain positive quantities");
  }
}

export function reserveStock(items: CartItem[]): number {
  validate(items);
  return items.reduce((quantity, item) => quantity + item.quantity, 0);
}
