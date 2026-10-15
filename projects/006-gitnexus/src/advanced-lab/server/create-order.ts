import express from "express";
import { calculateShipping } from "../services/shipping.ts";

const app = express();

export function createOrder(req: any, res: any) {
  const subtotal = Number(req.body.subtotal);
  const total = subtotal + calculateShipping(subtotal, "local");
  return res.json({ orderId: "demo-001", total, status: "confirmed" });
}

app.post("/api/orders", createOrder);
export default app;
