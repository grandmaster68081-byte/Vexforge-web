using System.Collections;
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
        private bool subscribed;
        private bool ready;
        private bool routeBounce;

        public void Initialize(VexforgeApp host, VexforgeTier1BattleGate gate, VexforgeTier1TutorialDirector tutorialDirector, BattlePresentationDirector battleDirector, VexforgeTier1AssetRegistry assets)
        {
            app=host;battleGate=gate;tutorial=tutorialDirector;canonicalBattle=battleDirector;
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
                subscribed=true;
            }
            StartCoroutine(WaitForBattleAndApply());
        }

        public void InitializeCanonicalBattle(BattlePresentationDirector director)
        {
            canonicalBattle=director;
            if(ready)Apply(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);
        }

        private IEnumerator WaitForBattleAndApply()
        {
            for(var i=0;i<600;i++)
            {
                if(canonicalBattle==null)
                {
                    var directors=FindObjectsByType<BattlePresentationDirector>(FindObjectsInactive.Include,FindObjectsSortMode.None);
                    for(var d=0;d<directors.Length;d++)
                        if(directors[d]!=null&&directors[d].IsInitialized){canonicalBattle=directors[d];break;}
                }
                if(canonicalBattle!=null&&canonicalBattle.IsInitialized)break;
                yield return null;
            }
            ready=true;
            Apply(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);
        }

        private void HandleAuth(AuthState state)
        {
            if(state!=AuthState.Authenticated)
            {
                if(battleGate!=null)battleGate.HandleSignedOut();
                if(rooms!=null)rooms.Hide();
                if(chrome!=null)chrome.Render(GameRoute.Nexus);
                if(navRail!=null)navRail.Hide();
                if(legacyFrame!=null)legacyFrame.gameObject.SetActive(false);
                if(canonicalBattle!=null)canonicalBattle.StopAndHide();
                return;
            }
            Apply(app.Navigation.CurrentRoute);
        }

        private void HandleRoute(GameRoute route){Apply(route);}

        private void Apply(GameRoute route)
        {
            if(app==null||app.Session==null||!app.Session.IsAuthenticated)
            {
                if(battleGate!=null)battleGate.Hide();
                if(rooms!=null)rooms.Hide();
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
            if(route==GameRoute.Battle)
            {
                if(rooms!=null)rooms.Hide();
                if(tutorial!=null&&!(battleGate!=null&&battleGate.IsBattleActive))tutorial.Hide();
                if(canonicalBattle!=null&&canonicalBattle.IsInitialized)canonicalBattle.SetVisible(true);
                if(battleGate!=null)battleGate.Show();
            }
            else
            {
                if(battleGate!=null)battleGate.Hide();
                if(canonicalBattle!=null)canonicalBattle.StopAndHide();
                if(route==GameRoute.Nexus||route==GameRoute.Missions||route==GameRoute.Economy)
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
            }
        }
    }
}
