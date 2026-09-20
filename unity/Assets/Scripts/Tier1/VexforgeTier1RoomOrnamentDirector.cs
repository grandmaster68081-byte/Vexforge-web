using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Adds a small recurring VEXFORGE ornament to secondary rooms so missing bespoke item art never becomes a blank UI slot.
    /// It is decorative only and never represents an actual reward/item.
    /// </summary>
    public sealed class VexforgeTier1RoomOrnamentDirector : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private GameRoute lastRoute;
        private float scan;
        private bool built;
        private GameObject currentOrnament;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            app=host;assets=registry;
            lastRoute=GameRoute.Boot;
        }

        private void Update()
        {
            if(app==null||app.Session==null||!app.Session.IsAuthenticated)return;
            if(Time.unscaledTime<scan)return;
            scan=Time.unscaledTime+.35f;
            var route=app.Navigation.CurrentRoute;
            if(route==lastRoute&&built&&currentOrnament!=null)return;
            lastRoute=route;
            ClearOrnament();
            built=false;
            if(route==GameRoute.Nexus||route==GameRoute.Missions||route==GameRoute.Economy)BuildForRoute(route);
        }

        private void BuildForRoute(GameRoute route)
        {
            var canvas=GameObject.Find("VexforgeTier1WorldRooms");
            if(canvas==null)return;
            var root=canvas.transform;
            var ornament=new GameObject("VexforgeTier1RoomSeal",typeof(RectTransform),typeof(RawImage));
            ornament.transform.SetParent(root,false);
            currentOrnament=ornament;
            var rect=ornament.GetComponent<RectTransform>();VexforgeTier1Ui.Anchor(rect,.72f,.70f,.90f,.88f);
            var raw=ornament.GetComponent<RawImage>();raw.texture=assets==null?null:assets.LoadTexture(route==GameRoute.Economy?"VF_REWARD_SIGIL_PREMIUM":"VF_PACK_RELIC","VF_BOSS_SIGIL");raw.color=new Color(1f,1f,1f,.86f);raw.raycastTarget=false;
            built=true;
        }

        private void ClearOrnament()
        {
            if(currentOrnament!=null)Destroy(currentOrnament);
            currentOrnament=null;
        }

        private void OnDestroy(){ClearOrnament();}
    }
}
