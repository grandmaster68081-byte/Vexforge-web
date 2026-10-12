using UnityEngine;
using Vexforge.Core;
using Vexforge.Presentation;
using Vexforge.Session;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1RouteSurface : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1BattleGate battleGate;
        private VexforgeTier1TutorialDirector tutorial;
        private VexforgeTier1RouteChrome chrome;
        private VexforgeTier1NavigationRail navRail;
        private VexforgeTier1DiegeticRoomDirector rooms;
        private VexforgeTier1LegacyRouteFrame legacyFrame;
        private BattlePresentationDirector canonicalBattle;
        private VexforgeTier1PackRevealDirector packReveal;
        private VexforgeTier1WorldAtlasDirector worldAtlas;
        private VexforgeTier1Bootstrap presentationReadiness;
        private bool subscribed;
        private bool routeBounce;

        public void Initialize(
            VexforgeApp host,
            VexforgeTier1BattleGate gate,
            VexforgeTier1TutorialDirector tutorialDirector,
            BattlePresentationDirector battleDirector,
            VexforgeTier1AssetRegistry assets,
            VexforgeTier1Bootstrap readiness)
        {
            app=host;battleGate=gate;tutorial=tutorialDirector;canonicalBattle=battleDirector;presentationReadiness=readiness;
            rooms=gameObject.GetComponent<VexforgeTier1DiegeticRoomDirector>();
            if(rooms==null)rooms=gameObject.AddComponent<VexforgeTier1DiegeticRoomDirector>();
            rooms.Initialize(app,assets);
            navRail=gameObject.GetComponent<VexforgeTier1NavigationRail>();
            if(navRail==null)navRail=gameObject.AddComponent<VexforgeTier1NavigationRail>();
            navRail.Initialize(app);
            chrome=gameObject.GetComponent<VexforgeTier1RouteChrome>();
            if(chrome==null)chrome=gameObject.AddComponent<VexforgeTier1RouteChrome>();
            chrome.Initialize(app);
            legacyFrame=gameObject.GetComponent<VexforgeTier1LegacyRouteFrame>();
            if(legacyFrame==null)legacyFrame=gameObject.AddComponent<VexforgeTier1LegacyRouteFrame>();
            legacyFrame.Initialize(app,assets);
            if(app!=null&&!subscribed)
            {
                app.Navigation.RouteChanged+=HandleRoute;
                app.Session.StateChanged+=HandleAuth;
                if(presentationReadiness!=null)
                    presentationReadiness.PresentationReadinessChanged+=HandlePresentationReadinessChanged;
                subscribed=true;
            }
            Apply(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);
        }

        public void InitializeCanonicalBattle(BattlePresentationDirector director)
        {
            canonicalBattle=director;
            if(presentationReadiness!=null&&presentationReadiness.IsPresentationReady)
                Apply(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);
        }

        public void BindPackReveal(VexforgeTier1PackRevealDirector director)
        {
            packReveal=director;
            if(rooms!=null)rooms.BindPackReveal(director);
        }

        public void BindWorldAtlas(VexforgeTier1WorldAtlasDirector director)
        {
            worldAtlas=director;
        }

        private void HandlePresentationReadinessChanged()
        {
            canonicalBattle=presentationReadiness!=null&&presentationReadiness.IsPresentationReady
                ?presentationReadiness.CanonicalBattle
                :null;
            if(app!=null)
                Apply(app.Navigation.CurrentRoute);
        }

        private void HandleAuth(AuthState state)
        {
            if(state!=AuthState.Authenticated)
            {
                if(battleGate!=null)battleGate.HandleSignedOut();
                if(rooms!=null)rooms.Hide();
                if(packReveal!=null)packReveal.ResetSessionState();
                if(worldAtlas!=null)worldAtlas.Hide();
                if(chrome!=null)chrome.Render(GameRoute.Nexus);
                if(navRail!=null)navRail.Hide();
                if(legacyFrame!=null)legacyFrame.gameObject.SetActive(false);
                if(canonicalBattle!=null)canonicalBattle.StopAndHide();
                return;
            }
            Apply(app.Navigation.CurrentRoute);
        }

        private void HandleRoute(GameRoute route)
        {
            if(route==GameRoute.Battle&&presentationReadiness!=null&&
                !presentationReadiness.IsPresentationReady)
                presentationReadiness.RetryPresentationBinding("ruta Battle solicitada");
            Apply(route);
        }

        private void Apply(GameRoute route)
        {
            if(app==null||app.Session==null||!app.Session.IsAuthenticated)
            {
                if(battleGate!=null)battleGate.Hide();
                if(rooms!=null)rooms.Hide();
                if(packReveal!=null)packReveal.Hide();
                if(worldAtlas!=null)worldAtlas.Hide();
                if(chrome!=null)chrome.Render(GameRoute.Nexus);
                if(navRail!=null)navRail.Hide();
                if(legacyFrame!=null)legacyFrame.gameObject.SetActive(false);
                return;
            }

            if(battleGate!=null&&battleGate.IsNavigationLocked&&route!=GameRoute.Battle)
            {
                navRail.SetBattleLocked(true);
                if(!routeBounce)
                {
                    routeBounce=true;
                    app.Navigation.Navigate(GameRoute.Battle);
                    routeBounce=false;
                }
                return;
            }
            navRail.SetBattleLocked(battleGate!=null&&battleGate.IsNavigationLocked);
            if(chrome!=null)chrome.Render(route);
            if(navRail!=null)navRail.Show(route);
            if(route!=GameRoute.Economy&&packReveal!=null)packReveal.Hide();
            if(route!=GameRoute.World&&worldAtlas!=null)worldAtlas.Hide();
            if(route==GameRoute.Battle)
            {
                if(rooms!=null)rooms.Hide();
                if(tutorial!=null&&!(battleGate!=null&&battleGate.IsBattleActive))tutorial.Hide();
                if(presentationReadiness==null||!presentationReadiness.IsPresentationReady)
                {
                    if(canonicalBattle!=null)canonicalBattle.StopAndHide();
                    if(battleGate!=null)battleGate.Show();
                    return;
                }
                canonicalBattle=presentationReadiness.CanonicalBattle;
                if(canonicalBattle!=null)canonicalBattle.SetVisible(true);
                if(battleGate!=null)battleGate.Show();
            }
            else
            {
                if(battleGate!=null)battleGate.Hide();
                if(canonicalBattle!=null)canonicalBattle.StopAndHide();
                if(route==GameRoute.World)
                {
                    if(rooms!=null)rooms.Hide();
                    if(worldAtlas!=null)worldAtlas.Show();
                }
                else if(route==GameRoute.Nexus||route==GameRoute.Missions||route==GameRoute.Economy)
                {
                    if(rooms!=null)rooms.Show(route);
                }
                else if(rooms!=null)rooms.Hide();
            }
        }

        private void OnDestroy()
        {
            if(app!=null&&subscribed)
            {
                app.Navigation.RouteChanged-=HandleRoute;
                app.Session.StateChanged-=HandleAuth;
                if(presentationReadiness!=null)
                    presentationReadiness.PresentationReadinessChanged-=HandlePresentationReadinessChanged;
            }
        }
    }
}
