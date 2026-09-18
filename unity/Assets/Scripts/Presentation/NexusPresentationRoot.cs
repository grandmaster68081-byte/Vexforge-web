using System.Collections.Generic;
using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Canonical world-space Nexus foundation.
    /// It is structural presentation, not final art. Navigation is forwarded to the existing
    /// NavigationService; no alternate route state machine is created here.
    /// </summary>
    public sealed class NexusPresentationRoot : MonoBehaviour
    {
        private NavigationService navigation;
        private VexforgePresentationResources resources;
        private readonly List<Material> runtimeMaterials = new List<Material>();

        private bool built;
        private bool savedFog;
        private Color savedFogColor;
        private float savedFogDensity;

        public void Initialize(NavigationService navigationService)
        {
            if (built) return;

            navigation = navigationService;
            resources = VexforgePresentationResources.LoadRuntime();
            SaveRenderSettings();
            BuildWorld();
            built = true;
        }

        private void BuildWorld()
        {
            var camera = EnsureMainCamera();
            camera.backgroundColor = new Color(0.012f, 0.010f, 0.014f, 1f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.fieldOfView = 46f;

            ConfigureLighting();

            CreatePrimitive(
                "NexusStoneFloor",
                PrimitiveType.Cube,
                new Vector3(0f, -1.2f, 3.0f),
                new Vector3(24f, 0.7f, 22f),
                resources == null ? null : resources.WorldSurfaceMaterial);

            CreatePrimitive(
                "NexusInnerRing",
                PrimitiveType.Cylinder,
                new Vector3(0f, -0.72f, 4.0f),
                new Vector3(10f, 0.24f, 10f),
                resources == null ? null : resources.CardBodyMaterial);

            CreatePrimitive(
                "NexusForgeCore",
                PrimitiveType.Cylinder,
                new Vector3(0f, 0.32f, 4.1f),
                new Vector3(3.2f, 0.48f, 3.2f),
                resources == null ? null : resources.WorldAccentMaterial);

            CreatePrimitive(
                "NexusObelisk",
                PrimitiveType.Cube,
                new Vector3(0f, 3.5f, 10.5f),
                new Vector3(2.2f, 7.0f, 1.4f),
                resources == null ? null : resources.WorldSurfaceMaterial);

            var routes = new[]
            {
                new PortalDefinition("ArchiveSanctum", "ARCHIVE", "Cards · collection", new Vector3(-6f, 0.25f, 4.5f), new Color(0.08f, 0.30f, 0.42f, 1f), GameRoute.Collection),
                new PortalDefinition("ForgeAltar", "FORGE", "Deck · formation", new Vector3(-3f, 0.25f, 8.4f), new Color(0.46f, 0.18f, 0.055f, 1f), GameRoute.Deck),
                new PortalDefinition("BattlefieldGate", "BATTLEFIELD", "Arena · events", new Vector3(6f, 0.25f, 4.5f), new Color(0.25f, 0.08f, 0.22f, 1f), GameRoute.Battle),
                new PortalDefinition("MissionsChamber", "MISSIONS", "Contracts · activity", new Vector3(3f, 0.25f, 8.4f), new Color(0.28f, 0.24f, 0.08f, 1f), GameRoute.Missions),
                new PortalDefinition("EconomyVault", "ECONOMY", "Treasury · balances", new Vector3(6f, 0.25f, 8.4f), new Color(0.12f, 0.34f, 0.23f, 1f), GameRoute.Economy)
            };

            for (var i = 0; i < routes.Length; i++)
            {
                CreatePortal(routes[i]);
            }
        }

        private void ConfigureLighting()
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.012f, 0.010f, 0.014f, 1f);
            RenderSettings.fogDensity = 0.018f;

            var key = new GameObject("NexusKeyLight");
            key.transform.SetParent(transform, false);
            key.transform.rotation = Quaternion.Euler(38f, -28f, 0f);

            var light = key.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 0.68f;
            light.color = new Color(1f, 0.78f, 0.56f, 1f);
            light.shadows = LightShadows.Soft;

            CreatePointLight(
                "NexusForgeLight",
                new Vector3(0f, 1.5f, 4.1f),
                new Color(0.80f, 0.20f, 0.08f, 1f),
                2.2f,
                7.0f);

            CreatePointLight(
                "NexusArchiveLight",
                new Vector3(-6f, 1.6f, 4.5f),
                new Color(0.16f, 0.45f, 0.75f, 1f),
                1.4f,
                5.0f);
        }

        private void CreatePortal(PortalDefinition definition)
        {
            var root = new GameObject(definition.Name);
            root.transform.SetParent(transform, false);
            root.transform.localPosition = definition.Position;

            var hotspot = root.AddComponent<VexforgeWorldHotspot>();
            hotspot.Configure(definition.Route, definition.Accent);
            hotspot.RouteRequested += HandleRouteRequested;

            var collider = root.GetComponent<BoxCollider>();
            collider.size = new Vector3(2.6f, 2.5f, 2.6f);
            collider.center = new Vector3(0f, 1.15f, 0f);
            collider.enabled = true;
            collider.isTrigger = false;

            CreatePrimitive(
                definition.Name + "_Pedestal",
                PrimitiveType.Cylinder,
                new Vector3(0f, 0.0f, 0f),
                new Vector3(2.25f, 0.35f, 2.25f),
                resources == null ? null : resources.WorldSurfaceMaterial,
                root.transform);

            CreatePrimitive(
                definition.Name + "_Sigil",
                PrimitiveType.Cylinder,
                new Vector3(0f, 0.38f, 0f),
                new Vector3(1.5f, 0.16f, 1.5f),
                CreateAccentMaterial(definition.Accent),
                root.transform);

            var monolith = CreatePrimitive(
                definition.Name + "_Monument",
                PrimitiveType.Cube,
                new Vector3(0f, 1.35f, 0f),
                new Vector3(0.28f, 1.65f, 0.28f),
                CreateAccentMaterial(definition.Accent),
                root.transform);

            monolith.transform.localRotation = Quaternion.Euler(0f, 45f, 0f);
            CreateWorldLabel(root.transform, definition.Title + "\n" + definition.Subtitle, definition.Accent);
        }

        private void CreateWorldLabel(Transform parent, string text, Color color)
        {
            var labelObject = new GameObject("WorldLabel");
            labelObject.transform.SetParent(parent, false);
            labelObject.transform.localPosition = new Vector3(0f, 2.65f, 0f);
            labelObject.transform.localRotation = Quaternion.Euler(62f, 0f, 0f);

            var label = labelObject.AddComponent<TextMesh>();
            label.text = text;
            label.anchor = TextAnchor.MiddleCenter;
            label.alignment = TextAlignment.Center;
            label.characterSize = 0.025f;
            label.fontSize = 44;
            label.color = color;
        }

        private void HandleRouteRequested(GameRoute route)
        {
            if (navigation != null)
            {
                navigation.Navigate(route);
            }
        }

        private GameObject CreatePrimitive(
            string objectName,
            PrimitiveType type,
            Vector3 position,
            Vector3 scale,
            Material material,
            Transform parent = null)
        {
            var target = GameObject.CreatePrimitive(type);
            target.name = objectName;
            target.transform.SetParent(parent == null ? transform : parent, false);
            target.transform.localPosition = position;
            target.transform.localScale = scale;

            var collider = target.GetComponent<Collider>();
            if (collider != null)
            {
                // Only the hotspot root is interactive. Decorative primitives must
                // never steal the pointer ray from the portal collider.
                Destroy(collider);
            }

            var renderer = target.GetComponent<Renderer>();
            if (renderer != null && material != null)
            {
                renderer.sharedMaterial = material;
            }

            return target;
        }

        private Material CreateAccentMaterial(Color accent)
        {
            if (resources == null || resources.WorldAccentMaterial == null)
                return null;

            var instance = new Material(resources.WorldAccentMaterial);
            if (instance.HasProperty("_BaseColor"))
                instance.SetColor("_BaseColor", accent);

            runtimeMaterials.Add(instance);
            return instance;
        }

        private void CreatePointLight(
            string objectName,
            Vector3 position,
            Color color,
            float intensity,
            float range)
        {
            var lightObject = new GameObject(objectName);
            lightObject.transform.SetParent(transform, false);
            lightObject.transform.localPosition = position;

            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
        }

        private Camera EnsureMainCamera()
        {
            var existing = Camera.main;
            if (existing != null) return existing;

            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            var camera = cameraObject.AddComponent<Camera>();
            cameraObject.transform.position = new Vector3(0f, 10.5f, -15.5f);
            cameraObject.transform.rotation = Quaternion.Euler(31f, 0f, 0f);
            return camera;
        }

        private void SaveRenderSettings()
        {
            savedFog = RenderSettings.fog;
            savedFogColor = RenderSettings.fogColor;
            savedFogDensity = RenderSettings.fogDensity;
        }

        private void RestoreRenderSettings()
        {
            RenderSettings.fog = savedFog;
            RenderSettings.fogColor = savedFogColor;
            RenderSettings.fogDensity = savedFogDensity;
        }

        private void OnDestroy()
        {
            for (var i = 0; i < runtimeMaterials.Count; i++)
            {
                if (runtimeMaterials[i] != null) Destroy(runtimeMaterials[i]);
            }

            runtimeMaterials.Clear();

            if (built)
            {
                RestoreRenderSettings();
            }
        }

        private struct PortalDefinition
        {
            public readonly string Name;
            public readonly string Title;
            public readonly string Subtitle;
            public readonly Vector3 Position;
            public readonly Color Accent;
            public readonly GameRoute Route;

            public PortalDefinition(
                string name,
                string title,
                string subtitle,
                Vector3 position,
                Color accent,
                GameRoute route)
            {
                Name = name;
                Title = title;
                Subtitle = subtitle;
                Position = position;
                Accent = accent;
                Route = route;
            }
        }
    }
}
