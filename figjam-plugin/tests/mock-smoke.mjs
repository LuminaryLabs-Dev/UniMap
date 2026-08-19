import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pluginRoot, '..');
const code = fs.readFileSync(path.join(pluginRoot, 'dist', 'code.js'), 'utf8');
const example = fs.readFileSync(path.join(repoRoot, 'examples', 'basic-scene.json'), 'utf8');

class MockNode {
  constructor(type, width = 100, height = 100) {
    this.type = type;
    this.name = '';
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.parent = null;
    this.children = [];
    this.fills = [];
    this.removed = false;
  }
  appendChild(child) {
    if (child.parent && child.parent.children) {
      child.parent.children = child.parent.children.filter(candidate => candidate !== child);
    }
    child.parent = this;
    this.children.push(child);
  }
  resizeWithoutConstraints(width, height) {
    this.width = width;
    this.height = height;
  }
  remove() {
    this.removed = true;
  }
}

class MockSticky extends MockNode {
  constructor() {
    super('STICKY', 240, 240);
    this.authorVisible = true;
    this.text = {
      fontName: null,
      fontSize: 12,
      characters: '',
    };
  }
}

const createdSections = [];
const createdStickies = [];
const postedMessages = [];
const notifications = [];
let showUiCalls = 0;
let scrolled = false;

const figma = {
  showUI() { showUiCalls += 1; },
  closePlugin() {},
  notify(message, options) { notifications.push({ message, options }); },
  loadFontAsync() { return Promise.resolve(); },
  createSection() {
    const node = new MockNode('SECTION', 100, 100);
    createdSections.push(node);
    return node;
  },
  createSticky() {
    const node = new MockSticky();
    createdStickies.push(node);
    return node;
  },
  ui: {
    onmessage: undefined,
    postMessage(message) { postedMessages.push(message); },
  },
  currentPage: {
    selection: [],
  },
  viewport: {
    center: { x: 1000, y: 800 },
    scrollAndZoomIntoView() { scrolled = true; },
  },
};

const context = vm.createContext({ figma, __html__: '<html></html>' });
vm.runInContext(code, context, { filename: 'dist/code.js' });

assert.equal(showUiCalls, 1, 'plugin should show its UI exactly once');
assert.equal(typeof figma.ui.onmessage, 'function', 'plugin should register a UI message handler');

await figma.ui.onmessage({ type: 'render-document', rawJson: example, fileName: 'basic-scene.json' });
assert.ok(createdSections.length >= 4, 'expected scene and hierarchy sections');
assert.ok(createdStickies.length >= 5, 'expected component sticky notes');
assert.equal(figma.currentPage.selection.length, 1, 'rendered scene section should be selected');
assert.equal(scrolled, true, 'viewport should focus the rendered Brain Map');
assert.ok(postedMessages.some(message => message.type === 'render-success'), 'UI should receive render-success');
assert.ok(notifications.some(entry => String(entry.message).includes('rendered')), 'plugin should notify success');
assert.ok(createdStickies.some(sticky => sticky.text.characters === 'CharacterController'), 'component names should be rendered');

const sectionCountBeforeInvalid = createdSections.length;
await figma.ui.onmessage({ type: 'render-document', rawJson: '{}', fileName: 'invalid.json' });
assert.equal(createdSections.length, sectionCountBeforeInvalid, 'invalid documents must fail before canvas mutation');
assert.ok(postedMessages.some(message => message.type === 'render-error'), 'UI should receive render-error');

console.log('UniMap FigJam mock smoke passed.');
