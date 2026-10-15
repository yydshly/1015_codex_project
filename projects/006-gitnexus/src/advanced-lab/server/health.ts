import express from "express";

const app = express();

export function healthCheck(_req: any, res: any) {
  return res.json({ ok: true });
}

app.get("/api/health", healthCheck);
export default app;
