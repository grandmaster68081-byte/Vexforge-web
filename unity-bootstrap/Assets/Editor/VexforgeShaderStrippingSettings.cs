#if UNITY_EDITOR
using System;
using System.Reflection;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Vexforge.Editor
{
    /// <summary>
    /// Applies the smallest evidence-based URP stripping set for the Android player.
    /// This deliberately leaves runtime-created post-processing and runtime keywords
    /// available instead of trading visual correctness for a lower counter.
    /// </summary>
    public static class VexforgeShaderStrippingSettings
    {
        private const string GlobalSettingsTypeName =
            "UnityEngine.Rendering.Universal.UniversalRenderPipelineGlobalSettings";

        public static bool IsBaselineProfile =>
            string.Equals(
                Environment.GetEnvironmentVariable("VEXFORGE_SHADER_PROFILE"),
                "baseline",
                StringComparison.OrdinalIgnoreCase);

        public static void ApplyForAndroid()
        {
            if (IsBaselineProfile)
            {
                Debug.Log(
                    "VEXFORGE shader stripping: baseline profile selected; " +
                    "safe optimization settings are not applied.");
                return;
            }

            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android)
            {
                Debug.Log(
                    "VEXFORGE shader stripping: skipped because the active build target is " +
                    EditorUserBuildSettings.activeBuildTarget + ".");
                return;
            }

            EnsureUrpGlobalSettings();

            var coreSettings =
                GraphicsSettings.GetRenderPipelineSettings<ShaderStrippingSetting>();
            var urpSettings =
                GraphicsSettings.GetRenderPipelineSettings<URPShaderStrippingSetting>();

            if (coreSettings == null || urpSettings == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE could not resolve the URP shader stripping settings. " +
                    "The project must use the Unity 6 URP global settings asset.");
            }

            // Safe for the release APK: VEXFORGE does not ship the Rendering Debugger.
            coreSettings.stripRuntimeDebugShaders = true;

            // Keep Unity's feature-aware URP stripping enabled. It preserves variants
            // for enabled features and removes only disabled feature combinations.
            urpSettings.stripUnusedVariants = true;
            urpSettings.stripScreenCoordOverrideVariants = true;

            // VEXFORGE creates VolumeProfile and Volume components at runtime. Unity's
            // post-processing stripper only sees project assets, so keep this disabled.
            urpSettings.stripUnusedPostProcessingVariants = false;

            // Keep variant export enabled while profiling so inventory evidence remains
            // available for the baseline/optimized comparison.
            coreSettings.exportShaderVariants = true;
            PlayerSettings.strictShaderVariantMatching = true;

            AssetDatabase.SaveAssets();

            Debug.Log(
                "VEXFORGE Android shader stripping applied: " +
                "stripUnusedVariants=ON, " +
                "stripScreenCoordOverrideVariants=ON, " +
                "stripRuntimeDebugShaders=ON, " +
                "stripUnusedPostProcessingVariants=OFF, " +
                "strictShaderVariantMatching=ON.");
        }

        private static void EnsureUrpGlobalSettings()
        {
            var globalSettingsType =
                typeof(UniversalRenderPipelineAsset).Assembly.GetType(
                    GlobalSettingsTypeName);

            if (globalSettingsType == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE could not find Unity's URP global settings type.");
            }

            var ensureMethod = globalSettingsType.GetMethod(
                "Ensure",
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);

            if (ensureMethod == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE could not find Unity's URP global settings initializer.");
            }

            var globalSettings = ensureMethod.Invoke(null, new object[] { true })
                as UnityEngine.Object;

            if (globalSettings == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE could not create or load the URP global settings asset.");
            }
        }
    }

    internal sealed class VexforgeShaderStrippingBuildGate : IPreprocessBuildWithReport
    {
        public int callbackOrder => -1000;

        public void OnPreprocessBuild(BuildReport report)
        {
            if (report.summary.platform == BuildTarget.Android)
                VexforgeShaderStrippingSettings.ApplyForAndroid();
        }
    }
}
#endif