// Static-analysis examples only. None of these handlers are invoked by this lab.
export function unsafePreview(req: any, res: any) {
  const raw = req.query;
  const html = raw;
  res.send(html);
}

export function safePreview(req: any, res: any) {
  const raw = req.query;
  const html = encodeURIComponent(raw);
  res.send(html);
}

export function sendPreview(res: any, html: string) {
  res.send(html);
}

export function wrappedPreview(req: any, res: any) {
  const raw = req.query;
  sendPreview(res, raw);
}

export function callbackPreview(req: any, res: any) {
  const raw = req.query;
  [raw].forEach(value => res.send(value));
}
