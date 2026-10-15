import test from 'node:test';
import assert from 'node:assert/strict';
import { Muxer, ArrayBufferTarget } from '../web/vendor/webm-muxer/webm-muxer.mjs';
import { setWebmDuration } from '../web/assets/webm-duration.mjs';

test('WebM metadata includes the final display interval and retains every existing byte offset', () => {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'V_VP8', width: 1280, height: 720, frameRate: 30 } });
  muxer.addVideoChunkRaw(new Uint8Array([0]), 'key', 0);
  muxer.addVideoChunkRaw(new Uint8Array([0]), 'delta', Math.round((48 - 1 / 30) * 1e6));
  muxer.finalize();
  const before = new Uint8Array(target.buffer.slice(0));
  const result = setWebmDuration(target.buffer, 48), bytes = new Uint8Array(result);
  assert.equal(bytes.length, before.length);
  const changed = [...bytes.keys()].filter(i => bytes[i] !== before[i]);
  assert.ok(changed.length > 0 && changed.length <= 8);
  const marker = bytes.findIndex((b, i) => b === 0x44 && bytes[i + 1] === 0x89 && bytes[i + 2] === 0x88);
  assert.ok(marker > 0);
  assert.equal(new DataView(result).getFloat64(marker + 3), 48000);
  assert.ok(changed.every(i => i >= marker + 3 && i < marker + 11));
});
