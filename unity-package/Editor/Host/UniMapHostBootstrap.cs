using System;
using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.UniMap
{
    [InitializeOnLoad]
    internal static class UniMapHostBootstrap
    {
        static UniMapHostBootstrap()
        {
            AssemblyReloadEvents.beforeAssemblyReload += UniMapHost.Stop;
            EditorApplication.quitting += UniMapHost.Stop;
            EditorApplication.delayCall += StartSafe;
        }

        private static void StartSafe()
        {
            try
            {
                UniMapHost.Start();
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"UniMap local host did not start: {exception.Message}");
            }
        }
    }
}
