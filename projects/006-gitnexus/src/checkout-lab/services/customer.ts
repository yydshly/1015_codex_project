import type { Customer } from "../types.ts";

// Same symbol name as inventory.validate; the import target should disambiguate it.
export function validate(customer: Customer): void {
  if (!customer.id.trim()) throw new Error("Customer id is required");
}
