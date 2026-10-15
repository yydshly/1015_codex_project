import assert from "node:assert/strict";
import { submitOrder } from "./routes/order.ts";
import { estimateOrder } from "./services/estimate.ts";
import type { OrderInput } from "./types.ts";

const input: OrderInput = {
  customer: { id: "buyer-01", region: "local" },
  items: [{ sku: "BOOK", quantity: 2, unitPrice: 3000, weight: 0.5 }],
  coupon: "SAVE10",
};
const cases = [
  { name: "local-discount", input, expected: 5900 },
  { name: "remote-shipping", input: { ...input, customer: { id: "buyer-02", region: "remote" as const } }, expected: 6600 },
  { name: "free-shipping", input: { ...input, items: [{ sku: "DESK", quantity: 1, unitPrice: 12000, weight: 3 }] }, expected: 10800 },
];
const results = cases.map(test => {
  const quote = estimateOrder(test.input);
  const order = submitOrder(test.input);
  assert.equal(order.total, test.expected);
  assert.equal(quote.total, order.total);
  return { name: test.name, passed: true, total: order.total, quoteMatchesCheckout: true };
});
assert.throws(() => submitOrder({ ...input, customer: { id: "", region: "local" } }), /Customer/);
assert.throws(() => submitOrder({ ...input, items: [] }), /positive quantities/);
console.log(JSON.stringify({ status: "passed", cases: results, invalidCustomerRejected: true, emptyCartRejected: true }, null, 2));
