#if UNITY_EDITOR
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using Vexforge.Presentation.Editor;

namespace Vexforge.Presentation.Editor
{
    public sealed class VexforgeR5CloudBuildGate : IPreprocessBuildWithReport
    {
        public int callbackOrder => 0;

        public void OnPreprocessBuild(BuildReport report)
        {
            PreExport();
        }

        public static void PreExport()
        {
            Debug.Log("VEXFORGE R5 CLOUD EDITOR GATE: START");
            VexforgeR5FoundationGate.ExecuteBatch();
            Debug.Log("VEXFORGE R5 CLOUD EDITOR GATE: PASS");
        }
    }
}
#endif