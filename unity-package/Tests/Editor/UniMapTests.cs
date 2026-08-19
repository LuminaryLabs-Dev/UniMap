using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;

namespace LuminaryLabs.UniMap.Tests
{
    public sealed class UniMapTests
    {
        [Test]
        public void BuildDocument_CapturesHierarchyComponentsAndEnabledState()
        {
            GameObject root = new GameObject("Player");
            GameObject child = new GameObject("Camera");
            child.transform.SetParent(root.transform);
            BoxCollider collider = root.AddComponent<BoxCollider>();
            collider.enabled = false;

            try
            {
                UniMapDocument document = UniMapHierarchyScanner.BuildDocument(
                    "TestScene",
                    new[] { root },
                    "6000.3.0f1",
                    UniMapSerializer.ActiveSceneSource);

                Assert.That(document.schemaVersion, Is.EqualTo("1.0"));
                Assert.That(document.scene, Is.EqualTo("TestScene"));
                Assert.That(document.source, Is.EqualTo("active-scene"));
                Assert.That(document.hierarchyObjects, Has.Count.EqualTo(1));

                UniMapHierarchyObject player = document.hierarchyObjects[0];
                Assert.That(player.Name, Is.EqualTo("Player"));
                Assert.That(player.Depth, Is.EqualTo(0));
                Assert.That(player.Children, Has.Count.EqualTo(1));
                Assert.That(player.Children[0].Name, Is.EqualTo("Camera"));
                Assert.That(player.Children[0].Depth, Is.EqualTo(1));

                UniMapComponent colliderComponent = player.Components.Find(component => component.Name == nameof(BoxCollider));
                Assert.That(colliderComponent, Is.Not.Null);
                Assert.That(colliderComponent.IsEnabled, Is.False);
            }
            finally
            {
                Object.DestroyImmediate(root);
            }
        }

        [Test]
        public void Serialize_ProducesCanonicalV1Fields()
        {
            UniMapDocument document = new UniMapDocument
            {
                scene = "SerializationTest",
                unityVersion = "6000.3.0f1",
                source = UniMapSerializer.SelectionSource,
                hierarchyObjects = new List<UniMapHierarchyObject>()
            };

            string json = UniMapSerializer.Serialize(document);

            StringAssert.Contains("\"schemaVersion\": \"1.0\"", json);
            StringAssert.Contains("\"scene\": \"SerializationTest\"", json);
            StringAssert.Contains("\"source\": \"selection\"", json);
        }

        [Test]
        public void Validate_RejectsIncorrectDepth()
        {
            UniMapDocument document = new UniMapDocument
            {
                scene = "DepthTest",
                unityVersion = "6000.0.0f1",
                source = UniMapSerializer.ActiveSceneSource,
                hierarchyObjects = new List<UniMapHierarchyObject>
                {
                    new UniMapHierarchyObject
                    {
                        Name = "Root",
                        IsEnabled = true,
                        Depth = 1
                    }
                }
            };

            Assert.That(UniMapSerializer.TryValidate(document, out string error), Is.False);
            StringAssert.Contains("expected 0", error);
        }
    }
}
