using System.Collections;
using UnityEngine;
using Vexforge.Core;
using Vexforge.Presentation;
using Vexforge.UI;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1Bootstrap : MonoBehaviour
    {
        private static bool installed;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetInstallationState() { installed = false; }
        private VexforgeTier1AssetRegistry assets;
        private VexforgeTier1BattleGate gate;
        private VexforgeTier1TutorialDirector tutorial;
        private VexforgeTier1RouteSurface surface;
        private BattlePresentationDirector canonicalBattle;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Install()
        {
            if (installed) return;
            installed = true;
            var go=new GameObject("VexforgeTier1Bootstrap");
            DontDestroyOnLoad(go);
            go.AddComponent<VexforgeTier1Bootstrap>();
        }

        private IEnumerator Start()
        {
            while(VexforgeApp.Instance==null)yield return null;
            var app=VexforgeApp.Instance;
            while(!app.IsInitialized)yield return null;
            yield return new WaitUntil(()=>Camera.main!=null);
            Build(app);
            yield return BindCanonicalPresentation(app);
        }

        private void Build(VexforgeApp app)
        {
            if(surface!=null)return;
            assets=new VexforgeTier1AssetRegistry();assets.Initialize();
            gameObject.AddComponent<VexforgeTier1QualityDirector>().Initialize();
            gameObject.AddComponent<VexforgeTier1VisualFoundation>().Initialize();
            gameObject.AddComponent<VexforgeTier1AudioDirector>().Initialize();
            var cinematic=gameObject.AddComponent<VexforgeTier1CinematicDirector>();cinematic.Initialize(Camera.main);
            var vfx=gameObject.AddComponent<VexforgeTier1VfxDirector>();vfx.Initialize(transform);
            gameObject.AddComponent<VexforgeTier1LegacyHudSuppressor>().Initialize(app);
            gameObject.AddComponent<VexforgeTier1NavigationRail>().Initialize(app);
            gate=gameObject.AddComponent<VexforgeTier1BattleGate>();gate.Initialize(app,null,assets);
            tutorial=gameObject.AddComponent<VexforgeTier1TutorialDirector>();tutorial.Initialize(app,assets);tutorial.BindBattleGate(gate);
            surface=gameObject.AddComponent<VexforgeTier1RouteSurface>();surface.Initialize(app,gate,tutorial,null,assets);
            gameObject.AddComponent<VexforgeTier1RoomOrnamentDirector>().Initialize(app,assets);
            app.Session.StateChanged+=OnAuth;
        }

        private IEnumerator BindCanonicalPresentation(VexforgeApp app)
        {
            BattlePresentationDirector director=null;
            VexforgeBattlefieldStage stage=null;
            for(var i=0;i<600;i++)
            {
                var shells=FindObjectsByType<GameShellController>(FindObjectsInactive.Include,FindObjectsSortMode.None);
                for(var j=0;j<shells.Length;j++)
                {
                    if(shells[j]==null)continue;
                    var candidate=shells[j].CanonicalBattlePresentation;
                    if(candidate==null||!candidate.isActiveAndEnabled||!candidate.IsInitialized)continue;
                    var candidateStage=candidate.GetComponentInChildren<VexforgeBattlefieldStage>(true);
                    if(candidateStage!=null){director=candidate;stage=candidateStage;break;}
                }
                if(director==null)
                {
                    var directors=FindObjectsByType<BattlePresentationDirector>(FindObjectsInactive.Exclude,FindObjectsSortMode.None);
                    for(var j=0;j<directors.Length;j++)
                    {
                        if(directors[j]==null||!directors[j].isActiveAndEnabled||!directors[j].IsInitialized)continue;
                        var candidateStage=directors[j].GetComponentInChildren<VexforgeBattlefieldStage>(true);
                        if(candidateStage!=null){director=directors[j];stage=candidateStage;break;}
                    }
                }
                if(director!=null&&stage!=null)break;
                yield return null;
            }
            if(director==null||stage==null)
            {
                Debug.LogWarning("VEXFORGE Tier1: canonical battle presentation was not discoverable within the startup window. No substitute combat engine is created.");
                return;
            }
            canonicalBattle=director;
            if(gate!=null)gate.BindCanonicalBattle(director);
            if(surface!=null)surface.InitializeCanonicalBattle(director);

            var cinematic=GetComponent<VexforgeTier1CinematicDirector>();if(cinematic!=null)cinematic.Bind(director);
            var vfx=GetComponent<VexforgeTier1VfxDirector>();if(vfx!=null)vfx.Bind(director);
            var audio=GetComponent<VexforgeTier1AudioDirector>();if(audio!=null)audio.Bind(director);

            var polish=gameObject.AddComponent<VexforgeTier1CanonicalBattlefieldPolish>();polish.Initialize(director,stage,assets);
            var encounter=gameObject.AddComponent<VexforgeTier1EncounterPresentationDirector>();encounter.Initialize(director,stage);
            var cardImmersion=gameObject.AddComponent<VexforgeTier1CardImmersionDirector>();cardImmersion.Initialize(director,FindCanonicalArtResolver());
            var packReveal=gameObject.AddComponent<VexforgeTier1PackRevealDirector>();packReveal.Initialize(assets);
            if(app.Session.IsAuthenticated&&tutorial!=null)tutorial.TryStart();
        }

        private static VexforgeCardArtResolver FindCanonicalArtResolver()
        {
            var shells=FindObjectsByType<GameShellController>(FindObjectsInactive.Include,FindObjectsSortMode.None);
            for(var i=0;i<shells.Length;i++)
            {
                var value=shells[i].CanonicalArtResolver;
                if(value!=null)return value;
            }
            return null;
        }

        private void OnAuth(Vexforge.Session.AuthState state)
        {
            if(state==Vexforge.Session.AuthState.Authenticated)
                if(tutorial!=null)tutorial.TryStart();
        }

        private void OnDestroy()
        {
            if(VexforgeApp.Instance!=null&&VexforgeApp.Instance.Session!=null)VexforgeApp.Instance.Session.StateChanged-=OnAuth;
        }
    }
}
