using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Shared visual grade for the VEXFORGE runtime. It uses only URP facilities already present in the project.
    /// No gameplay, UI state or backend value is changed here.
    /// </summary>
    public sealed class VexforgeTier1VisualFoundation : MonoBehaviour
    {
        private Volume volume;
        private VolumeProfile profile;
        private Light keyLight;
        private bool initialized;

        public void Initialize()
        {
            if (initialized) return;
            initialized = true;
            ConfigureCamera();
            ConfigurePostFx();
            ConfigureKeyLight();
        }

        private void ConfigureCamera()
        {
            var camera = Camera.main;
            if (camera == null) return;
            var data = camera.GetComponent<UniversalAdditionalCameraData>();
            if (data == null) data = camera.gameObject.AddComponent<UniversalAdditionalCameraData>();
            data.renderPostProcessing = true;
        }

        private void ConfigurePostFx()
        {
            var quality = DetectQuality();
            volume = gameObject.GetComponent<Volume>();
            if (volume == null) volume = gameObject.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.priority = 40f;
            profile = ScriptableObject.CreateInstance<VolumeProfile>();
            profile.name = "VEXFORGE_Tier1_RuntimeGrade";
            volume.profile = profile;

            var bloom = profile.Add<Bloom>();
            bloom.active = quality != VexforgeTier1Quality.Mobile;
            bloom.intensity.Override(quality == VexforgeTier1Quality.Cinematic ? .24f : .14f);
            bloom.threshold.Override(.92f);
            bloom.scatter.Override(.62f);

            var vignette = profile.Add<Vignette>();
            vignette.active = true;
            vignette.intensity.Override(quality == VexforgeTier1Quality.Cinematic ? .16f : .11f);
            vignette.smoothness.Override(.72f);

            var grade = profile.Add<ColorAdjustments>();
            grade.active = true;
            grade.contrast.Override(quality == VexforgeTier1Quality.Cinematic ? 10f : 6f);
            grade.saturation.Override(-4f);
            grade.postExposure.Override(0f);

            var tone = profile.Add<Tonemapping>();
            tone.active = quality != VexforgeTier1Quality.Mobile;
            tone.mode.Override(TonemappingMode.Neutral);
        }

        private void ConfigureKeyLight()
        {
            if (FindObjectsByType<Light>(FindObjectsInactive.Include, FindObjectsSortMode.None).Length > 0) return;
            var go = new GameObject("VexforgeTier1KeyLight");
            go.transform.SetParent(transform, false);
            go.transform.rotation = Quaternion.Euler(48f, -24f, 0f);
            keyLight = go.AddComponent<Light>();
            keyLight.type = LightType.Directional;
            keyLight.intensity = .42f;
            keyLight.color = new Color(.72f,.72f,.68f,1f);
            keyLight.shadows = LightShadows.Soft;
        }

        private static VexforgeTier1Quality DetectQuality()
        {
            var mem=SystemInfo.graphicsMemorySize;
            var cores=SystemInfo.processorCount;
            var shader=SystemInfo.graphicsShaderLevel;
            var maxRes=Mathf.Max(Screen.width,Screen.height);
            if(mem>=4096&&cores>=8&&shader>=45&&maxRes>=1800)return VexforgeTier1Quality.Cinematic;
            if(mem>=2048&&cores>=6&&shader>=35&&maxRes>=1400)return VexforgeTier1Quality.Balanced;
            return VexforgeTier1Quality.Mobile;
        }

        private void OnDestroy()
        {
            if (volume != null) volume.profile = null;
            if (profile != null) Destroy(profile);
            if (keyLight != null) Destroy(keyLight.gameObject);
        }
    }
}
