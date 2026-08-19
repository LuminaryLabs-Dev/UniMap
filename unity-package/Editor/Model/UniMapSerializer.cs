using System;
using UnityEngine;

namespace LuminaryLabs.UniMap
{
    public static class UniMapSerializer
    {
        public const string SchemaVersion = "1.0";
        public const string ActiveSceneSource = "active-scene";
        public const string SelectionSource = "selection";

        public static string Serialize(UniMapDocument document, bool prettyPrint = true)
        {
            if (!TryValidate(document, out string error))
            {
                throw new ArgumentException(error, nameof(document));
            }

            return JsonUtility.ToJson(document, prettyPrint);
        }

        public static bool TryValidate(UniMapDocument document, out string error)
        {
            if (document == null)
            {
                error = "Document is null.";
                return false;
            }

            if (!string.Equals(document.schemaVersion, SchemaVersion, StringComparison.Ordinal))
            {
                error = $"Unsupported schemaVersion '{document.schemaVersion}'. Expected '{SchemaVersion}'.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(document.scene))
            {
                error = "scene is required.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(document.unityVersion))
            {
                error = "unityVersion is required.";
                return false;
            }

            if (!string.Equals(document.source, ActiveSceneSource, StringComparison.Ordinal) &&
                !string.Equals(document.source, SelectionSource, StringComparison.Ordinal))
            {
                error = $"source must be '{ActiveSceneSource}' or '{SelectionSource}'.";
                return false;
            }

            if (document.hierarchyObjects == null)
            {
                error = "hierarchyObjects is required.";
                return false;
            }

            for (int index = 0; index < document.hierarchyObjects.Count; index++)
            {
                if (!TryValidateHierarchyObject(document.hierarchyObjects[index], 0, $"hierarchyObjects[{index}]", out error))
                {
                    return false;
                }
            }

            error = string.Empty;
            return true;
        }

        public static UniMapDocument CreateEmpty(string sceneName, string unityVersion, string source)
        {
            return new UniMapDocument
            {
                schemaVersion = SchemaVersion,
                scene = string.IsNullOrWhiteSpace(sceneName) ? "Untitled Scene" : sceneName,
                unityVersion = string.IsNullOrWhiteSpace(unityVersion) ? "unknown" : unityVersion,
                source = source,
            };
        }

        private static bool TryValidateHierarchyObject(
            UniMapHierarchyObject hierarchyObject,
            int expectedDepth,
            string path,
            out string error)
        {
            if (hierarchyObject == null)
            {
                error = $"{path} is null.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(hierarchyObject.Name))
            {
                error = $"{path}.Name is required.";
                return false;
            }

            if (hierarchyObject.Depth != expectedDepth)
            {
                error = $"{path}.Depth is {hierarchyObject.Depth}; expected {expectedDepth}.";
                return false;
            }

            if (hierarchyObject.Components == null)
            {
                error = $"{path}.Components is required.";
                return false;
            }

            for (int componentIndex = 0; componentIndex < hierarchyObject.Components.Count; componentIndex++)
            {
                UniMapComponent component = hierarchyObject.Components[componentIndex];
                if (component == null || string.IsNullOrWhiteSpace(component.Name))
                {
                    error = $"{path}.Components[{componentIndex}].Name is required.";
                    return false;
                }
            }

            if (hierarchyObject.Children == null)
            {
                error = $"{path}.Children is required.";
                return false;
            }

            for (int childIndex = 0; childIndex < hierarchyObject.Children.Count; childIndex++)
            {
                if (!TryValidateHierarchyObject(
                        hierarchyObject.Children[childIndex],
                        expectedDepth + 1,
                        $"{path}.Children[{childIndex}]",
                        out error))
                {
                    return false;
                }
            }

            error = string.Empty;
            return true;
        }
    }
}
