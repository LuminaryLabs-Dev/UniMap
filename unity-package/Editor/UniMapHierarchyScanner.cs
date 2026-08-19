using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LuminaryLabs.UniMap
{
    public static class UniMapHierarchyScanner
    {
        public static UniMapDocument BuildActiveSceneDocument()
        {
            Scene scene = SceneManager.GetActiveScene();
            if (!scene.IsValid())
            {
                throw new InvalidOperationException("There is no valid active scene to export.");
            }

            return BuildDocument(
                string.IsNullOrWhiteSpace(scene.name) ? "Untitled Scene" : scene.name,
                scene.GetRootGameObjects(),
                Application.unityVersion,
                UniMapSerializer.ActiveSceneSource);
        }

        public static UniMapDocument BuildSelectionDocument()
        {
            GameObject[] selected = Selection.gameObjects;
            if (selected == null || selected.Length == 0)
            {
                throw new InvalidOperationException("Select at least one GameObject before exporting a selection.");
            }

            HashSet<GameObject> selectedSet = new HashSet<GameObject>(selected);
            List<GameObject> roots = selected
                .Where(gameObject => gameObject != null && !HasSelectedAncestor(gameObject.transform.parent, selectedSet))
                .OrderBy(GetStableHierarchyKey, StringComparer.Ordinal)
                .ToList();

            string sceneName = GetSelectionSceneName(roots);
            return BuildDocument(sceneName, roots, Application.unityVersion, UniMapSerializer.SelectionSource);
        }

        public static UniMapDocument BuildDocument(
            string sceneName,
            IEnumerable<GameObject> roots,
            string unityVersion,
            string source)
        {
            if (roots == null)
            {
                throw new ArgumentNullException(nameof(roots));
            }

            UniMapDocument document = new UniMapDocument
            {
                schemaVersion = UniMapSerializer.SchemaVersion,
                scene = string.IsNullOrWhiteSpace(sceneName) ? "Untitled Scene" : sceneName,
                unityVersion = string.IsNullOrWhiteSpace(unityVersion) ? "unknown" : unityVersion,
                source = source,
                hierarchyObjects = new List<UniMapHierarchyObject>()
            };

            foreach (GameObject root in roots)
            {
                if (root != null)
                {
                    document.hierarchyObjects.Add(BuildHierarchy(root, 0));
                }
            }

            if (!UniMapSerializer.TryValidate(document, out string error))
            {
                throw new InvalidOperationException($"Generated UniMap document was invalid: {error}");
            }

            return document;
        }

        private static UniMapHierarchyObject BuildHierarchy(GameObject gameObject, int depth)
        {
            UniMapHierarchyObject hierarchyObject = new UniMapHierarchyObject
            {
                Name = gameObject.name,
                IsEnabled = gameObject.activeSelf,
                Depth = depth,
                Components = ReadComponents(gameObject),
                Children = new List<UniMapHierarchyObject>()
            };

            Transform transform = gameObject.transform;
            for (int childIndex = 0; childIndex < transform.childCount; childIndex++)
            {
                hierarchyObject.Children.Add(BuildHierarchy(transform.GetChild(childIndex).gameObject, depth + 1));
            }

            return hierarchyObject;
        }

        private static List<UniMapComponent> ReadComponents(GameObject gameObject)
        {
            Component[] components = gameObject.GetComponents<Component>();
            List<UniMapComponent> result = new List<UniMapComponent>(components.Length);

            foreach (Component component in components)
            {
                if (component == null)
                {
                    result.Add(new UniMapComponent
                    {
                        Name = "Missing Script",
                        IsEnabled = false
                    });
                    continue;
                }

                result.Add(new UniMapComponent
                {
                    Name = component.GetType().Name,
                    IsEnabled = GetComponentEnabled(component)
                });
            }

            return result;
        }

        private static bool GetComponentEnabled(Component component)
        {
            if (component is Behaviour behaviour)
            {
                return behaviour.enabled;
            }

            if (component is Renderer renderer)
            {
                return renderer.enabled;
            }

            if (component is Collider collider)
            {
                return collider.enabled;
            }

            return true;
        }

        private static bool HasSelectedAncestor(Transform parent, HashSet<GameObject> selected)
        {
            while (parent != null)
            {
                if (selected.Contains(parent.gameObject))
                {
                    return true;
                }

                parent = parent.parent;
            }

            return false;
        }

        private static string GetSelectionSceneName(IReadOnlyCollection<GameObject> roots)
        {
            string[] sceneNames = roots
                .Where(root => root != null && root.scene.IsValid())
                .Select(root => string.IsNullOrWhiteSpace(root.scene.name) ? "Untitled Scene" : root.scene.name)
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            return sceneNames.Length == 1 ? sceneNames[0] : "Selection";
        }

        private static string GetStableHierarchyKey(GameObject gameObject)
        {
            List<string> segments = new List<string>();
            Transform cursor = gameObject.transform;
            while (cursor != null)
            {
                segments.Add($"{cursor.GetSiblingIndex():D6}:{cursor.name}");
                cursor = cursor.parent;
            }

            segments.Reverse();
            return $"{gameObject.scene.name}/{string.Join("/", segments)}";
        }
    }
}
