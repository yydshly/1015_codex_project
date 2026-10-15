import type { Quote, SavedOrder } from "../types.ts";

// Deliberately deterministic, in-memory example; no database or payment side effect.
export function saveOrder(customerId: string, quote: Quote): SavedOrder {
  return { id: `demo-${customerId}`, customerId, status: "confirmed", ...quote };
}
