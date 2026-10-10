using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Removes the legacy administrative chrome while preserving the functional route controls.
    /// </summary>
    public sealed class VexforgeTier1LegacyHudSuppressor : MonoBehaviour
    {
        private VexforgeApp app;
        private float nextScan;

        public void Initialize(VexforgeApp host) { app=host; }

        private void LateUpdate()
        {
            if (app==null||Time.unscaledTime<nextScan)return;
            nextScan=Time.unscaledTime+.08f;
            var canvas=GameObject.Find("VexforgeCanvas");
            if(canvas==null)return;
            var root=canvas.transform.Find("AlphaHudRoot");
            if(root==null)return;
            var authenticated=app.Session!=null&&app.Session.IsAuthenticated;
            if(!authenticated){root.gameObject.SetActive(true);return;}
            var route=app.Navigation.CurrentRoute;
            var tier1OwnsSurface=VexforgeTier1RouteOwnership.Owns(route);
            root.gameObject.SetActive(true);
            if(tier1OwnsSurface){root.gameObject.SetActive(false);return;}
            SuppressChromeOnly(root);
        }

        private static void SuppressChromeOnly(Transform root)
        {
            for(var i=0;i<root.childCount;i++)
            {
                var child=root.GetChild(i);
                if(child==null)continue;
                var name=child.name??string.Empty;
                if(name=="TopBar"||name.StartsWith("Ribbon_",System.StringComparison.OrdinalIgnoreCase))
                {child.gameObject.SetActive(false);continue;}
                var text=child.GetComponent<Text>();
                if(text==null)continue;
                var value=text.text??string.Empty;
                if(value.StartsWith("TOCA ",System.StringComparison.OrdinalIgnoreCase)||
                   value.StartsWith("DESLIZA ",System.StringComparison.OrdinalIgnoreCase)||
                   value.StartsWith("LA VALIDACIÓN",System.StringComparison.OrdinalIgnoreCase)||
                   value.StartsWith("INTRODUCE EL OPONENTE",System.StringComparison.OrdinalIgnoreCase)||
                   value.StartsWith("LOS CONTRATOS",System.StringComparison.OrdinalIgnoreCase))
                    child.gameObject.SetActive(false);
            }
        }
    }
}
