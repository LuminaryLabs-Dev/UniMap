using System;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LuminaryLabs.UniMap
{
    public sealed class UniMapWindow : EditorWindow
    {
        [MenuItem("Tools/UniMap/Open Brain Map", false, 1000)]
        public static void Open()
        {
            UniMapWindow window = GetWindow<UniMapWindow>("UniMap");
            window.minSize = new Vector2(440f, 390f);
            window.Show();
        }

        [MenuItem("Tools/UniMap/Restart Local Host", false, 1001)]
        public static void RestartHostFromMenu()
        {
            RunHostAction(UniMapHost.Restart, "Local host restarted.");
        }

        [MenuItem("Tools/UniMap/Export Active Scene Snapshot", false, 1010)]
        public static void ExportActiveSceneFromMenu()
        {
            RunExport(UniMapExporter.ExportActiveScene);
        }

        [MenuItem("Tools/UniMap/Export Selection Snapshot", false, 1011)]
        public static void ExportSelectionFromMenu()
        {
            RunExport(UniMapExporter.ExportSelection);
        }

        [MenuItem("Tools/UniMap/Export Selection Snapshot", true)]
        private static bool ValidateExportSelectionFromMenu()
        {
            return Selection.gameObjects != null && Selection.gameObjects.Length > 0;
        }

        private void OnEnable()
        {
            UniMapSnapshotService.SnapshotChanged += OnSnapshotChanged;
        }

        private void OnDisable()
        {
            UniMapSnapshotService.SnapshotChanged -= OnSnapshotChanged;
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(12f);
            EditorGUILayout.LabelField("UniMap — Unity Local Integration API", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "UniMap keeps a read-only structural snapshot of the current Unity project and serves it only on localhost. FigJam is one client; JSON export remains available as a fallback.",
                MessageType.Info);

            DrawProjectStatus();
            EditorGUILayout.Space(10f);
            DrawHostStatus();
            EditorGUILayout.Space(10f);
            DrawSnapshotStatus();
            EditorGUILayout.Space(10f);
            DrawFallbackExports();
        }

        private static void DrawProjectStatus()
        {
            Scene activeScene = SceneManager.GetActiveScene();
            string activeSceneName = activeScene.IsValid() && !string.IsNullOrWhiteSpace(activeScene.name)
                ? activeScene.name
                : "Untitled Scene";

            EditorGUILayout.LabelField("Project", EditorStyles.boldLabel);
            EditorGUILayout.LabelField("Active scene", activeSceneName);
            EditorGUILayout.LabelField("Unity", Application.unityVersion);
        }

        private void DrawHostStatus()
        {
            EditorGUILayout.LabelField("Local host", EditorStyles.boldLabel);
            EditorGUILayout.LabelField("Status", UniMapHost.IsRunning ? "Running — loopback only" : "Stopped");
            EditorGUILayout.LabelField("Address", UniMapHost.IsRunning ? UniMapHost.BaseUrl : "Not listening");

            using (new EditorGUILayout.HorizontalScope())
            {
                if (!UniMapHost.IsRunning)
                {
                    if (GUILayout.Button("Start Host", GUILayout.Height(30f)))
                    {
                        RunHostAction(UniMapHost.Start, "Local host started.");
                    }
                }
                else
                {
                    if (GUILayout.Button("Restart Host", GUILayout.Height(30f)))
                    {
                        RunHostAction(UniMapHost.Restart, "Local host restarted.");
                    }

                    if (GUILayout.Button("Copy Connection Info", GUILayout.Height(30f)))
                    {
                        EditorGUIUtility.systemCopyBuffer = UniMapHost.GetConnectionInfoJson();
                        ShowNotification(new GUIContent("UniMap connection info copied."));
                    }
                }
            }

            EditorGUILayout.LabelField(
                "Security",
                "127.0.0.1 only • read-only GET API • per-session bearer token",
                EditorStyles.miniLabel);
        }

        private static void DrawSnapshotStatus()
        {
            EditorGUILayout.LabelField("Snapshot", EditorStyles.boldLabel);
            if (UniMapSnapshotService.TryGetCurrent(out UniMapSnapshot snapshot))
            {
                EditorGUILayout.LabelField("Revision", snapshot.Revision.ToString());
                EditorGUILayout.LabelField("Updated", snapshot.CreatedUtc.ToLocalTime().ToString("G"));
            }
            else
            {
                EditorGUILayout.LabelField("Status", "No snapshot yet");
            }

            if (GUILayout.Button("Refresh Snapshot Now", GUILayout.Height(28f)))
            {
                try
                {
                    UniMapSnapshotService.RefreshNow();
                }
                catch (Exception exception)
                {
                    Debug.LogException(exception);
                    EditorUtility.DisplayDialog("UniMap refresh failed", exception.Message, "OK");
                }
            }
        }

        private static void DrawFallbackExports()
        {
            EditorGUILayout.LabelField("Fallback JSON snapshots", EditorStyles.boldLabel);
            EditorGUILayout.LabelField(
                "Use these for debugging, archival snapshots, offline sharing, or until a client connection is available.",
                EditorStyles.wordWrappedMiniLabel);

            using (new EditorGUILayout.HorizontalScope())
            {
                if (GUILayout.Button("Export Active Scene", GUILayout.Height(28f)))
                {
                    RunExport(UniMapExporter.ExportActiveScene);
                }

                using (new EditorGUI.DisabledScope(Selection.gameObjects == null || Selection.gameObjects.Length == 0))
                {
                    if (GUILayout.Button("Export Selection", GUILayout.Height(28f)))
                    {
                        RunExport(UniMapExporter.ExportSelection);
                    }
                }
            }
        }

        private void OnSnapshotChanged(long revision)
        {
            Repaint();
        }

        private static void RunHostAction(Action action, string successMessage)
        {
            try
            {
                action();
                Debug.Log($"UniMap: {successMessage}");
            }
            catch (Exception exception)
            {
                Debug.LogException(exception);
                EditorUtility.DisplayDialog("UniMap host error", exception.Message, "OK");
            }
        }

        private static void RunExport(Func<string> export)
        {
            try
            {
                string path = export();
                if (!string.IsNullOrWhiteSpace(path))
                {
                    Debug.Log($"UniMap snapshot written to: {path}");
                    EditorUtility.DisplayDialog("UniMap", $"Snapshot export complete.\n\n{path}", "OK");
                }
            }
            catch (Exception exception)
            {
                Debug.LogException(exception);
                EditorUtility.DisplayDialog("UniMap export failed", exception.Message, "OK");
            }
        }
    }
}
