import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ui = fs.readFileSync(path.join(clientRoot, 'ui.html'), 'utf8');
const match = ui.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'ui.html must contain inline client script');

const ids = ['baseUrl', 'token', 'connect', 'refresh', 'scene', 'selection', 'status', 'meta', 'fileInput', 'renderFile', 'close'];
const elements = Object.fromEntries(ids.map(id => [id, {
  id,
  value: '',
  disabled: false,
  textContent: '',
  className: '',
  files: [],
  onclick: null,
  onchange: null,
}]));
elements.baseUrl.value = 'http://localhost:17432';
elements.token.value = '0123456789abcdef0123456789abcdef';

const calls = [];
const posted = [];
const sceneDocument = JSON.stringify({ schemaVersion: '1.0', scene: 'Smoke', unityVersion: '6000.3.0f1', source: 'active-scene', hierarchyObjects: [] });

async function fetchMock(url, options = {}) {
  calls.push({ url, options });
  if (url.endsWith('/health')) return response(200, { status: 'ok', service: 'UniMap', apiVersion: '1' });
  if (url.endsWith('/v1/info')) return response(200, { product: 'UniMap', apiVersion: '1', unityVersion: '6000.3.0f1', project: 'SmokeProject', scene: 'Smoke', snapshotRevision: 7 });
  if (url.endsWith('/v1/scene')) return responseText(200, sceneDocument);
  if (url.endsWith('/v1/selection')) return responseText(200, sceneDocument.replace('active-scene', 'selection'));
  return response(404, { error: 'not found' });
}

function response(status, body) { return responseText(status, JSON.stringify(body)); }
function responseText(status, text) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    async text() { return text; },
  };
}

const context = vm.createContext({
  document: { getElementById(id) { return elements[id]; } },
  parent: { postMessage(message) { posted.push(message); } },
  fetch: fetchMock,
  FileReader: class {},
  console,
});
vm.runInContext(match[1], context, { filename: 'ui.html' });
assert.ok(posted.some(entry => entry.pluginMessage?.type === 'load-connection-settings'));
context.onmessage({ data: { pluginMessage: {
  type: 'connection-settings',
  baseUrl: 'http://localhost:17432',
  token: '0123456789abcdef0123456789abcdef',
} } });
assert.equal(elements.baseUrl.value, 'http://localhost:17432');
assert.equal(elements.token.value, '0123456789abcdef0123456789abcdef');

await elements.connect.onclick();
assert.equal(elements.scene.disabled, false);
assert.equal(elements.selection.disabled, false);
assert.ok(elements.status.textContent.includes('Connected'));
assert.equal(calls[0].url, 'http://localhost:17432/health');
assert.equal(calls[0].options.headers.Authorization, undefined);
assert.equal(calls[1].url, 'http://localhost:17432/v1/info');
assert.equal(calls[1].options.headers.Authorization, 'Bearer 0123456789abcdef0123456789abcdef');
assert.ok(posted.some(entry => entry.pluginMessage?.type === 'save-connection-settings' && entry.pluginMessage.baseUrl === 'http://localhost:17432'));

await elements.scene.onclick();
assert.ok(calls.some(call => call.url.endsWith('/v1/scene')));
assert.ok(posted.some(entry => entry.pluginMessage?.type === 'render-document' && entry.pluginMessage.rawJson === sceneDocument));

console.log('UniMap FigJam localhost client smoke passed.');
