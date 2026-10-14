using System.Collections.Generic;
using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Canonical world-space Nexus foundation.
    /// It loads authored VEXFORGE meshes and forwards navigation to the existing service.
    /// </summary>
    public sealed class NexusPresentationRoot : MonoBehaviour
    {
        private NavigationService navigation;
        private readonly List<Material> runtimeMaterials = new List<Material>();
        private readonly Dictionary<string, Material> meshMaterials =
            new Dictionary<string, Material>(System.StringComparer.Ordinal);

        private bool built;
        private bool savedFog;
        private Color savedFogColor;
        private float savedFogDensity;

        public void Initialize(NavigationService navigationService)
        {
            if (built) return;

            navigation = navigationService;
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

            VexforgeWorldMeshFactory.Instantiate(
                "VF_NEXUS_CITADEL_DAIS",
                transform,
                new Vector3(0f, -0.05f, 3.6f),
                Quaternion.identity,
                Vector3.one,
                name => ResolveWorldMeshMaterial(name, new Color(0.18f, 0.68f, 0.90f, 1f)));
            VexforgeWorldMeshFactory.Instantiate(
                "VF_NEXUS_CITADEL_SPINE",
                transform,
                new Vector3(0f, 0.04f, 10.3f),
                Quaternion.identity,
                Vector3.one,
                name => ResolveWorldMeshMaterial(name, new Color(0.18f, 0.68f, 0.90f, 1f)));

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
            collider.size = new Vector3(3.4f, 3.8f, 1.6f);
            collider.center = new Vector3(0f, 1.82f, 0f);
            collider.enabled = true;
            collider.isTrigger = false;

            VexforgeWorldMeshFactory.Instantiate(
                "VF_NEXUS_PORTAL_GATE",
                root.transform,
                Vector3.zero,
                Quaternion.identity,
                Vector3.one,
                name => ResolveWorldMeshMaterial(name, definition.Accent));
        }

        private void HandleRouteRequested(GameRoute route)
        {
            if (navigation != null)
            {
                navigation.Navigate(route);
            }
        }

        private Material ResolveWorldMeshMaterial(string importedName, Color accent)
        {
            if (string.IsNullOrWhiteSpace(importedName))
                throw new System.InvalidOperationException(
                    "VEXFORGE world mesh contains an unnamed material.");

            string palette;
            Texture2D texture;
            Color color;
            var emission = false;
            if (importedName.IndexOf("VEXFORGE_OBSIDIAN", System.StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_OBSIDIAN";
                texture = RequireWorldTexture("VF_NEXUS_OBSIDIAN_ALBEDO");
                color = new Color(0.68f, 0.63f, 0.78f, 1f);
            }
            else if (importedName.IndexOf("VEXFORGE_IRON", System.StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_IRON";
                texture = RequireWorldTexture("VF_NEXUS_IRON_ALBEDO");
                color = new Color(0.74f, 0.78f, 0.84f, 1f);
            }
            else if (importedName.IndexOf("VEXFORGE_BRASS", System.StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_BRASS";
                texture = RequireWorldTexture("VF_NEXUS_BRASS_ALBEDO");
                color = new Color(0.90f, 0.78f, 0.52f, 1f);
            }
            else if (importedName.IndexOf("VEXFORGE_CYAN", System.StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_CYAN";
                texture = RequireWorldTexture("VF_NEXUS_CYAN_ALBEDO");
                color = new Color(0.66f, 0.88f, 0.96f, 1f);
                emission = true;
            }
            else if (importedName.IndexOf("VEXFORGE_ACCENT", System.StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_ACCENT:" + ColorUtility.ToHtmlStringRGBA(accent);
                texture = null;
                color = accent;
                emission = true;
            }
            else
            {
                throw new System.InvalidOperationException(
                    "VEXFORGE world mesh material is not in the approved palette: " +
                    importedName);
            }

            Material cached;
            if (meshMaterials.TryGetValue(palette, out cached) && cached != null)
                return cached;

            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
            {
                throw new System.InvalidOperationException(
                    "VEXFORGE requires the installed Universal Render Pipeline/Lit shader.");
            }

            var material = new Material(shader);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (texture != null && material.HasProperty("_BaseMap"))
                material.SetTexture("_BaseMap", texture);
            if (emission && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * 1.6f);
            }

            runtimeMaterials.Add(material);
            meshMaterials.Add(palette, material);
            return material;
        }

        private static Texture2D RequireWorldTexture(string assetId)
        {
            var texture = Resources.Load<Texture2D>(
                "VexforgeTier1/Models/" + assetId);
            if (texture == null)
            {
                throw new System.InvalidOperationException(
                    "VEXFORGE critical mesh texture is missing: asset_id=" + assetId);
            }

            return texture;
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
            meshMaterials.Clear();

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
