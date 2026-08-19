import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pluginRoot, '..');

function validateNode(node, expectedDepth, label) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error(`${label} must be an object`);
  const keys = Object.keys(node).sort();
  const expected = ['Children', 'Components', 'Depth', 'IsEnabled', 'Name'].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) throw new Error(`${label} has unexpected fields`);
  if (typeof node.Name !== 'string' || !node.Name.trim()) throw new Error(`${label}.Name invalid`);
  if (typeof node.IsEnabled !== 'boolean') throw new Error(`${label}.IsEnabled invalid`);
  if (node.Depth !== expectedDepth) throw new Error(`${label}.Depth invalid`);
  if (!Array.isArray(node.Components) || !Array.isArray(node.Children)) throw new Error(`${label} arrays invalid`);
  for (let i = 0; i < node.Components.length; i++) {
    const component = node.Components[i];
    if (!component || Object.keys(component).sort().join(',') !== 'IsEnabled,Name') throw new Error(`${label}.Components[${i}] invalid`);
    if (typeof component.Name !== 'string' || !component.Name.trim() || typeof component.IsEnabled !== 'boolean') throw new Error(`${label}.Components[${i}] values invalid`);
  }
  node.Children.forEach((child, index) => validateNode(child, expectedDepth + 1, `${label}.Children[${index}]`));
}

for (const file of ['basic-scene.json', 'nested-scene.json']) {
  const doc = JSON.parse(fs.readFileSync(path.join(repoRoot, 'examples', file), 'utf8'));
  if (doc.schemaVersion !== '1.0') throw new Error(`${file}: wrong schemaVersion`);
  if (typeof doc.scene !== 'string' || !doc.scene.trim()) throw new Error(`${file}: scene invalid`);
  if (typeof doc.unityVersion !== 'string' || !doc.unityVersion.trim()) throw new Error(`${file}: unityVersion invalid`);
  if (!['active-scene', 'selection'].includes(doc.source)) throw new Error(`${file}: source invalid`);
  if (!Array.isArray(doc.hierarchyObjects)) throw new Error(`${file}: hierarchyObjects invalid`);
  doc.hierarchyObjects.forEach((node, index) => validateNode(node, 0, `${file}.hierarchyObjects[${index}]`));
}

console.log('UniMap example fixtures passed.');
