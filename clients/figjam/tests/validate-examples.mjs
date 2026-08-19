import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(clientRoot, '..', '..');
const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'protocol', 'unimap-v1.schema.json'), 'utf8'));
assert.equal(schema.properties.schemaVersion.const, '1.0');

for (const name of ['basic-scene.json', 'nested-scene.json']) {
  const document = JSON.parse(fs.readFileSync(path.join(repoRoot, 'examples', name), 'utf8'));
  assert.equal(document.schemaVersion, '1.0', `${name}: schemaVersion`);
  assert.ok(document.scene, `${name}: scene`);
  assert.ok(document.unityVersion, `${name}: unityVersion`);
  assert.ok(['active-scene', 'selection'].includes(document.source), `${name}: source`);
  validateNodes(document.hierarchyObjects, 0, name);
}

function validateNodes(nodes, depth, label) {
  assert.ok(Array.isArray(nodes), `${label}: hierarchy nodes must be array`);
  for (const node of nodes) {
    assert.equal(node.Depth, depth, `${label}: depth for ${node.Name}`);
    assert.equal(typeof node.Name, 'string');
    assert.equal(typeof node.IsEnabled, 'boolean');
    assert.ok(Array.isArray(node.Components));
    assert.ok(Array.isArray(node.Children));
    for (const component of node.Components) {
      assert.equal(typeof component.Name, 'string');
      assert.equal(typeof component.IsEnabled, 'boolean');
    }
    validateNodes(node.Children, depth + 1, label);
  }
}

console.log('UniMap examples match the v1 structural contract.');
