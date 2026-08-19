using System;
using System.IO;
using System.Text;
using UnityEditor;

namespace LuminaryLabs.UniMap
{
    public static class UniMapExporter
    {
        public static string ExportActiveScene()
        {
            return SaveDocument(UniMapHierarchyScanner.BuildActiveSceneDocument());
        }

        public static string ExportSelection()
        {
            return SaveDocument(UniMapHierarchyScanner.BuildSelectionDocument());
        }

        public static string SaveDocument(UniMapDocument document)
        {
            string json = UniMapSerializer.Serialize(document, prettyPrint: true);
            string defaultFileName = $"{SanitizeFileName(document.scene)}.unimap.json";
            string path = EditorUtility.SaveFilePanel(
                "Export UniMap Brain Map Snapshot",
                string.Empty,
                defaultFileName,
                "json");

            if (string.IsNullOrWhiteSpace(path))
            {
                return string.Empty;
            }

            File.WriteAllText(path, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            return path;
        }

        private static string SanitizeFileName(string value)
        {
            string safe = string.IsNullOrWhiteSpace(value) ? "UnityScene" : value.Trim();
            foreach (char invalidCharacter in Path.GetInvalidFileNameChars())
            {
                safe = safe.Replace(invalidCharacter, '_');
            }

            return safe;
        }
    }
}
