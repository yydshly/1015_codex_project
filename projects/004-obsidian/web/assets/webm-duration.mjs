// webm-muxer 5.1.4 writes the last frame timestamp as Duration. Include that
// frame's display duration without moving any EBML offsets or changing vendor code.
export function setWebmDuration(buffer, seconds) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  const vint = (at, id = false) => {
    let length = 1, mask = 128;
    while (length <= 8 && !(bytes[at] & mask)) { length++; mask >>= 1; }
    if (length > 8 || at + length > bytes.length) throw new Error('Invalid EBML integer');
    let value = id ? bytes[at] : bytes[at] & (mask - 1);
    for (let i = 1; i < length; i++) value = value * 256 + bytes[at + i];
    return { value, length };
  };
  const elements = (start, end) => {
    const result = [];
    for (let at = start; at < end;) {
      const id = vint(at, true), size = vint(at + id.length), data = at + id.length + size.length;
      if (data + size.value > end) throw new Error('Invalid EBML element size');
      result.push({ id: id.value, data, size: size.value }); at = data + size.value;
    }
    return result;
  };
  const segment = elements(0, bytes.length).find(e => e.id === 0x18538067);
  const info = segment && elements(segment.data, segment.data + segment.size).find(e => e.id === 0x1549a966);
  if (!info) throw new Error('WebM segment information missing');
  const fields = elements(info.data, info.data + info.size), duration = fields.find(e => e.id === 0x4489);
  const scale = fields.find(e => e.id === 0x2ad7b1);
  let unit = 1e6;
  if (scale) { unit = 0; for (let i = 0; i < scale.size; i++) unit = unit * 256 + bytes[scale.data + i]; }
  if (!duration || duration.size !== 8 || !Number.isFinite(seconds) || seconds <= 0) throw new Error('Invalid WebM duration');
  view.setFloat64(duration.data, seconds * 1e9 / unit, false);
  return buffer;
}
