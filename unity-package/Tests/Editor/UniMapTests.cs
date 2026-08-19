using System;
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
                Assert.That(document.hierarchyObjects, Has.Count.EqualTo(1));
                UniMapHierarchyObject player = document.hierarchyObjects[0];
                Assert.That(player.Name, Is.EqualTo("Player"));
                Assert.That(player.Children, Has.Count.EqualTo(1));
                Assert.That(player.Children[0].Depth, Is.EqualTo(1));

                UniMapComponent colliderComponent = player.Components.Find(component => component.Name == nameof(BoxCollider));
                Assert.That(colliderComponent, Is.Not.Null);
                Assert.That(colliderComponent.IsEnabled, Is.False);
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(root);
            }
        }

        [Test]
        public void Serialize_ProducesCanonicalV1Fields()
        {
            UniMapDocument document = UniMapSerializer.CreateEmpty(
                "SerializationTest",
                "6000.3.0f1",
                UniMapSerializer.SelectionSource);

            string json = UniMapSerializer.Serialize(document);
            StringAssert.Contains("\"schemaVersion\": \"1.0\"", json);
            StringAssert.Contains("\"scene\": \"SerializationTest\"", json);
            StringAssert.Contains("\"source\": \"selection\"", json);
        }

        [Test]
        public void Validate_RejectsIncorrectDepth()
        {
            UniMapDocument document = UniMapSerializer.CreateEmpty(
                "DepthTest",
                "6000.0.0f1",
                UniMapSerializer.ActiveSceneSource);
            document.hierarchyObjects.Add(new UniMapHierarchyObject
            {
                Name = "Root",
                IsEnabled = true,
                Depth = 1
            });

            Assert.That(UniMapSerializer.TryValidate(document, out string error), Is.False);
            StringAssert.Contains("expected 0", error);
        }

        [Test]
        public void Router_HealthIsReadOnlyAndDoesNotRequireToken()
        {
            UniMapRouter router = CreateRouter("test-token");
            UniMapResponse response = router.Route(Request("GET", "/health"));

            Assert.That(response.StatusCode, Is.EqualTo(200));
            StringAssert.Contains("\"service\":\"UniMap\"", response.Body);
        }

        [Test]
        public void Router_ProtectedEndpointsRequireBearerToken()
        {
            UniMapRouter router = CreateRouter("test-token");
            Assert.That(router.Route(Request("GET", "/v1/info")).StatusCode, Is.EqualTo(401));

            Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Authorization", "Bearer test-token" }
            };
            UniMapResponse response = router.Route(new UniMapRequest("GET", "/v1/info", headers));
            Assert.That(response.StatusCode, Is.EqualTo(200));
            StringAssert.Contains("snapshotRevision", response.Body);
        }

        [Test]
        public void Router_RejectsWriteMethods()
        {
            UniMapRouter router = CreateRouter("test-token");
            UniMapResponse response = router.Route(Request("POST", "/v1/scene"));
            Assert.That(response.StatusCode, Is.EqualTo(405));
        }

        [Test]
        public void Router_ServesCachedSnapshotWithoutUnityTraversal()
        {
            UniMapSnapshot snapshot = CreateSnapshot();
            UniMapRouter router = new UniMapRouter(() => snapshot, () => "token");
            Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Authorization", "Bearer token" }
            };

            UniMapResponse response = router.Route(new UniMapRequest("GET", "/v1/scene", headers));
            Assert.That(response.StatusCode, Is.EqualTo(200));
            Assert.That(response.Body, Is.EqualTo(snapshot.SceneJson));
        }

        private static UniMapRouter CreateRouter(string token)
        {
            UniMapSnapshot snapshot = CreateSnapshot();
            return new UniMapRouter(() => snapshot, () => token);
        }

        private static UniMapSnapshot CreateSnapshot()
        {
            string document = "{\"schemaVersion\":\"1.0\",\"scene\":\"Test\",\"unityVersion\":\"6000.3.0f1\",\"source\":\"active-scene\",\"hierarchyObjects\":[]}";
            return new UniMapSnapshot(
                1,
                DateTime.UtcNow,
                "{\"product\":\"UniMap\",\"snapshotRevision\":1}",
                document,
                document.Replace("active-scene", "selection"),
                "{\"title\":\"schema\"}");
        }

        private static UniMapRequest Request(string method, string path)
        {
            return new UniMapRequest(method, path, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));
        }
    }
}
