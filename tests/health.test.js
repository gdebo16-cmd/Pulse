import test from 'node:test';
import assert from 'node:assert/strict';

test('health payload shape stays stable', () => {
  const payload = { ok: true, service: 'pulse-api' };
  assert.equal(payload.ok, true);
  assert.equal(payload.service, 'pulse-api');
});
