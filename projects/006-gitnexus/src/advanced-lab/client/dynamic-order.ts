export async function loadDynamicOrder(id: string) {
  const url = "/api/orders/" + id;
  const response = await fetch(url);
  const data = await response.json();
  return data.orderId;
}
