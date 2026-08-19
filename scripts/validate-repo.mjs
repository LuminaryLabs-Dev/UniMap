import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

const required = [
  'README.md',
  'AGENTS.md',
  'CHANGELOG.md',
  'protocol/openapi.yaml',
  'protocol/unimap-v1.schema.json',
  'unity-package/package.json',
  'unity-package/Editor/Host/UniMapHost.cs',
  'unity-package/Editor/Host/UniMapRouter.cs',
  'unity-package/Editor/Snapshots/UniMapSnapshotService.cs',
  'unity-package/Editor/Protocol/unimap-v1.schema.json',
  'clients/figjam/manifest.json',
  'clients/figjam/src/code.ts',
  'clients/figjam/dist/code.js',
  'clients/figjam/ui.html',
];
for (const rel of required) assert.ok(exists(rel), `missing ${rel}`);

assert.ok(!exists('figjam-plugin'), 'legacy figjam-plugin/ directory must be removed');
assert.ok(!exists('schema'), 'legacy schema/ directory must be removed');

const unityPackage = JSON.parse(read('unity-package/package.json'));
assert.equal(unityPackage.name, 'com.luminarylabs.unimap');
assert.equal(unityPackage.version, '0.2.0');
assert.equal(unityPackage.unity, '6000.0');

const canonicalSchema = read('protocol/unimap-v1.schema.json');
const packageSchema = read('unity-package/Editor/Protocol/unimap-v1.schema.json');
assert.equal(packageSchema, canonicalSchema, 'Unity package schema copy must exactly match canonical protocol schema');
const schema = JSON.parse(canonicalSchema);
assert.equal(schema.properties.schemaVersion.const, '1.0');

const manifest = JSON.parse(read('clients/figjam/manifest.json'));
const expectedDomains = Array.from({ length: 11 }, (_, index) => `http://localhost:${17432 + index}`);
assert.deepEqual(manifest.networkAccess.allowedDomains, expectedDomains);
assert.equal(manifest.documentAccess, 'dynamic-page');
assert.ok(manifest.networkAccess.reasoning.length > 20);
assert.ok(!manifest.networkAccess.allowedDomains.includes('*'));

const openapi = read('protocol/openapi.yaml');
for (const endpoint of ['/health:', '/v1/info:', '/v1/scene:', '/v1/selection:', '/v1/schema:']) {
  assert.ok(openapi.includes(endpoint), `OpenAPI missing ${endpoint}`);
}
assert.ok(openapi.includes('bearerAuth'));

const host = read('unity-package/Editor/Host/UniMapHost.cs');
assert.ok(host.includes('IPAddress.Loopback'), 'host must bind loopback');
assert.ok(read('unity-package/Editor/Protocol/UniMapProtocol.cs').includes('LoopbackHost = "localhost"'));
assert.ok(!host.includes('IPAddress.Any'), 'host must not bind all interfaces');
assert.ok(!host.includes('0.0.0.0'), 'host must not bind 0.0.0.0');
assert.ok(host.includes('Access-Control-Allow-Origin: *'));
assert.ok(host.includes('Access-Control-Allow-Methods: GET, OPTIONS'));
assert.ok(host.includes('Access-Control-Allow-Private-Network: true'));
for (const forbiddenUnityCall of ['SceneManager.', 'Selection.', 'GetRootGameObjects', 'GetComponents<', 'Transform ']) {
  assert.ok(!host.includes(forbiddenUnityCall), `HTTP thread source must not traverse Unity objects: ${forbiddenUnityCall}`);
}

const router = read('unity-package/Editor/Host/UniMapRouter.cs');
assert.ok(router.includes('"GET"'));
assert.ok(router.includes('"OPTIONS"'));
for (const route of ['/health', '/v1/info', '/v1/scene', '/v1/selection', '/v1/schema']) {
  assert.ok(router.includes(route), `router missing ${route}`);
}
for (const writeVerb of ['"POST"', '"PUT"', '"PATCH"', '"DELETE"']) {
  assert.ok(!router.includes(writeVerb), `router must not define ${writeVerb}`);
}

const snapshotService = read('unity-package/Editor/Snapshots/UniMapSnapshotService.cs');
assert.ok(snapshotService.includes('EditorApplication.hierarchyChanged'));
assert.ok(snapshotService.includes('Selection.selectionChanged'));
assert.ok(snapshotService.includes('DebounceSeconds = 0.2d'));

const ui = read('clients/figjam/ui.html');
for (const endpoint of ['/health', '/v1/info', '/v1/scene', '/v1/selection']) assert.ok(ui.includes(endpoint));
assert.ok(ui.includes('Authorization'));
assert.ok(ui.includes('Bearer ${token}'));
assert.ok(ui.includes('load-connection-settings'));
assert.ok(ui.includes('save-connection-settings'));
assert.ok(!ui.includes('localStorage'));
assert.ok(ui.includes('http://localhost:17432'));
assert.ok(!ui.includes('WebSocket'));

for (const exampleName of ['basic-scene.json', 'nested-scene.json']) {
  const example = JSON.parse(read(`examples/${exampleName}`));
  assert.equal(example.schemaVersion, '1.0');
}

for (const rel of walk(path.join(root, 'unity-package')).filter(file => file.endsWith('.cs'))) {
  assertBalancedBraces(fs.readFileSync(rel, 'utf8'), path.relative(root, rel));
}

console.log('UniMap repository contract validation passed.');

function walk(directory) {
  const out = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function assertBalancedBraces(source, label) {
  let depth = 0;
  let inString = false;
  let verbatim = false;
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (!inString && ch === '/' && next === '/') {
      const end = source.indexOf('\n', i + 2);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (!inString && ch === '"') {
      inString = true;
      verbatim = i > 0 && source[i - 1] === '@';
      escaped = false;
      continue;
    }
    if (inString) {
      if (verbatim) {
        if (ch === '"' && next === '"') { i++; continue; }
        if (ch === '"') inString = false;
      } else if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    assert.ok(depth >= 0, `${label}: closing brace without opener`);
  }
  assert.equal(depth, 0, `${label}: unbalanced braces`);
}
