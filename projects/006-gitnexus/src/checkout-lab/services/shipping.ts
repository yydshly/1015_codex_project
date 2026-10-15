import type { CartItem, Customer } from "../types.ts";

// All money values are integer cents. Free shipping starts at a 10,000-cent subtotal.
export function calculateShipping(items: CartItem[], region: Customer["region"]): number {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (subtotal >= 10000 && region === "local") return 0;
  const weight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  return (region === "remote" ? 1200 : 500) + Math.max(0, Math.ceil(weight) - 1) * 200;
}
