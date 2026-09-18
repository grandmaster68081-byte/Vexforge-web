using UnityEngine;
using Vexforge.Core;
using Vexforge.UI;

namespace Vexforge.World
{
    public sealed class NexusWorldController : MonoBehaviour
    {
        private Transform worldRoot;
        private VexforgeApp app;
        private readonly Color stone = new Color(0.055f, 0.045f, 0.045f, 1f);
        private readonly Color obsidian = new Color(0.018f, 0.016f, 0.02f, 1f);

        private void Start()
        {
            app = VexforgeApp.Instance;
            BuildDevelopmentWorld();
        }

        private void BuildDevelopmentWorld()
        {
            worldRoot = new GameObject("NexusWorld_Citadel").transform;

            var cameraObject = Camera.main != null ? Camera.main.gameObject : new GameObject("Main Camera");
            if (cameraObject.GetComponent<Camera>() == null) cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = new Vector3(0f, 10.5f, -15.5f);
            cameraObject.transform.rotation = Quaternion.Euler(31f, 0f, 0f);
            cameraObject.GetComponent<Camera>().clearFlags = CameraClearFlags.SolidColor;
            cameraObject.GetComponent<Camera>().backgroundColor = UiColor(UiFactory.Background);
            cameraObject.GetComponent<Camera>().fieldOfView = 46f;

            var lightObject = new GameObject("NexusKeyLight");
            lightObject.transform.SetParent(worldRoot);
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 0.62f;
            light.color = new Color(1f, 0.78f, 0.54f);
            lightObject.transform.rotation = Quaternion.Euler(38f, -28f, 0f);

            RenderSettings.fog = true;
            RenderSettings.fogColor = UiColor(UiFactory.Background);
            RenderSettings.fogDensity = 0.02f;
            CreatePrimitive("NexusStoneFloor", PrimitiveType.Cube, new Vector3(0f, -1.2f, 2f), new Vector3(24f, 0.7f, 20f), stone);
            CreatePrimitive("NexusInnerRing", PrimitiveType.Cylinder, new Vector3(0f, -0.7f, 3.8f), new Vector3(10f, 0.25f, 10f), obsidian);
            CreatePrimitive("NexusForgeCore", PrimitiveType.Cylinder, new Vector3(0f, 0.35f, 4.2f), new Vector3(3.2f, 0.5f, 3.2f), UiFactory.Crimson);
            CreatePrimitive("NexusForgeFlame", PrimitiveType.Sphere, new Vector3(0f, 1.5f, 4.2f), new Vector3(1.1f, 1.7f, 1.1f), UiFactory.Gold);
            CreatePrimitive("NexusObelisk", PrimitiveType.Cube, new Vector3(0f, 3.4f, 10f), new Vector3(2.2f, 6.8f, 1.4f), new Color(0.12f, 0.08f, 0.07f));
            CreatePrimitive("NexusObeliskCap", PrimitiveType.Cube, new Vector3(0f, 7f, 10f), new Vector3(3.2f, 0.35f, 2.2f), UiFactory.Gold);

            CreatePortal("ArchiveSanctum", "ARCHIVE", "Cards / collection", new Vector3(-6f, 0.25f, 4.2f), new Color(0.08f, 0.3f, 0.42f), GameRoute.Collection);
            CreatePortal("ForgeAltar", "FORGE", "Deck / formation", new Vector3(-3f, 0.25f, 8f), new Color(0.46f, 0.18f, 0.055f), GameRoute.Deck);
            CreatePortal("BattlefieldGate", "BATTLEFIELD", "Arena / events", new Vector3(6f, 0.25f, 4.2f), new Color(0.25f, 0.08f, 0.22f), GameRoute.Battle);
            CreatePortal("MissionsChamber", "MISSIONS", "Contracts / activity", new Vector3(3f, 0.25f, 8f), new Color(0.28f, 0.24f, 0.08f), GameRoute.Missions);
            CreatePortal("WorldMonument", "NEXUS", "World / status", new Vector3(0f, 0.25f, 12f), UiFactory.GoldDim, GameRoute.Nexus);
        }

        private void CreatePortal(string objectName, string title, string subtitle, Vector3 position, Color color, GameRoute route)
        {
            var root = new GameObject(objectName);
            root.transform.SetParent(worldRoot);
            root.transform.position = position;
            CreatePrimitive(objectName + "_Pedestal", PrimitiveType.Cylinder, position + Vector3.down * 0.08f,
                new Vector3(2.25f, 0.35f, 2.25f), stone, root.transform);
            CreatePrimitive(objectName + "_Sigil", PrimitiveType.Cylinder, position + Vector3.up * 0.36f,
                new Vector3(1.5f, 0.18f, 1.5f), color, root.transform);
            var rune = CreatePrimitive(objectName + "_Monument", PrimitiveType.Cube, position + Vector3.up * 1.35f,
                new Vector3(0.28f, 1.65f, 0.28f), color, root.transform);
            rune.transform.rotation = Quaternion.Euler(0f, 45f, 0f);
            CreateWorldLabel(root.transform, title + "\n" + subtitle, color, route);
        }

        private void CreateWorldLabel(Transform parent, string text, Color color, GameRoute route)
        {
            var labelObject = new GameObject("WorldLabel", typeof(RectTransform), typeof(Canvas));
            labelObject.transform.SetParent(parent, false);
            labelObject.transform.localPosition = new Vector3(0f, 2.65f, 0f);
            labelObject.transform.localRotation = Quaternion.Euler(62f, 0f, 0f);
            labelObject.transform.localScale = Vector3.one * 0.012f;
            var canvas = labelObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            canvas.worldCamera = Camera.main;
            var button = UiFactory.Button(labelObject.transform, text, () => Navigate(route));
            button.GetComponent<Image>().color = new Color(color.r, color.g, color.b, 0.88f);
            button.GetComponent<RectTransform>().sizeDelta = new Vector2(310f, 80f);
            var outline = button.gameObject.AddComponent<Outline>();
            outline.effectColor = UiFactory.Gold;
            outline.effectDistance = new Vector2(2f, 2f);
        }

        private void Navigate(GameRoute route)
        {
            if (app != null && app.Navigation != null) app.Navigation.Navigate(route);
        }

        private GameObject CreatePrimitive(string name, PrimitiveType type, Vector3 position, Vector3 scale, Color color, Transform parent = null)
        {
            var objectRoot = GameObject.CreatePrimitive(type);
            objectRoot.name = name;
            objectRoot.transform.SetParent(parent == null ? worldRoot : parent);
            objectRoot.transform.position = position;
            objectRoot.transform.localScale = scale;
            var material = objectRoot.GetComponent<Renderer>().material;
            material.color = color;
            return objectRoot;
        }

        private static Color UiColor(Color color)
        {
            return new Color(color.r, color.g, color.b, 1f);
        }
    }
}