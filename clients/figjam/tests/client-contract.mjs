import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(clientRoot, 'manifest.json'), 'utf8'));
const ui = fs.readFileSync(path.join(clientRoot, 'ui.html'), 'utf8');
const expectedDomains = Array.from({ length: 11 }, (_, index) => `http://localhost:${17432 + index}`);

assert.deepEqual(manifest.networkAccess.allowedDomains, expectedDomains);
assert.ok(manifest.networkAccess.reasoning.includes('local UniMap service'));
assert.equal(manifest.documentAccess, 'dynamic-page');
assert.ok(!manifest.networkAccess.allowedDomains.includes('*'));

for (const endpoint of ['/health', '/v1/info', '/v1/scene', '/v1/selection']) {
  assert.ok(ui.includes(endpoint), `UI must reference ${endpoint}`);
}
assert.ok(ui.includes('Authorization'));
assert.ok(ui.includes('Bearer ${token}'));
assert.ok(ui.includes('http://localhost:17432'));
assert.ok(ui.includes('save-connection-settings'));
assert.ok(ui.includes('load-connection-settings'));
assert.ok(!ui.includes('localStorage'));
assert.ok(!ui.includes('WebSocket'));

console.log('UniMap FigJam localhost client contract passed.');
