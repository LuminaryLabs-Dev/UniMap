"use strict";
const SCHEMA_VERSION = "1.0";
const MAX_DEPTH = 64;
const MAX_NODES = 10000;
const MAX_COMPONENTS = 50000;
const PADDING = 36;
const GAP = 22;
const COMPONENT_GAP = 14;
const COMPONENT_COLUMNS = 4;
const COMPONENT_SCALE = 0.44;
const BASE_SCENE_WIDTH = 1240;
const MIN_NODE_WIDTH = 360;
const MIN_NODE_HEIGHT = 175;
const TITLE_SPACE = 58;
const INTER_MEDIUM = { family: "Inter", style: "Medium" };
const SCENE_FILL = { type: "SOLID", color: { r: 0.91, g: 0.93, b: 0.96 } };
const ACTIVE_FILL = { type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } };
const NESTED_FILL = { type: "SOLID", color: { r: 0.93, g: 0.94, b: 0.96 } };
const DISABLED_FILL = { type: "SOLID", color: { r: 0.88, g: 0.88, b: 0.88 } };
const COMPONENT_FILL = { type: "SOLID", color: { r: 0.55, g: 0.78, b: 1.0 } };
const COMPONENT_DISABLED_FILL = { type: "SOLID", color: { r: 0.74, g: 0.76, b: 0.8 } };
figma.showUI(__html__, {
    width: 390,
    height: 520,
    themeColors: true,
    title: "UniMap",
});
figma.ui.onmessage = async (message) => {
    if (!isRecord(message) || typeof message.type !== "string") {
        sendError("Invalid message from the UniMap UI.");
        return;
    }
    if (message.type === "close") {
        figma.closePlugin();
        return;
    }
    if (message.type === "load-connection-settings") {
        const [baseUrl, token] = await Promise.all([
            figma.clientStorage.getAsync("unimap.baseUrl"),
            figma.clientStorage.getAsync("unimap.token"),
        ]);
        figma.ui.postMessage({
            type: "connection-settings",
            baseUrl: typeof baseUrl === "string" ? baseUrl : "",
            token: typeof token === "string" ? token : "",
        });
        return;
    }
    if (message.type === "save-connection-settings") {
        if (typeof message.baseUrl !== "string" || typeof message.token !== "string") {
            sendError("Invalid UniMap connection settings.");
            return;
        }
        await Promise.all([
            figma.clientStorage.setAsync("unimap.baseUrl", message.baseUrl),
            figma.clientStorage.setAsync("unimap.token", message.token),
        ]);
        return;
    }
    if (message.type !== "render-document") {
        sendError(`Unknown UniMap message type '${message.type}'.`);
        return;
    }
    try {
        if (typeof message.rawJson !== "string") {
            throw new Error("No UniMap JSON content was supplied.");
        }
        const document = parseDocument(message.rawJson);
        await renderDocument(document);
        const summary = `${document.scene}: ${countHierarchyNodes(document.hierarchyObjects)} GameObjects mapped`;
        figma.notify(`UniMap rendered ${summary}.`);
        figma.ui.postMessage({ type: "render-success", message: summary });
    }
    catch (error) {
        sendError(error instanceof Error ? error.message : "Unknown UniMap error.");
    }
};
function sendError(message) {
    figma.notify(`UniMap: ${message}`, { error: true });
    figma.ui.postMessage({ type: "render-error", message });
}
function parseDocument(rawJson) {
    let parsed;
    try {
        parsed = JSON.parse(rawJson);
    }
    catch {
        throw new Error("The supplied UniMap document is not valid JSON.");
    }
    if (!isRecord(parsed)) {
        throw new Error("The UniMap document root must be an object.");
    }
    assertAllowedKeys(parsed, ["schemaVersion", "scene", "unityVersion", "source", "hierarchyObjects"], "document");
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
        throw new Error(`Unsupported schemaVersion '${String(parsed.schemaVersion)}'. Expected '${SCHEMA_VERSION}'.`);
    }
    const scene = requireNonEmptyString(parsed.scene, "scene");
    const unityVersion = requireNonEmptyString(parsed.unityVersion, "unityVersion");
    if (parsed.source !== "active-scene" && parsed.source !== "selection") {
        throw new Error("source must be 'active-scene' or 'selection'.");
    }
    if (!Array.isArray(parsed.hierarchyObjects)) {
        throw new Error("hierarchyObjects must be an array.");
    }
    const counters = { nodes: 0, components: 0 };
    const hierarchyObjects = parsed.hierarchyObjects.map((node, index) => parseHierarchyObject(node, 0, `hierarchyObjects[${index}]`, counters));
    return {
        schemaVersion: "1.0",
        scene,
        unityVersion,
        source: parsed.source,
        hierarchyObjects,
    };
}
function parseHierarchyObject(value, expectedDepth, path, counters) {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }
    if (expectedDepth > MAX_DEPTH) {
        throw new Error(`Hierarchy depth exceeds the ${MAX_DEPTH} level safety limit.`);
    }
    counters.nodes += 1;
    if (counters.nodes > MAX_NODES) {
        throw new Error(`Document exceeds the ${MAX_NODES.toLocaleString()} GameObject safety limit.`);
    }
    assertAllowedKeys(value, ["Name", "IsEnabled", "Depth", "Components", "Children"], path);
    const name = requireNonEmptyString(value.Name, `${path}.Name`);
    if (typeof value.IsEnabled !== "boolean") {
        throw new Error(`${path}.IsEnabled must be a boolean.`);
    }
    if (!Number.isInteger(value.Depth) || value.Depth !== expectedDepth) {
        throw new Error(`${path}.Depth must be ${expectedDepth}.`);
    }
    if (!Array.isArray(value.Components) || !Array.isArray(value.Children)) {
        throw new Error(`${path}.Components and ${path}.Children must be arrays.`);
    }
    const components = value.Components.map((component, index) => {
        if (!isRecord(component)) {
            throw new Error(`${path}.Components[${index}] must be an object.`);
        }
        assertAllowedKeys(component, ["Name", "IsEnabled"], `${path}.Components[${index}]`);
        counters.components += 1;
        if (counters.components > MAX_COMPONENTS) {
            throw new Error(`Document exceeds the ${MAX_COMPONENTS.toLocaleString()} component safety limit.`);
        }
        if (typeof component.IsEnabled !== "boolean") {
            throw new Error(`${path}.Components[${index}].IsEnabled must be a boolean.`);
        }
        return {
            Name: requireNonEmptyString(component.Name, `${path}.Components[${index}].Name`),
            IsEnabled: component.IsEnabled,
        };
    });
    const children = value.Children.map((child, index) => parseHierarchyObject(child, expectedDepth + 1, `${path}.Children[${index}]`, counters));
    return {
        Name: name,
        IsEnabled: value.IsEnabled,
        Depth: expectedDepth,
        Components: components,
        Children: children,
    };
}
async function renderDocument(document) {
    await figma.loadFontAsync(INTER_MEDIUM);
    const sceneSection = figma.createSection();
    sceneSection.name = `${document.scene} — ${document.source === "selection" ? "Selection" : "Scene"}`;
    sceneSection.fills = [SCENE_FILL];
    sceneSection.x = figma.viewport.center.x;
    sceneSection.y = figma.viewport.center.y;
    let cursorY = TITLE_SPACE;
    for (const hierarchyObject of document.hierarchyObjects) {
        const height = renderHierarchyObject(hierarchyObject, sceneSection, PADDING, cursorY, BASE_SCENE_WIDTH - PADDING * 2);
        cursorY += height + GAP;
    }
    const sceneHeight = Math.max(220, cursorY + PADDING - GAP);
    sceneSection.resizeWithoutConstraints(BASE_SCENE_WIDTH, sceneHeight);
    figma.currentPage.selection = [sceneSection];
    figma.viewport.scrollAndZoomIntoView([sceneSection]);
}
function renderHierarchyObject(hierarchyObject, parentSection, x, y, width) {
    const section = figma.createSection();
    section.name = hierarchyObject.IsEnabled ? hierarchyObject.Name : `${hierarchyObject.Name} (Disabled)`;
    section.fills = [hierarchyObject.IsEnabled ? (hierarchyObject.Depth % 2 === 0 ? ACTIVE_FILL : NESTED_FILL) : DISABLED_FILL];
    parentSection.appendChild(section);
    section.x = x;
    section.y = y;
    const safeWidth = Math.max(MIN_NODE_WIDTH, width);
    let cursorY = TITLE_SPACE;
    let componentBottom = cursorY;
    for (let index = 0; index < hierarchyObject.Components.length; index++) {
        const component = hierarchyObject.Components[index];
        const sticky = figma.createSticky();
        sticky.fills = [component.IsEnabled ? COMPONENT_FILL : COMPONENT_DISABLED_FILL];
        sticky.authorVisible = false;
        sticky.text.fontName = INTER_MEDIUM;
        sticky.text.fontSize = 14;
        sticky.text.characters = component.IsEnabled ? component.Name : `${component.Name} (Disabled)`;
        sticky.rescale(COMPONENT_SCALE);
        section.appendChild(sticky);
        const column = index % COMPONENT_COLUMNS;
        const row = Math.floor(index / COMPONENT_COLUMNS);
        sticky.x = PADDING + column * (sticky.width + COMPONENT_GAP);
        sticky.y = cursorY + row * (sticky.height + COMPONENT_GAP);
        componentBottom = Math.max(componentBottom, sticky.y + sticky.height + COMPONENT_GAP);
    }
    cursorY = Math.max(cursorY, componentBottom);
    for (const child of hierarchyObject.Children) {
        const childHeight = renderHierarchyObject(child, section, PADDING, cursorY, safeWidth - PADDING * 2);
        cursorY += childHeight + GAP;
    }
    const height = Math.max(MIN_NODE_HEIGHT, cursorY + PADDING - (hierarchyObject.Children.length > 0 ? GAP : 0));
    section.resizeWithoutConstraints(safeWidth, height);
    return height;
}
function countHierarchyNodes(nodes) {
    let total = 0;
    for (const node of nodes) {
        total += 1 + countHierarchyNodes(node.Children);
    }
    return total;
}
function assertAllowedKeys(record, allowed, path) {
    const allowedSet = new Set(allowed);
    for (const key of Object.keys(record)) {
        if (!allowedSet.has(key)) {
            throw new Error(`${path} contains unsupported field '${key}'.`);
        }
    }
}
function requireNonEmptyString(value, path) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${path} must be a non-empty string.`);
    }
    return value;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
