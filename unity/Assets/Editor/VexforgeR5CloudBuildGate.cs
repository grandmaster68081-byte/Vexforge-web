#if UNITY_EDITOR
using UnityEngine;
using Vexforge.Presentation.Editor;

namespace Vexforge.Presentation.Editor
{
    public static class VexforgeR5CloudBuildGate
    {
        public static void PreExport()
        {
            Debug.Log("VEXFORGE R5 CLOUD EDITOR GATE: START");
            VexforgeR5FoundationGate.ExecuteBatch();
            Debug.Log("VEXFORGE R5 CLOUD EDITOR GATE: PASS");
        }
    }
}
#endif