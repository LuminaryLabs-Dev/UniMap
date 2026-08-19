"use strict";
const SCHEMA_VERSION = "1.0";
const MAX_DEPTH = 64;
const MAX_NODES = 10000;
const MAX_COMPONENTS = 50000;
const PADDING = 40;
const HEADER_SPACE = 70;
const GAP = 24;
const COMPONENT_GAP = 16;
const COMPONENT_COLUMNS = 4;
const BASE_NODE_WIDTH = 1100;
const MIN_NODE_HEIGHT = 190;
const BASE_SCENE_WIDTH = 1240;
const MIN_SCENE_HEIGHT = 220;
const INTER_MEDIUM = { family: "Inter", style: "Medium" };
const SCENE_FILL = {
    type: "SOLID",
    color: { r: 0.91, g: 0.93, b: 0.96 },
};
const ACTIVE_FILL = {
    type: "SOLID",
    color: { r: 0.98, g: 0.98, b: 0.98 },
};
const NESTED_FILL = {
    type: "SOLID",
    color: { r: 0.93, g: 0.94, b: 0.96 },
};
const DISABLED_FILL = {
    type: "SOLID",
    color: { r: 0.88, g: 0.88, b: 0.88 },
};
const COMPONENT_FILL = {
    type: "SOLID",
    color: { r: 0.55, g: 0.78, b: 1.0 },
};
const COMPONENT_DISABLED_FILL = {
    type: "SOLID",
    color: { r: 0.74, g: 0.76, b: 0.8 },
};
figma.showUI(__html__, {
    width: 360,
    height: 310,
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
    if (message.type !== "render-document") {
        sendError(`Unknown UniMap message type '${message.type}'.`);
        return;
    }
    try {
        if (typeof message.rawJson !== "string") {
            throw new Error("No JSON content was supplied.");
        }
        const document = parseDocument(message.rawJson);
        await renderDocument(document);
        const summary = `${document.scene}: ${countHierarchyNodes(document.hierarchyObjects)} GameObjects mapped`;
        figma.notify(`UniMap rendered ${summary}.`);
        figma.ui.postMessage({ type: "render-success", message: summary });
    }
    catch (error) {
        const messageText = error instanceof Error ? error.message : "Unknown UniMap error.";
        sendError(messageText);
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
    catch (_a) {
        throw new Error("The selected file is not valid JSON.");
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
    const source = parsed.source;
    if (source !== "active-scene" && source !== "selection") {
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
        source,
        hierarchyObjects,
    };
}
function parseHierarchyObject(value, expectedDepth, path, counters) {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }
    if (expectedDepth > MAX_DEPTH) {
        throw new Error(`UniMap hierarchy exceeds the maximum depth of ${MAX_DEPTH}.`);
    }
    counters.nodes += 1;
    if (counters.nodes > MAX_NODES) {
        throw new Error(`UniMap document exceeds the maximum of ${MAX_NODES} GameObjects.`);
    }
    assertAllowedKeys(value, ["Name", "IsEnabled", "Depth", "Components", "Children"], path);
    const name = requireNonEmptyString(value.Name, `${path}.Name`);
    if (typeof value.IsEnabled !== "boolean") {
        throw new Error(`${path}.IsEnabled must be a boolean.`);
    }
    if (!Number.isInteger(value.Depth) || value.Depth !== expectedDepth) {
        throw new Error(`${path}.Depth must be ${expectedDepth}.`);
    }
    if (!Array.isArray(value.Components)) {
        throw new Error(`${path}.Components must be an array.`);
    }
    if (!Array.isArray(value.Children)) {
        throw new Error(`${path}.Children must be an array.`);
    }
    const components = value.Components.map((component, index) => {
        counters.components += 1;
        if (counters.components > MAX_COMPONENTS) {
            throw new Error(`UniMap document exceeds the maximum of ${MAX_COMPONENTS} components.`);
        }
        return parseComponent(component, `${path}.Components[${index}]`);
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
function parseComponent(value, path) {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }
    assertAllowedKeys(value, ["Name", "IsEnabled"], path);
    const name = requireNonEmptyString(value.Name, `${path}.Name`);
    if (typeof value.IsEnabled !== "boolean") {
        throw new Error(`${path}.IsEnabled must be a boolean.`);
    }
    return { Name: name, IsEnabled: value.IsEnabled };
}
async function renderDocument(document) {
    await figma.loadFontAsync(INTER_MEDIUM);
    let sceneSection;
    try {
        sceneSection = figma.createSection();
        sceneSection.name = `${document.scene} · Unity ${document.unityVersion} · ${document.source}`;
        sceneSection.fills = [SCENE_FILL];
        sceneSection.resizeWithoutConstraints(BASE_SCENE_WIDTH, MIN_SCENE_HEIGHT);
        let cursorY = HEADER_SPACE;
        let widestRoot = 0;
        for (const hierarchyObject of document.hierarchyObjects) {
            const size = renderHierarchyObject(hierarchyObject, sceneSection, cursorY);
            widestRoot = Math.max(widestRoot, size.width);
            cursorY += size.height + GAP;
        }
        const finalWidth = Math.max(BASE_SCENE_WIDTH, widestRoot + PADDING * 2);
        const contentBottom = document.hierarchyObjects.length === 0 ? HEADER_SPACE : cursorY - GAP;
        const finalHeight = Math.max(MIN_SCENE_HEIGHT, contentBottom + PADDING);
        sceneSection.resizeWithoutConstraints(finalWidth, finalHeight);
        const center = figma.viewport.center;
        sceneSection.x = center.x - finalWidth / 2;
        sceneSection.y = center.y - Math.min(finalHeight / 2, 300);
        figma.currentPage.selection = [sceneSection];
        figma.viewport.scrollAndZoomIntoView([sceneSection]);
    }
    catch (error) {
        if (sceneSection && !sceneSection.removed) {
            sceneSection.remove();
        }
        throw error;
    }
}
function renderHierarchyObject(hierarchyObject, parent, y) {
    const section = figma.createSection();
    parent.appendChild(section);
    section.name = hierarchyObject.IsEnabled ? hierarchyObject.Name : `${hierarchyObject.Name} (Disabled)`;
    section.fills = [getHierarchyFill(hierarchyObject)];
    section.x = PADDING;
    section.y = y;
    section.resizeWithoutConstraints(BASE_NODE_WIDTH, MIN_NODE_HEIGHT);
    let componentBottom = HEADER_SPACE;
    let componentRight = 0;
    hierarchyObject.Components.forEach((component, index) => {
        const sticky = figma.createSticky();
        section.appendChild(sticky);
        sticky.authorVisible = false;
        sticky.fills = [component.IsEnabled ? COMPONENT_FILL : COMPONENT_DISABLED_FILL];
        sticky.text.fontName = INTER_MEDIUM;
        sticky.text.fontSize = 14;
        sticky.text.characters = component.IsEnabled ? component.Name : `${component.Name} (Disabled)`;
        const column = index % COMPONENT_COLUMNS;
        const row = Math.floor(index / COMPONENT_COLUMNS);
        sticky.x = PADDING + column * (sticky.width + COMPONENT_GAP);
        sticky.y = HEADER_SPACE + row * (sticky.height + COMPONENT_GAP);
        componentRight = Math.max(componentRight, sticky.x + sticky.width);
        componentBottom = Math.max(componentBottom, sticky.y + sticky.height);
    });
    let childCursorY = hierarchyObject.Components.length > 0 ? componentBottom + GAP : HEADER_SPACE;
    let widestChild = 0;
    for (const child of hierarchyObject.Children) {
        const childSize = renderHierarchyObject(child, section, childCursorY);
        widestChild = Math.max(widestChild, childSize.width);
        childCursorY += childSize.height + GAP;
    }
    const contentBottom = hierarchyObject.Children.length > 0
        ? childCursorY - GAP
        : hierarchyObject.Components.length > 0
            ? componentBottom
            : HEADER_SPACE;
    const width = Math.max(BASE_NODE_WIDTH, componentRight > 0 ? componentRight + PADDING : 0, widestChild > 0 ? widestChild + PADDING * 2 : 0);
    const height = Math.max(MIN_NODE_HEIGHT, contentBottom + PADDING);
    section.resizeWithoutConstraints(width, height);
    return { width, height };
}
function getHierarchyFill(hierarchyObject) {
    if (!hierarchyObject.IsEnabled) {
        return DISABLED_FILL;
    }
    return hierarchyObject.Depth % 2 === 0 ? ACTIVE_FILL : NESTED_FILL;
}
function countHierarchyNodes(nodes) {
    let count = 0;
    for (const node of nodes) {
        count += 1 + countHierarchyNodes(node.Children);
    }
    return count;
}
function requireNonEmptyString(value, path) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${path} must be a non-empty string.`);
    }
    return value.trim();
}
function assertAllowedKeys(value, allowed, path) {
    const allowedSet = new Set(allowed);
    for (const key of Object.keys(value)) {
        if (!allowedSet.has(key)) {
            throw new Error(`${path} contains unsupported field '${key}'.`);
        }
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
