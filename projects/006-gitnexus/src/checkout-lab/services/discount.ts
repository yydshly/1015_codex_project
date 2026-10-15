export function applyDiscount(subtotal: number, coupon?: string): number {
  return coupon === "SAVE10" ? Math.floor(subtotal * 0.1) : 0;
}
