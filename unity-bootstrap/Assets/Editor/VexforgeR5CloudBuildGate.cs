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
            Debug.Log("VEXFORGE R5 CLOUD BUILD VALIDATION: START");
            VexforgeR5FoundationGate.ValidateOrThrow();
            Debug.Log("VEXFORGE R5 CLOUD BUILD VALIDATION: PASS");
        }
    }
}
#endif