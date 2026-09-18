using UnityEngine;
using Vexforge.Core;
using Vexforge.UI;

namespace Vexforge.World
{
    public sealed class NexusWorldController : MonoBehaviour
    {
        private Transform worldRoot;

        private void Start()
        {
            BuildDevelopmentWorld();
        }

        private void BuildDevelopmentWorld()
        {
            worldRoot = new GameObject("NexusWorld_DevelopmentGeometry").transform;

            var cameraObject = Camera.main != null ? Camera.main.gameObject : new GameObject("Main Camera");
            if (cameraObject.GetComponent<Camera>() == null) cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = new Vector3(0f, 8f, -13f);
            cameraObject.transform.rotation = Quaternion.Euler(28f, 0f, 0f);
            cameraObject.GetComponent<Camera>().clearFlags = CameraClearFlags.SolidColor;
            cameraObject.GetComponent<Camera>().backgroundColor = UiColor(UiFactory.Background);

            var lightObject = new GameObject("NexusKeyLight");
            lightObject.transform.SetParent(worldRoot);
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 0.75f;
            light.color = new Color(1f, 0.78f, 0.54f);
            lightObject.transform.rotation = Quaternion.Euler(35f, -25f, 0f);

            CreatePrimitive("NexusStoneFloor", PrimitiveType.Cube, new Vector3(0f, -1.2f, 2f), new Vector3(22f, 0.7f, 18f), new Color(0.07f, 0.05f, 0.045f));
            CreatePrimitive("ArchivePortal", PrimitiveType.Cylinder, new Vector3(-6f, 0.2f, 4f), new Vector3(2.6f, 0.25f, 2.6f), new Color(0.14f, 0.32f, 0.42f));
            CreatePrimitive("ForgePortal", PrimitiveType.Cylinder, new Vector3(0f, 0.2f, 6f), new Vector3(2.6f, 0.25f, 2.6f), new Color(0.45f, 0.16f, 0.05f));
            CreatePrimitive("ArenaPortal", PrimitiveType.Cylinder, new Vector3(6f, 0.2f, 4f), new Vector3(2.6f, 0.25f, 2.6f), new Color(0.23f, 0.1f, 0.25f));
            CreatePrimitive("NexusObelisk", PrimitiveType.Cube, new Vector3(0f, 2.5f, 10f), new Vector3(2f, 5f, 1.2f), new Color(0.12f, 0.08f, 0.07f));
            CreatePrimitive("NexusObeliskCap", PrimitiveType.Cube, new Vector3(0f, 5.5f, 10f), new Vector3(2.7f, 0.3f, 1.8f), UiFactory.Gold);
        }

        private void CreatePrimitive(string name, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            var objectRoot = GameObject.CreatePrimitive(type);
            objectRoot.name = name;
            objectRoot.transform.SetParent(worldRoot);
            objectRoot.transform.position = position;
            objectRoot.transform.localScale = scale;
            var material = objectRoot.GetComponent<Renderer>().material;
            material.color = color;
        }

        private static Color UiColor(Color color)
        {
            return new Color(color.r, color.g, color.b, 1f);
        }
    }
}