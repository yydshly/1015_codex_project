export async function placeOrder(subtotal: number) {
  const response = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ subtotal }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  // Intentional shape drift: provider returns orderId, consumer reads receiptId.
  return { id: data.receiptId, total: data.total };
}
