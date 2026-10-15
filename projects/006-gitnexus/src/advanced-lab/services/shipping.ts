export function calculateShipping(subtotal: number, region: string): number {
  if (subtotal < 0) throw new Error("Subtotal cannot be negative");
  let shipping = 500;
  if (subtotal >= 10000) {
    shipping = 0;
  }
  if (region === "remote") {
    shipping = 1200;
  }
  return shipping;
}
