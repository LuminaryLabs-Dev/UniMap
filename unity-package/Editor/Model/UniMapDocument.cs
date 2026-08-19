using System;
using System.Collections.Generic;

namespace LuminaryLabs.UniMap
{
    [Serializable]
    public sealed class UniMapDocument
    {
        public string schemaVersion = UniMapSerializer.SchemaVersion;
        public string scene = string.Empty;
        public string unityVersion = string.Empty;
        public string source = UniMapSerializer.ActiveSceneSource;
        public List<UniMapHierarchyObject> hierarchyObjects = new List<UniMapHierarchyObject>();
    }

    [Serializable]
    public sealed class UniMapHierarchyObject
    {
        public string Name = string.Empty;
        public bool IsEnabled;
        public int Depth;
        public List<UniMapComponent> Components = new List<UniMapComponent>();
        public List<UniMapHierarchyObject> Children = new List<UniMapHierarchyObject>();
    }

    [Serializable]
    public sealed class UniMapComponent
    {
        public string Name = string.Empty;
        public bool IsEnabled;
    }

    [Serializable]
    public sealed class UniMapInfo
    {
        public string product = "UniMap";
        public string apiVersion = UniMapProtocol.ApiVersion;
        public string unityVersion = string.Empty;
        public string project = string.Empty;
        public string scene = string.Empty;
        public long snapshotRevision;
        public string snapshotCreatedUtc = string.Empty;
    }

    [Serializable]
    public sealed class UniMapConnectionInfo
    {
        public string baseUrl = string.Empty;
        public string token = string.Empty;
    }
}
