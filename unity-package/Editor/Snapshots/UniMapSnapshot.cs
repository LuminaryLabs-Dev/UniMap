using System;

namespace LuminaryLabs.UniMap
{
    public sealed class UniMapSnapshot
    {
        public long Revision { get; }
        public DateTime CreatedUtc { get; }
        public string InfoJson { get; }
        public string SceneJson { get; }
        public string SelectionJson { get; }
        public string SchemaJson { get; }

        public UniMapSnapshot(
            long revision,
            DateTime createdUtc,
            string infoJson,
            string sceneJson,
            string selectionJson,
            string schemaJson)
        {
            Revision = revision;
            CreatedUtc = createdUtc;
            InfoJson = infoJson ?? throw new ArgumentNullException(nameof(infoJson));
            SceneJson = sceneJson ?? throw new ArgumentNullException(nameof(sceneJson));
            SelectionJson = selectionJson ?? throw new ArgumentNullException(nameof(selectionJson));
            SchemaJson = schemaJson ?? throw new ArgumentNullException(nameof(schemaJson));
        }
    }
}
