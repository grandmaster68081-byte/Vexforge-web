using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Vexforge.Presentation
{
    public static class VexforgeRenderBootstrap
    {
        private const string RuntimeUrpResource = "Vexforge/VexforgeUrp";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void EnsureUrp()
        {
            var asset = Resources.Load<UniversalRenderPipelineAsset>(RuntimeUrpResource);

            if (asset != null)
            {
                if (GraphicsSettings.defaultRenderPipeline == null)
                    GraphicsSettings.defaultRenderPipeline = asset;

                if (QualitySettings.renderPipeline == null)
                    QualitySettings.renderPipeline = asset;
            }

            var current = GraphicsSettings.currentRenderPipeline as UniversalRenderPipelineAsset;
            if (current == null)
            {
                Debug.LogError(
                    "VEXFORGE requires an active Universal Render Pipeline asset. "
                    + "Run VEXFORGE/Presentation/Ensure R5 Assets in Unity Editor.");
                return;
            }

            if (!current.useSRPBatcher)
            {
                Debug.LogError(
                    "VEXFORGE requires SRP Batcher enabled on the active URP asset.");
            }
        }
    }
}
