import type { CartItem } from "../types.ts";

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
