import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md',
  'AGENTS.md',
  'CHANGELOG.md',
  'unity-package/package.json',
  'unity-package/Editor/LuminaryLabs.UniMap.Editor.asmdef',
  'unity-package/Editor/UniMapHierarchyScanner.cs',
  'unity-package/Editor/UniMapSerializer.cs',
  'unity-package/Editor/UniMapExporter.cs',
  'unity-package/Editor/UniMapWindow.cs',
  'unity-package/Tests/Editor/UniMapTests.cs',
  'figjam-plugin/manifest.json',
  'figjam-plugin/package.json',
  'figjam-plugin/package-lock.json',
  'figjam-plugin/src/code.ts',
  'figjam-plugin/dist/code.js',
  'schema/unimap-v1.schema.json',
  'examples/basic-scene.json',
  'examples/nested-scene.json'
];

for (const relative of required) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${relative}`);
}

const jsonFiles = [
  'unity-package/package.json',
  'unity-package/Editor/LuminaryLabs.UniMap.Editor.asmdef',
  'unity-package/Tests/Editor/LuminaryLabs.UniMap.Editor.Tests.asmdef',
  'figjam-plugin/manifest.json',
  'figjam-plugin/package.json',
  'figjam-plugin/package-lock.json',
  'figjam-plugin/tsconfig.json',
  'schema/unimap-v1.schema.json',
  'examples/basic-scene.json',
  'examples/nested-scene.json'
];
for (const relative of jsonFiles) JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

const unityPackage = JSON.parse(fs.readFileSync(path.join(root, 'unity-package/package.json'), 'utf8'));
if (unityPackage.name !== 'com.luminarylabs.unimap') throw new Error('Unexpected Unity package name');
if (unityPackage.unity !== '6000.0') throw new Error('Unity compatibility floor must remain 6000.0 for v0.1');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'figjam-plugin/manifest.json'), 'utf8'));
if (manifest.name !== 'UniMap') throw new Error('FigJam plugin must be named UniMap');
if (manifest.main !== 'dist/code.js') throw new Error('FigJam manifest must execute generated dist/code.js');
if (JSON.stringify(manifest.editorType) !== JSON.stringify(['figjam'])) throw new Error('UniMap must remain FigJam-only in v0.1');
if (JSON.stringify(manifest.networkAccess?.allowedDomains) !== JSON.stringify(['none'])) throw new Error('UniMap v0.1 must remain offline-only');

const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'figjam-plugin/tsconfig.json'), 'utf8'));
const expectedTypeRoots = ['./node_modules/@types', './node_modules/@figma'];
if (JSON.stringify(tsconfig.compilerOptions?.typeRoots) !== JSON.stringify(expectedTypeRoots)) {
  throw new Error("FigJam tsconfig must use Figma's documented typeRoots layout");
}

const figjamSource = fs.readFileSync(path.join(root, 'figjam-plugin/src/code.ts'), 'utf8');
if (figjamSource.includes('declare const __html__')) throw new Error('Use the __html__ global from official Figma typings; do not redeclare it in source');
if (figjamSource.includes('.rescale(')) throw new Error('Do not use StickyNode.rescale; current FigJam typings do not support it');
if (figjamSource.includes('alert(')) throw new Error('Debug alert() calls must not return to the maintained plugin');
const unityWindow = fs.readFileSync(path.join(root, 'unity-package/Editor/UniMapWindow.cs'), 'utf8');
if (unityWindow.includes('validate = true') || unityWindow.includes('priority =')) throw new Error('Unity MenuItem attributes must use compile-safe positional arguments');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'figjam-plugin/package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'figjam-plugin/package-lock.json'), 'utf8'));
for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
  const entry = lock.packages?.[`node_modules/${name}`];
  if (!entry || entry.version !== version) throw new Error(`Lock mismatch for ${name}: expected ${version}`);
}

const schema = JSON.parse(fs.readFileSync(path.join(root, 'schema/unimap-v1.schema.json'), 'utf8'));
if (schema.properties?.schemaVersion?.const !== '1.0') throw new Error('Schema version must be 1.0');

function validateNode(node, expectedDepth, pathLabel) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error(`${pathLabel} must be an object`);
  if (typeof node.Name !== 'string' || !node.Name.trim()) throw new Error(`${pathLabel}.Name invalid`);
  if (typeof node.IsEnabled !== 'boolean') throw new Error(`${pathLabel}.IsEnabled invalid`);
  if (node.Depth !== expectedDepth) throw new Error(`${pathLabel}.Depth expected ${expectedDepth}, got ${node.Depth}`);
  if (!Array.isArray(node.Components) || !Array.isArray(node.Children)) throw new Error(`${pathLabel} arrays missing`);
  for (let i = 0; i < node.Components.length; i++) {
    const c = node.Components[i];
    if (!c || typeof c.Name !== 'string' || !c.Name.trim() || typeof c.IsEnabled !== 'boolean') throw new Error(`${pathLabel}.Components[${i}] invalid`);
  }
  node.Children.forEach((child, i) => validateNode(child, expectedDepth + 1, `${pathLabel}.Children[${i}]`));
}

for (const relative of ['examples/basic-scene.json', 'examples/nested-scene.json']) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  if (doc.schemaVersion !== '1.0') throw new Error(`${relative} schemaVersion mismatch`);
  if (!['active-scene', 'selection'].includes(doc.source)) throw new Error(`${relative} source invalid`);
  if (!Array.isArray(doc.hierarchyObjects)) throw new Error(`${relative} hierarchyObjects missing`);
  doc.hierarchyObjects.forEach((node, i) => validateNode(node, 0, `${relative}.hierarchyObjects[${i}]`));
}

execFileSync(process.execPath, ['--check', path.join(root, 'figjam-plugin/dist/code.js')], { stdio: 'inherit' });
console.log('UniMap repository validation passed.');
