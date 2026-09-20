using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Places an authored route environment behind the existing functional Collection/Forge/Profile surfaces.
    /// All imagery is non-interactive, so the canonical controls keep ownership of input.
    /// </summary>
    public sealed class VexforgeTier1LegacyRouteFrame : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private Canvas canvas;
        private Image hero;
        private Text title;
        private Text caption;
        private GameRoute route;
        private bool initialized;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            if (initialized) return;
            initialized = true;
            app = host;
            assets = registry;
            Build();
            if (app != null && app.Navigation != null) app.Navigation.RouteChanged += OnRoute;
            Render(app == null ? GameRoute.Nexus : app.Navigation.CurrentRoute);
        }

        private void Build()
        {
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1LegacyRouteFrame", -20, 5.6f);
            var background = VexforgeTier1Ui.Panel(canvas.transform,"Background",new Color(.006f,.008f,.013f,.96f));
            VexforgeTier1Ui.Full(background.rectTransform); background.raycastTarget=false;
            hero = VexforgeTier1Ui.Panel(canvas.transform,"Hero",new Color(.006f,.008f,.013f,1f));
            VexforgeTier1Ui.Anchor(hero.rectTransform,.018f,.08f,.982f,.965f); hero.raycastTarget=false;
            var veil = VexforgeTier1Ui.Panel(hero.transform,"Veil",new Color(.004f,.006f,.010f,.30f));
            VexforgeTier1Ui.Full(veil.rectTransform); veil.raycastTarget=false;
            var frame = VexforgeTier1Ui.Panel(canvas.transform,"Frame",new Color(.14f,.10f,.065f,.28f));
            VexforgeTier1Ui.Anchor(frame.rectTransform,.03f,.095f,.97f,.95f); frame.raycastTarget=false;
            title = VexforgeTier1Ui.Label(canvas.transform,"Title","",24,VexforgeTier1Ui.Gold,TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform,.18f,.875f,.82f,.925f);
            caption = VexforgeTier1Ui.Label(canvas.transform,"Caption","",10,VexforgeTier1Ui.Muted,TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(caption.rectTransform,.15f,.835f,.85f,.865f);
        }

        private void OnRoute(GameRoute next) { Render(next); }

        private void Render(GameRoute next)
        {
            route = next;
            var visible = next == GameRoute.Collection || next == GameRoute.Deck || next == GameRoute.Profile;
            if (canvas != null) canvas.gameObject.SetActive(visible);
            if (!visible) return;
            string art;
            switch (next)
            {
                case GameRoute.Collection: art="VF_ARCHIVE_SANCTUM_HERO"; title.text="ARCHIVE"; caption.text="EL SANTUARIO DE LAS CARTAS"; break;
                case GameRoute.Deck: art="VF_FORGE_CHAMBER_HERO"; title.text="FORGE"; caption.text="LA FORMACIÓN QUE LLEVARÁS AL BATTLEFIELD"; break;
                default: art="VF_NEXUS_CITADEL_HERO"; title.text="HALL"; caption.text="IDENTIDAD · TRAYECTORIA · ALIADOS"; break;
            }
            SetHero(art);
        }

        private void SetHero(string key)
        {
            if (hero == null || assets == null) return;
            var tex=assets.LoadTexture(key,"VF_NEXUS_CITADEL_HERO");
            if(tex==null)return;
            var old=hero.sprite;
            hero.color=Color.white;
            hero.sprite=Sprite.Create(tex,new Rect(0,0,tex.width,tex.height),new Vector2(.5f,.5f),100f);
            hero.preserveAspect=false;
            hero.type=Image.Type.Simple;
            if(old!=null)Destroy(old);
        }

        private void OnDestroy()
        {
            if (app != null && app.Navigation != null) app.Navigation.RouteChanged -= OnRoute;
            if (hero != null && hero.sprite != null) Destroy(hero.sprite);
        }
    }
}
