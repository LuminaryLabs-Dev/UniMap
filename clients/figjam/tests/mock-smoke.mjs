import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(clientRoot, '..', '..');
const code = fs.readFileSync(path.join(clientRoot, 'dist', 'code.js'), 'utf8');
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
}

class MockSticky extends MockNode {
  constructor() {
    super('STICKY', 240, 240);
    this.authorVisible = true;
    this.text = { fontName: null, fontSize: 12, characters: '' };
  }
  rescale(scale) {
    this.width *= scale;
    this.height *= scale;
  }
}

const createdSections = [];
const createdStickies = [];
const postedMessages = [];
const notifications = [];
let showUiCalls = 0;
let scrolled = false;
const clientStorage = new Map([['unimap.baseUrl', 'http://localhost:17432'], ['unimap.token', '0123456789abcdef0123456789abcdef']]);

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
  clientStorage: {
    async getAsync(key) { return clientStorage.get(key); },
    async setAsync(key, value) { clientStorage.set(key, value); },
  },
  currentPage: { selection: [] },
  viewport: {
    center: { x: 1000, y: 800 },
    scrollAndZoomIntoView() { scrolled = true; },
  },
};

const context = vm.createContext({ figma, __html__: '<html></html>' });
vm.runInContext(code, context, { filename: 'dist/code.js' });

assert.equal(showUiCalls, 1);
assert.equal(typeof figma.ui.onmessage, 'function');

await figma.ui.onmessage({ type: 'load-connection-settings' });
assert.ok(postedMessages.some(message => message.type === 'connection-settings' && message.baseUrl === 'http://localhost:17432'));
await figma.ui.onmessage({ type: 'save-connection-settings', baseUrl: 'http://localhost:17433', token: 'fedcba9876543210fedcba9876543210' });
assert.equal(clientStorage.get('unimap.baseUrl'), 'http://localhost:17433');
assert.equal(clientStorage.get('unimap.token'), 'fedcba9876543210fedcba9876543210');

await figma.ui.onmessage({ type: 'render-document', rawJson: example });
assert.equal(createdSections.length, 4, 'scene + Player + Camera + Environment');
assert.equal(createdStickies.length, 6, 'all fixture components should be sticky notes');
assert.equal(figma.currentPage.selection.length, 1);
assert.equal(scrolled, true);
assert.ok(postedMessages.some(message => message.type === 'render-success'));
assert.ok(notifications.some(entry => String(entry.message).includes('rendered')));
assert.ok(createdStickies.some(sticky => sticky.text.characters === 'CharacterController'));

const sectionCountBeforeInvalid = createdSections.length;
await figma.ui.onmessage({ type: 'render-document', rawJson: '{}' });
assert.equal(createdSections.length, sectionCountBeforeInvalid, 'invalid documents must fail before canvas mutation');
assert.ok(postedMessages.some(message => message.type === 'render-error'));

console.log('UniMap FigJam renderer mock smoke passed.');
