using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    /// <summary>
    /// World-first route presentation for the playable alpha.
    /// It owns presentation geometry/camera only; NavigationService remains canonical.
    /// </summary>
    public sealed class VexforgeAlphaWorldDirector : MonoBehaviour
    {
        private readonly List<Material> materials = new List<Material>();
        private readonly List<Mesh> meshes = new List<Mesh>();
        private NavigationService navigation;
        private Camera targetCamera;
        private Transform worldRoot;
        private Transform nexusRoot;
        private Transform chamberRoot;
        private readonly Dictionary<GameRoute, Transform> cameraAnchors = new Dictionary<GameRoute, Transform>();
        private Transform archiveStage;
        private Transform forgeStage;
        private Transform missionStage;
        private Transform economyStage;
        private Transform profileStage;
        private VexforgeBattlefieldStage battleStage;
        private Transform galleryRoot;
        private bool initialized;
        private Coroutine cameraMotion;
        private GameRoute route;
        private Vector3 originalCameraPosition;
        private Quaternion originalCameraRotation;

        public void Initialize(NavigationService navigationService, Camera camera)
        {
            if (initialized)
                return;

            navigation = navigationService ?? throw new ArgumentNullException(nameof(navigationService));
            targetCamera = camera != null ? camera : Camera.main;
            if (targetCamera == null)
                throw new InvalidOperationException("VEXFORGE Alpha World requires MainCamera.");

            originalCameraPosition = targetCamera.transform.position;
            originalCameraRotation = targetCamera.transform.rotation;

            CreateMaterials();
            BuildWorld();
            initialized = true;
            SetRoute(GameRoute.Nexus, true);
        }

        public void BindBattlefield(VexforgeBattlefieldStage battlefield)
        {
            battleStage = battlefield;
        }

        public void BindGalleryRoot(Transform gallery)
        {
            galleryRoot = gallery;
        }

        public void SetVisible(bool visible)
        {
            if (!initialized || worldRoot == null)
                return;
            if (!visible)
            {
                if (cameraMotion != null)
                {
                    StopCoroutine(cameraMotion);
                    cameraMotion = null;
                }
                if (targetCamera != null)
                {
                    targetCamera.transform.position = originalCameraPosition;
                    targetCamera.transform.rotation = originalCameraRotation;
                }
                if (battleStage != null)
                    battleStage.SetVisible(false);
            }
            worldRoot.gameObject.SetActive(visible);
        }

        public void SetRoute(GameRoute nextRoute, bool immediate = false)
        {
            if (!initialized)
                return;

            if (worldRoot != null)
                worldRoot.gameObject.SetActive(true);
            route = nextRoute;
            SetActive(nexusRoot, nextRoute == GameRoute.Nexus);
            SetActive(chamberRoot, nextRoute != GameRoute.Nexus && nextRoute != GameRoute.Battle);

            SetActive(archiveStage, nextRoute == GameRoute.Collection);
            SetActive(forgeStage, nextRoute == GameRoute.Deck);
            SetActive(missionStage, nextRoute == GameRoute.Missions);
            SetActive(economyStage, nextRoute == GameRoute.Economy);
            SetActive(profileStage, nextRoute == GameRoute.Profile);
            if (battleStage != null)
                battleStage.SetVisible(nextRoute == GameRoute.Battle);

            PositionGallery(nextRoute);

            Transform anchor;
            if (!cameraAnchors.TryGetValue(nextRoute, out anchor))
                anchor = cameraAnchors[GameRoute.Nexus];

            if (cameraMotion != null)
                StopCoroutine(cameraMotion);

            if (immediate)
            {
                targetCamera.transform.position = anchor.position;
                targetCamera.transform.rotation = anchor.rotation;
            }
            else
            {
                cameraMotion = StartCoroutine(MoveCamera(anchor));
            }
        }

        private void BuildWorld()
        {
            worldRoot = new GameObject("VexforgePlayableAlphaWorld").transform;
            worldRoot.SetParent(transform, false);

            nexusRoot = new GameObject("NexusWorld").transform;
            nexusRoot.SetParent(worldRoot, false);
            BuildNexus();

            chamberRoot = new GameObject("RouteChambers").transform;
            chamberRoot.SetParent(worldRoot, false);
            archiveStage = BuildArchiveStage();
            forgeStage = BuildForgeStage();
            missionStage = BuildMissionStage();
            economyStage = BuildEconomyStage();
            profileStage = BuildProfileStage();

            BuildCameraAnchors();
        }

        private void BuildNexus()
        {
            var floor = CreatePrimitive("NexusFloor", PrimitiveType.Cube, new Vector3(0f, -1.1f, 3.6f), new Vector3(30f, 0.75f, 28f), GetMaterial(0), nexusRoot);
            CreateRing("NexusRing", new Vector3(0f, -0.67f, 5.0f), 8.2f, 0.14f, GetMaterial(2), nexusRoot);
            CreateRing("NexusInnerRing", new Vector3(0f, -0.50f, 5.0f), 3.5f, 0.10f, GetMaterial(1), nexusRoot);
            CreatePrimitive("NexusCore", PrimitiveType.Cylinder, new Vector3(0f, 0.05f, 5f), new Vector3(3.1f, 0.42f, 3.1f), GetMaterial(1), nexusRoot);
            CreatePrimitive("NexusMonument", PrimitiveType.Cube, new Vector3(0f, 5.5f, 11f), new Vector3(2.4f, 9f, 1.7f), GetMaterial(0), nexusRoot);

            CreateNexusLight(new Vector3(0f, 5f, 3.2f), new Color(1f, 0.65f, 0.28f, 1f), 3.2f, 14f);
            CreateNexusLight(new Vector3(-7f, 3f, 5f), new Color(0.20f, 0.50f, 0.85f, 1f), 2.2f, 10f);
            CreateNexusLight(new Vector3(7f, 3f, 8f), new Color(0.45f, 0.20f, 0.72f, 1f), 2.0f, 10f);

            var portals = new[]
            {
                new PortalSpec(GameRoute.Collection, "ARCHIVE", "-6.6 0.1 4.4", new Color(0.22f, 0.58f, 0.86f, 1f)),
                new PortalSpec(GameRoute.Deck, "FORGE", "-3.2 0.1 9.0", new Color(0.86f, 0.32f, 0.13f, 1f)),
                new PortalSpec(GameRoute.Battle, "BATTLEFIELD", "6.6 0.1 4.4", new Color(0.73f, 0.16f, 0.23f, 1f)),
                new PortalSpec(GameRoute.Missions, "MISSIONS", "3.3 0.1 9.0", new Color(0.72f, 0.56f, 0.16f, 1f)),
                new PortalSpec(GameRoute.Economy, "TREASURY", "7.0 0.1 9.0", new Color(0.20f, 0.70f, 0.43f, 1f)),
                new PortalSpec(GameRoute.Profile, "HALL", "0.0 0.1 -1.0", new Color(0.56f, 0.44f, 0.72f, 1f))
            };

            for (var i = 0; i < portals.Length; i++)
                BuildPortal(portals[i]);

            var mist = new GameObject("NexusAtmosphere");
            mist.transform.SetParent(nexusRoot, false);
            var particle = mist.AddComponent<ParticleSystem>();
            var main = particle.main;
            main.loop = true;
            main.startLifetime = 3.5f;
            main.startSpeed = 0.18f;
            main.startSize = 0.035f;
            main.startColor = new Color(0.5f, 0.62f, 0.78f, 0.20f);
            main.maxParticles = 96;
            var emission = particle.emission;
            emission.rateOverTime = 12f;
            var shape = particle.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(22f, 2f, 20f);
            mist.transform.localPosition = new Vector3(0f, 2f, 5f);
        }

        private Transform BuildArchiveStage()
        {
            var stage = CreateChamber("ArchiveSanctum", new Vector3(-0.05f, -0.75f, 8.6f), GetMaterial(3));
            CreateRing("ArchiveRing", stage.position + Vector3.up * 0.24f, 4.4f, 0.10f, GetMaterial(4), stage);
            CreatePrimitive("ArchivePedestal", PrimitiveType.Cylinder, new Vector3(0f, 0.15f, 0f), new Vector3(2.5f, 0.42f, 2.5f), GetMaterial(0), stage);
            CreatePrimitive("ArchiveCore", PrimitiveType.Sphere, new Vector3(0f, 1.25f, 0f), Vector3.one * 0.85f, GetMaterial(4), stage);
            return stage;
        }

        private Transform BuildForgeStage()
        {
            var stage = CreateChamber("ForgeSanctum", new Vector3(0f, -0.75f, 8.6f), GetMaterial(0));
            CreatePrimitive("ForgeAnvil", PrimitiveType.Cube, new Vector3(-2.2f, 0.05f, 0f), new Vector3(2.5f, 0.55f, 1.2f), GetMaterial(0), stage);
            CreatePrimitive("ForgeCore", PrimitiveType.Cylinder, new Vector3(1.7f, 0.35f, 0f), new Vector3(1.8f, 0.6f, 1.8f), GetMaterial(1), stage);
            CreateRing("ForgeRing", new Vector3(1.7f, 1.1f, 0f), 1.55f, 0.08f, GetMaterial(1), stage);
            return stage;
        }

        private Transform BuildMissionStage()
        {
            var stage = CreateChamber("MissionHall", new Vector3(0f, -0.75f, 8.6f), GetMaterial(5));
            for (var i = 0; i < 3; i++)
            {
                var x = (i - 1) * 2.6f;
                CreatePrimitive("ContractPedestal_" + i, PrimitiveType.Cube, new Vector3(x, 0.18f, 0f), new Vector3(1.7f, 0.55f, 1.7f), GetMaterial(5), stage);
                CreateRing("ContractRune_" + i, new Vector3(x, 0.52f, 0f), 0.65f, 0.07f, GetMaterial(4), stage);
            }
            return stage;
        }

        private Transform BuildEconomyStage()
        {
            var stage = CreateChamber("TreasuryHall", new Vector3(0f, -0.75f, 8.6f), GetMaterial(6));
            CreatePrimitive("TreasuryVault", PrimitiveType.Cylinder, new Vector3(0f, 0.0f, 0f), new Vector3(3.0f, 1.4f, 3.0f), GetMaterial(6), stage);
            CreateRing("TreasuryRing", new Vector3(0f, 1.4f, 0f), 2.1f, 0.10f, GetMaterial(4), stage);
            return stage;
        }

        private Transform BuildProfileStage()
        {
            var stage = CreateChamber("ProfileHall", new Vector3(0f, -0.75f, 8.6f), GetMaterial(7));
            CreatePrimitive("ProfileObelisk", PrimitiveType.Cube, new Vector3(0f, 1.8f, 0f), new Vector3(1.2f, 3.6f, 1.2f), GetMaterial(7), stage);
            CreateRing("ProfileRing", new Vector3(0f, 0.15f, 0f), 2.0f, 0.08f, GetMaterial(4), stage);
            return stage;
        }

        private Transform CreateChamber(string name, Vector3 position, Material baseMaterial)
        {
            var stage = new GameObject(name).transform;
            stage.SetParent(chamberRoot, false);
            stage.position = position;
            CreatePrimitive(name + "Floor", PrimitiveType.Cube, Vector3.zero, new Vector3(12f, 0.55f, 9f), baseMaterial, stage);
            CreateRing(name + "Ring", new Vector3(0f, 0.3f, 0f), 5.0f, 0.10f, GetMaterial(4), stage);
            return stage;
        }

        private void BuildPortal(PortalSpec spec)
        {
            var tokens = spec.Position.Split(' ');
            var localPosition = new Vector3(
                float.Parse(tokens[0], System.Globalization.CultureInfo.InvariantCulture),
                float.Parse(tokens[1], System.Globalization.CultureInfo.InvariantCulture),
                float.Parse(tokens[2], System.Globalization.CultureInfo.InvariantCulture));

            var root = new GameObject(spec.Label + "Portal");
            root.transform.SetParent(nexusRoot, false);
            root.transform.localPosition = localPosition;
            root.transform.localScale = Vector3.one;

            var hotspot = root.AddComponent<VexforgeWorldHotspot>();
            hotspot.Configure(spec.Route, spec.Accent);
            hotspot.RouteRequested += HandleRouteRequested;

            var collider = root.GetComponent<BoxCollider>();
            collider.size = new Vector3(3f, 2.8f, 3f);
            collider.center = new Vector3(0f, 1.2f, 0f);

            CreatePrimitive(spec.Label + "Pedestal", PrimitiveType.Cylinder, Vector3.zero, new Vector3(2.4f, 0.35f, 2.4f), GetMaterial(0), root.transform);
            var portalMaterial = CreateMaterial(spec.Accent, true);
            materials.Add(portalMaterial);
            var rune = CreateRing(spec.Label + "Rune", new Vector3(0f, 0.42f, 0f), 1.35f, 0.10f, portalMaterial, root.transform);
            var monolith = CreatePrimitive(spec.Label + "Monolith", PrimitiveType.Cube, new Vector3(0f, 1.55f, 0f), new Vector3(0.55f, 2.25f, 0.55f), portalMaterial, root.transform);
            monolith.transform.localRotation = Quaternion.Euler(0f, 45f, 0f);
            var pulse = root.AddComponent<VexforgePortalPulse>();
            pulse.Configure(rune, monolith.transform);

            var textObject = new GameObject(spec.Label + "Label");
            textObject.transform.SetParent(root.transform, false);
            textObject.transform.localPosition = new Vector3(0f, 3.05f, 0f);
            textObject.transform.localRotation = Quaternion.Euler(62f, 0f, 0f);
            var text = textObject.AddComponent<TextMesh>();
            text.text = spec.Label;
            text.anchor = TextAnchor.MiddleCenter;
            text.alignment = TextAlignment.Center;
            text.fontSize = 42;
            text.characterSize = 0.03f;
            text.color = spec.Accent;
        }

        private void BuildCameraAnchors()
        {
            CreateCameraAnchor(GameRoute.Nexus, new Vector3(0f, 10.8f, -15.4f), Quaternion.Euler(30f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Collection, new Vector3(0f, 5.7f, -8.8f), Quaternion.Euler(24f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Deck, new Vector3(0f, 5.3f, -8.4f), Quaternion.Euler(23f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Battle, new Vector3(0f, 10.3f, -9.4f), Quaternion.Euler(48f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Missions, new Vector3(0f, 5.0f, -8.5f), Quaternion.Euler(24f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Economy, new Vector3(0f, 5.0f, -8.5f), Quaternion.Euler(24f, 0f, 0f));
            CreateCameraAnchor(GameRoute.Profile, new Vector3(0f, 5.4f, -8.5f), Quaternion.Euler(24f, 0f, 0f));
        }

        private void CreateCameraAnchor(GameRoute route, Vector3 position, Quaternion rotation)
        {
            var anchor = new GameObject(route + "CameraAnchor").transform;
            anchor.SetParent(worldRoot, false);
            anchor.position = position;
            anchor.rotation = rotation;
            cameraAnchors[route] = anchor;
        }

        private void PositionGallery(GameRoute currentRoute)
        {
            if (galleryRoot == null)
                return;

            var visible = currentRoute == GameRoute.Collection || currentRoute == GameRoute.Deck;
            galleryRoot.gameObject.SetActive(visible);
            if (!visible)
                return;

            galleryRoot.position = new Vector3(0f, 2.9f, 4.9f);
            galleryRoot.rotation = Quaternion.identity;
            galleryRoot.localScale = currentRoute == GameRoute.Collection
                ? Vector3.one * 0.92f
                : Vector3.one * 0.85f;
        }

        private void HandleRouteRequested(GameRoute nextRoute)
        {
            navigation.Navigate(nextRoute);
        }

        private IEnumerator MoveCamera(Transform anchor)
        {
            var startPosition = targetCamera.transform.position;
            var startRotation = targetCamera.transform.rotation;
            var duration = 0.52f;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / duration;
                var n = Mathf.Clamp01(t);
                var eased = EaseInOutCubic(n);
                targetCamera.transform.position = Vector3.Lerp(startPosition, anchor.position, eased);
                targetCamera.transform.rotation = Quaternion.Slerp(startRotation, anchor.rotation, eased);
                yield return null;
            }
        }

        private void CreateNexusLight(Vector3 position, Color color, float intensity, float range)
        {
            var go = new GameObject("VexforgeAlphaLight");
            go.transform.SetParent(worldRoot, false);
            go.transform.position = position;
            var light = go.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
        }

        private void CreateMaterials()
        {
            materials.Add(CreateMaterial(new Color(0.032f, 0.025f, 0.041f, 1f), false));
            materials.Add(CreateMaterial(new Color(0.26f, 0.13f, 0.065f, 1f), true));
            materials.Add(CreateMaterial(new Color(0.22f, 0.42f, 0.58f, 1f), true));
            materials.Add(CreateMaterial(new Color(0.08f, 0.10f, 0.13f, 1f), false));
            materials.Add(CreateMaterial(new Color(0.74f, 0.56f, 0.26f, 1f), true));
            materials.Add(CreateMaterial(new Color(0.36f, 0.23f, 0.10f, 1f), true));
            materials.Add(CreateMaterial(new Color(0.12f, 0.32f, 0.20f, 1f), true));
            materials.Add(CreateMaterial(new Color(0.25f, 0.18f, 0.42f, 1f), true));
        }

        private Material GetMaterial(int index)
        {
            return index >= 0 && index < materials.Count ? materials[index] : null;
        }

        private static Material CreateMaterial(Color color, bool emission)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
                shader = Shader.Find("Standard");
            if (shader == null)
                return null;
            var material = new Material(shader);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (emission && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * 1.6f);
            }
            return material;
        }

        private static GameObject CreatePrimitive(
            string name,
            PrimitiveType type,
            Vector3 position,
            Vector3 scale,
            Material material,
            Transform parent)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            var collider = go.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null && material != null) renderer.sharedMaterial = material;
            return go;
        }

        private Transform CreateRing(
            string name,
            Vector3 position,
            float radius,
            float thickness,
            Material material,
            Transform parent)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            var filter = go.AddComponent<MeshFilter>();
            var renderer = go.AddComponent<MeshRenderer>();
            var mesh = BuildRingMesh(radius, thickness, 72);
            filter.sharedMesh = mesh;
            meshes.Add(mesh);
            renderer.sharedMaterial = material;
            return go.transform;
        }

        private static Mesh BuildRingMesh(float radius, float thickness, int segments)
        {
            var mesh = new Mesh { name = "VexforgeAlphaRingMesh" };
            var vertices = new Vector3[segments * 2];
            var triangles = new int[segments * 6];
            var inner = Mathf.Max(0.01f, radius - thickness);
            for (var i = 0; i < segments; i++)
            {
                var angle = i / (float)segments * Mathf.PI * 2f;
                var dir = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle));
                vertices[i * 2] = dir * inner;
                vertices[i * 2 + 1] = dir * radius;
                var next = (i + 1) % segments;
                var t = i * 6;
                triangles[t] = i * 2;
                triangles[t + 1] = next * 2 + 1;
                triangles[t + 2] = i * 2 + 1;
                triangles[t + 3] = i * 2;
                triangles[t + 4] = next * 2;
                triangles[t + 5] = next * 2 + 1;
            }
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void SetActive(Transform target, bool active)
        {
            if (target != null)
                target.gameObject.SetActive(active);
        }

        private static float EaseInOutCubic(float value)
        {
            return value < 0.5f
                ? 4f * value * value * value
                : 1f - Mathf.Pow(-2f * value + 2f, 3f) / 2f;
        }

        private void OnDestroy()
        {
            if (cameraMotion != null)
                StopCoroutine(cameraMotion);
            if (targetCamera != null)
            {
                targetCamera.transform.position = originalCameraPosition;
                targetCamera.transform.rotation = originalCameraRotation;
            }
            for (var i = meshes.Count - 1; i >= 0; i--)
                if (meshes[i] != null) Destroy(meshes[i]);
            meshes.Clear();
            for (var i = materials.Count - 1; i >= 0; i--)
                if (materials[i] != null) Destroy(materials[i]);
            materials.Clear();
        }

        private readonly struct PortalSpec
        {
            public readonly GameRoute Route;
            public readonly string Label;
            public readonly string Position;
            public readonly Color Accent;

            public PortalSpec(GameRoute route, string label, string position, Color accent)
            {
                Route = route;
                Label = label;
                Position = position;
                Accent = accent;
            }
        }
    }
}
