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
            window.minSize = new Vector2(380f, 230f);
            window.Show();
        }

        [MenuItem("Tools/UniMap/Export Active Scene", false, 1001)]
        public static void ExportActiveSceneFromMenu()
        {
            RunExport(UniMapExporter.ExportActiveScene);
        }

        [MenuItem("Tools/UniMap/Export Selection", false, 1002)]
        public static void ExportSelectionFromMenu()
        {
            RunExport(UniMapExporter.ExportSelection);
        }

        [MenuItem("Tools/UniMap/Export Selection", true)]
        private static bool ValidateExportSelectionFromMenu()
        {
            return Selection.gameObjects != null && Selection.gameObjects.Length > 0;
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(12f);
            EditorGUILayout.LabelField("UniMap — Unity Brain Map", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Export the active Unity scene or selected GameObjects as UniMap JSON, then load the file in the UniMap FigJam plugin.",
                MessageType.Info);

            Scene activeScene = SceneManager.GetActiveScene();
            string activeSceneName = activeScene.IsValid() && !string.IsNullOrWhiteSpace(activeScene.name)
                ? activeScene.name
                : "Untitled Scene";

            EditorGUILayout.LabelField("Active scene", activeSceneName);
            EditorGUILayout.LabelField("Unity", Application.unityVersion);
            EditorGUILayout.Space(8f);

            if (GUILayout.Button("Export Active Scene", GUILayout.Height(34f)))
            {
                RunExport(UniMapExporter.ExportActiveScene);
            }

            using (new EditorGUI.DisabledScope(Selection.gameObjects == null || Selection.gameObjects.Length == 0))
            {
                if (GUILayout.Button("Export Selection", GUILayout.Height(34f)))
                {
                    RunExport(UniMapExporter.ExportSelection);
                }
            }

            EditorGUILayout.Space(8f);
            EditorGUILayout.LabelField("Output", "UniMap JSON v1 (local file)", EditorStyles.miniLabel);
        }

        private static void RunExport(Func<string> export)
        {
            try
            {
                string path = export();
                if (!string.IsNullOrWhiteSpace(path))
                {
                    Debug.Log($"UniMap export written to: {path}");
                    EditorUtility.DisplayDialog("UniMap", $"Export complete.\n\n{path}", "OK");
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
