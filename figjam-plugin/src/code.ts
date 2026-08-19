interface UniMapComponent {
  Name: string;
  IsEnabled: boolean;
}

interface UniMapHierarchyObject {
  Name: string;
  IsEnabled: boolean;
  Depth: number;
  Components: UniMapComponent[];
  Children: UniMapHierarchyObject[];
}

interface UniMapDocument {
  schemaVersion: "1.0";
  scene: string;
  unityVersion: string;
  source: "active-scene" | "selection";
  hierarchyObjects: UniMapHierarchyObject[];
}

interface ValidationCounters {
  nodes: number;
  components: number;
}

interface RenderSize {
  width: number;
  height: number;
}

const SCHEMA_VERSION = "1.0";
const MAX_DEPTH = 64;
const MAX_NODES = 10_000;
const MAX_COMPONENTS = 50_000;

const PADDING = 40;
const HEADER_SPACE = 70;
const GAP = 24;
const COMPONENT_GAP = 16;
const COMPONENT_COLUMNS = 4;
const BASE_NODE_WIDTH = 1_100;
const MIN_NODE_HEIGHT = 190;
const BASE_SCENE_WIDTH = 1_240;
const MIN_SCENE_HEIGHT = 220;

const INTER_MEDIUM: FontName = { family: "Inter", style: "Medium" };

const SCENE_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.91, g: 0.93, b: 0.96 },
};
const ACTIVE_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.98, g: 0.98, b: 0.98 },
};
const NESTED_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.93, g: 0.94, b: 0.96 },
};
const DISABLED_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.88, g: 0.88, b: 0.88 },
};
const COMPONENT_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.55, g: 0.78, b: 1.0 },
};
const COMPONENT_DISABLED_FILL: SolidPaint = {
  type: "SOLID",
  color: { r: 0.74, g: 0.76, b: 0.8 },
};

figma.showUI(__html__, {
  width: 360,
  height: 310,
  themeColors: true,
  title: "UniMap",
});

figma.ui.onmessage = async (message: unknown) => {
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
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown UniMap error.";
    sendError(messageText);
  }
};

function sendError(message: string): void {
  figma.notify(`UniMap: ${message}`, { error: true });
  figma.ui.postMessage({ type: "render-error", message });
}

function parseDocument(rawJson: string): UniMapDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
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

  const counters: ValidationCounters = { nodes: 0, components: 0 };
  const hierarchyObjects = parsed.hierarchyObjects.map((node, index) =>
    parseHierarchyObject(node, 0, `hierarchyObjects[${index}]`, counters),
  );

  return {
    schemaVersion: "1.0",
    scene,
    unityVersion,
    source,
    hierarchyObjects,
  };
}

function parseHierarchyObject(
  value: unknown,
  expectedDepth: number,
  path: string,
  counters: ValidationCounters,
): UniMapHierarchyObject {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (expectedDepth > MAX_DEPTH) {
    throw new ErrorÚ