export async function loadOrder() {
  const response = await fetch("/api/orders/42");
  const data = await response.json();
  return { id: data.orderId, total: data.total };
}
