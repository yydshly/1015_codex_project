import express from "express";

const app = express();

export function getOrder(req: any, res: any) {
  return res.json({ orderId: req.params.id, total: 5900, status: "confirmed" });
}

app.get("/api/orders/:id", getOrder);
export default app;
