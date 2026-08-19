using System;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LuminaryLabs.UniMap
{
    [InitializeOnLoad]
    public static class UniMapSnapshotService
    {
        private const double DebounceSeconds = 0.2d;
        private static readonly object Sync = new object();
        private static UniMapSnapshot _current;
        private static bool _dirty = true;
        private static double _refreshAt;
        private static long _revision;

        public static event Action<long> SnapshotChanged;

        static UniMapSnapshotService()
        {
            EditorApplication.hierarchyChanged += MarkDirty;
            Selection.selectionChanged += MarkDirty;
            EditorApplication.playModeStateChanged += _ => MarkDirty();
            EditorApplication.update += OnEditorUpdate;
            EditorApplication.delayCall += RefreshNowSafe;
        }

        public static bool TryGetCurrent(out UniMapSnapshot snapshot)
        {
            lock (Sync)
            {
                snapshot = _current;
                return snapshot != null;
            }
        }

        public static UniMapSnapshot GetCurrentOrRefresh()
        {
            if (TryGetCurrent(out UniMapSnapshot snapshot))
            {
                return snapshot;
            }

            RefreshNow();
            if (TryGetCurrent(out snapshot))
            {
                return snapshot;
            }

            throw new InvalidOperationException("UniMap could not create an initial snapshot.");
        }

        public static void MarkDirty()
        {
            _dirty = true;
            _refreshAt = EditorApplication.timeSinceStartup + DebounceSeconds;
        }

        public static void RefreshNow()
        {
            if (EditorApplication.isCompiling)
            {
                MarkDirty();
                return;
            }

            UniMapDocument sceneDocument = BuildSceneDocumentSafe();
            UniMapDocument selectionDocument = BuildSelectionDocumentSafe(sceneDocument.scene);
            long nextRevision = _revision + 1;
            DateTime now = DateTime.UtcNow;

            UniMapInfo info = new UniMapInfo
            {
                unityVersion = Application.unityVersion,
                project = GetProjectName(),
                scene = sceneDocument.scene,
                snapshotRevision = nextRevision,
                snapshotCreatedUtc = now.ToString("O")
            };

            UniMapSnapshot next = new UniMapSnapshot(
                nextRevision,
                now,
                JsonUtility.ToJson(info, true),
                UniMapSerializer.Serialize(sceneDocument, true),
                UniMapSerializer.Serialize(selectionDocument, true),
                UniMapProtocol.GetSchemaJson());

            lock (Sync)
            {
                _current = next;
                _revision = nextRevision;
            }

            _dirty = false;
            SnapshotChanged?.Invoke(nextRevision);
        }

        private static void OnEditorUpdate()
        {
            if (!_dirty || EditorApplication.isCompiling || EditorApplication.timeSinceStartup < _refreshAt)
            {
                return;
            }

            RefreshNowSafe();
        }

        private static void RefreshNowSafe()
        {
            try
            {
                RefreshNow();
            }
            catch (Exception exception)
            {
                _dirty = true;
                _refreshAt = EditorApplication.timeSinceStartup + 1d;
                Debug.LogWarning($"UniMap snapshot refresh failed: {exception.Message}");
            }
        }

        private static UniMapDocument BuildSceneDocumentSafe()
        {
            Scene scene = SceneManager.GetActiveScene();
            if (scene.IsValid())
            {
                return UniMapHierarchyScanner.BuildActiveSceneDocument();
            }

            return UniMapSerializer.CreateEmpty("No Active Scene", Application.unityVersion, UniMapSerializer.ActiveSceneSource);
        }

        private static UniMapDocument BuildSelectionDocumentSafe(string sceneName)
        {
            GameObject[] selected = Selection.gameObjects;
            if (selected != null && selected.Length > 0)
            {
                return UniMapHierarchyScanner.BuildSelectionDocument();
            }

            return UniMapSerializer.CreateEmpty(sceneName, Application.unityVersion, UniMapSerializer.SelectionSource);
        }

        private static string GetProjectName()
        {
            try
            {
                DirectoryInfo projectDirectory = Directory.GetParent(Application.dataPath);
                if (projectDirectory != null && !string.IsNullOrWhiteSpace(projectDirectory.Name))
                {
                    return projectDirectory.Name;
                }
            }
            catch
            {
                // Fall back to Unity's product name below.
            }

            return string.IsNullOrWhiteSpace(Application.productName) ? "Unity Project" : Application.productName;
        }
    }
}
