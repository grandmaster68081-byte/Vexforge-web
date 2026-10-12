using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using Vexforge.Core;
using Vexforge.Presentation;
using Vexforge.UI;

namespace Vexforge.Tier1
{
    public enum VexforgeTier1PresentationState
    {
        Uninitialized,
        Initializing,
        Ready,
        FailedRetryable
    }

    public sealed class VexforgeTier1Bootstrap : MonoBehaviour
    {
        private const int PresentationBindingTimeoutFrames = 600;
        private const float ReadyValidationIntervalSeconds = .25f;
        private const float RetryIntervalSeconds = 2f;
        private static bool installed;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetInstallationState() { installed = false; }
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private VexforgeTier1BattleGate gate;
        private VexforgeTier1TurnCombatGate turnCombatGate;
        private VexforgeTier1TutorialDirector tutorial;
        private VexforgeTier1RouteSurface surface;
        private BattlePresentationDirector canonicalBattle;
        private VexforgeBattlefieldStage canonicalStage;
        private VexforgeCardArtResolver canonicalArtResolver;
        private Camera canonicalCamera;
        private VexforgeTier1PackRevealDirector packReveal;
        private VexforgeTier1WorldAtlasDirector worldAtlas;
        private Coroutine presentationBinding;
        private float nextPresentationValidation;
        private float nextPresentationRetry;
        private float nextReadinessWarning;
        private int presentationGeneration;

        public VexforgeTier1PresentationState PresentationState { get; private set; }
        public string PresentationFailure { get; private set; }
        public int PresentationGeneration { get { return presentationGeneration; } }
        public BattlePresentationDirector CanonicalBattle { get { return canonicalBattle; } }
        public VexforgeBattlefieldStage CanonicalBattlefield { get { return canonicalStage; } }
        public VexforgeCardArtResolver CanonicalArtResolver { get { return canonicalArtResolver; } }
        public Camera CanonicalCamera { get { return canonicalCamera; } }
        public bool IsPresentationReady
        {
            get
            {
                string ignored;
                return PresentationState == VexforgeTier1PresentationState.Ready &&
                    ValidatePublishedPresentation(out ignored);
            }
        }

        public event Action PresentationReadinessChanged;

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
            LockUprightPortrait();
            while(VexforgeApp.Instance==null)yield return null;
            app=VexforgeApp.Instance;
            while(!app.IsInitialized)yield return null;
            Build(app);
            SceneManager.activeSceneChanged += OnActiveSceneChanged;
            RetryPresentationBinding("startup");
            if(app.Session.IsAuthenticated&&tutorial!=null)tutorial.TryStart();
        }

        private static void LockUprightPortrait()
        {
            Screen.autorotateToPortrait=true;
            Screen.autorotateToPortraitUpsideDown=false;
            Screen.autorotateToLandscapeLeft=false;
            Screen.autorotateToLandscapeRight=false;
            Screen.orientation=ScreenOrientation.Portrait;
        }

        private void Build(VexforgeApp app)
        {
            if(surface!=null)return;
            assets=new VexforgeTier1AssetRegistry();assets.Initialize();
            gameObject.AddComponent<VexforgeTier1QualityDirector>().Initialize();
            gameObject.AddComponent<VexforgeTier1VisualFoundation>().Initialize();
            gameObject.AddComponent<VexforgeTier1AudioDirector>().Initialize();
            gameObject.AddComponent<VexforgeHapticsService>();
            var cinematic=gameObject.AddComponent<VexforgeTier1CinematicDirector>();cinematic.Initialize(Camera.main);
            var vfx=gameObject.AddComponent<VexforgeTier1VfxDirector>();vfx.Initialize(transform);
            gameObject.AddComponent<VexforgeTier1LegacyHudSuppressor>().Initialize(app);
            gameObject.AddComponent<VexforgeTier1NavigationRail>().Initialize(app);
            packReveal=gameObject.AddComponent<VexforgeTier1PackRevealDirector>();packReveal.Initialize(app,assets);
            worldAtlas=gameObject.AddComponent<VexforgeTier1WorldAtlasDirector>();worldAtlas.Initialize(app,assets);
            gate=gameObject.AddComponent<VexforgeTier1BattleGate>();gate.Initialize(app,null,assets,this);
            turnCombatGate=gameObject.AddComponent<VexforgeTier1TurnCombatGate>();turnCombatGate.Initialize(app,gate);
            gate.BindTurnCombatGate(turnCombatGate);
            tutorial=gameObject.AddComponent<VexforgeTier1TutorialDirector>();tutorial.Initialize(app,assets);tutorial.BindBattleGate(gate);tutorial.BindPresentationReadiness(this);
            surface=gameObject.AddComponent<VexforgeTier1RouteSurface>();surface.Initialize(app,gate,tutorial,null,assets,this);
            surface.BindPackReveal(packReveal);
            surface.BindWorldAtlas(worldAtlas);
            gameObject.AddComponent<VexforgeTier1RoomOrnamentDirector>().Initialize(app,assets);
            app.Session.StateChanged+=OnAuth;
        }

        public void RetryPresentationBinding(string trigger)
        {
            if(app==null||!gameObject.activeInHierarchy)return;

            string invalidReason;
            if(PresentationState==VexforgeTier1PresentationState.Ready&&ValidatePublishedPresentation(out invalidReason))
                return;

            if(PresentationState==VexforgeTier1PresentationState.Ready)
            {
                ClearPublishedPresentation();
                SetPresentationState(VexforgeTier1PresentationState.FailedRetryable,invalidReason);
            }

            if(presentationBinding!=null)return;
            presentationGeneration++;
            SetPresentationState(
                VexforgeTier1PresentationState.Initializing,
                "Esperando la presentación canónica ("+SafeTrigger(trigger)+").");
            presentationBinding=StartCoroutine(BindCanonicalPresentation(presentationGeneration,SafeTrigger(trigger)));
        }

        private IEnumerator BindCanonicalPresentation(int generation,string trigger)
        {
            yield return null;
            var startTime=Time.realtimeSinceStartup;
            var shellCount=0;
            var lastFailure="GameShellController no está disponible.";

            for(var frame=0;frame<PresentationBindingTimeoutFrames;frame++)
            {
                if(generation!=presentationGeneration)
                {
                    presentationBinding=null;
                    yield break;
                }

                var shells=FindObjectsByType<GameShellController>(FindObjectsInactive.Include,FindObjectsSortMode.None);
                shellCount=shells.Length;
                for(var i=0;i<shells.Length;i++)
                {
                    if(shells[i]==null)continue;
                    BattlePresentationDirector director;
                    VexforgeBattlefieldStage stage;
                    VexforgeCardArtResolver resolver;
                    Camera camera;
                    string reason;
                    if(!shells[i].TryGetCanonicalBattlePresentation(out director,out stage,out resolver,out camera,out reason))
                    {
                        lastFailure=shells[i].name+": "+reason;
                        continue;
                    }

                    try
                    {
                        PublishCanonicalPresentation(director,stage,resolver,camera);
                    }
                    catch(Exception ex)
                    {
                        ClearPublishedPresentation();
                        presentationBinding=null;
                        var failedScene=SceneManager.GetActiveScene();
                        var failure="No se pudieron publicar las referencias canónicas en el frame "+
                            Time.frameCount+" de la escena '"+(failedScene.IsValid()?failedScene.name:"<sin escena activa>")+
                            "': "+ex.GetType().Name+": "+ex.Message;
                        SetPresentationState(VexforgeTier1PresentationState.FailedRetryable,failure);
                        nextPresentationRetry=Time.unscaledTime+RetryIntervalSeconds;
                        LogReadinessFailure(failure);
                        yield break;
                    }
                    presentationBinding=null;
                    nextPresentationValidation=Time.unscaledTime+ReadyValidationIntervalSeconds;
                    SetPresentationState(VexforgeTier1PresentationState.Ready,null);
                    if(app!=null&&app.Session!=null&&app.Session.IsAuthenticated&&tutorial!=null)
                        tutorial.TryStart();
                    yield break;
                }
                if(shellCount==0)lastFailure="No se encontró ningún GameShellController activo en la escena.";
                yield return null;
            }

            presentationBinding=null;
            var activeScene=SceneManager.GetActiveScene();
            var elapsed=Time.realtimeSinceStartup-startTime;
            var failure="No listo: "+lastFailure+" Timeout de "+PresentationBindingTimeoutFrames+
                " frames; frame actual="+Time.frameCount+" ("+elapsed.ToString("0.0")+" s) en la escena '"+
                (activeScene.IsValid()?activeScene.name:"<sin escena activa>")+
                "'; GameShellController encontrados="+shellCount+".";
            SetPresentationState(VexforgeTier1PresentationState.FailedRetryable,failure);
            nextPresentationRetry=Time.unscaledTime+RetryIntervalSeconds;
            LogReadinessFailure(failure);
        }

        private void PublishCanonicalPresentation(
            BattlePresentationDirector director,
            VexforgeBattlefieldStage stage,
            VexforgeCardArtResolver resolver,
            Camera camera)
        {
            canonicalBattle=director;
            canonicalStage=stage;
            canonicalArtResolver=resolver;
            canonicalCamera=camera;
            if(gate!=null)gate.BindCanonicalBattle(director);
            if(surface!=null)surface.InitializeCanonicalBattle(director);

            var cinematic=GetComponent<VexforgeTier1CinematicDirector>();if(cinematic!=null){cinematic.Initialize(camera);cinematic.Bind(director);}
            var vfx=GetComponent<VexforgeTier1VfxDirector>();if(vfx!=null)vfx.Bind(director);
            var audio=GetComponent<VexforgeTier1AudioDirector>();if(audio!=null)audio.Bind(director);
            var haptics=GetComponent<VexforgeHapticsService>();if(haptics!=null)haptics.Bind(director);

            var polish=GetComponent<VexforgeTier1CanonicalBattlefieldPolish>();
            if(polish==null)polish=gameObject.AddComponent<VexforgeTier1CanonicalBattlefieldPolish>();
            polish.Initialize(director,stage,assets);
            var encounter=GetComponent<VexforgeTier1EncounterPresentationDirector>();
            if(encounter==null)encounter=gameObject.AddComponent<VexforgeTier1EncounterPresentationDirector>();
            encounter.Initialize(director,stage);
            var cardImmersion=GetComponent<VexforgeTier1CardImmersionDirector>();
            if(cardImmersion==null)cardImmersion=gameObject.AddComponent<VexforgeTier1CardImmersionDirector>();
            cardImmersion.Initialize(director,resolver);
            if(packReveal!=null)packReveal.BindArtResolver(resolver);
        }

        private bool ValidatePublishedPresentation(out string reason)
        {
            var activeScene=SceneManager.GetActiveScene();
            if(!activeScene.IsValid()||!activeScene.isLoaded)
            {
                reason="No hay una escena activa y cargada.";
                return false;
            }

            if(canonicalBattle==null||!canonicalBattle.isActiveAndEnabled||
                !canonicalBattle.gameObject.activeInHierarchy||canonicalBattle.gameObject.scene!=activeScene||
                !canonicalBattle.IsInitialized)
            {
                reason="El BattlePresentationDirector canónico desapareció, salió de la escena activa o dejó de estar inicializado.";
                return false;
            }

            if(canonicalStage==null||!canonicalStage.IsInitialized||canonicalStage.gameObject.scene!=activeScene)
            {
                reason="El VexforgeBattlefieldStage canónico desapareció o dejó de estar inicializado.";
                return false;
            }

            if(canonicalArtResolver==null||canonicalArtResolver.IsDisposed)
            {
                reason="El resolver canónico de arte de cartas desapareció o está liberado.";
                return false;
            }

            if(canonicalCamera==null||!canonicalCamera.isActiveAndEnabled||
                !canonicalCamera.gameObject.activeInHierarchy||canonicalCamera.gameObject.scene!=activeScene||
                Camera.main!=canonicalCamera)
            {
                reason="La cámara MainCamera de la presentación desapareció o dejó de estar activa.";
                return false;
            }

            reason=null;
            return true;
        }

        private void ClearPublishedPresentation()
        {
            canonicalBattle=null;
            canonicalStage=null;
            canonicalArtResolver=null;
            canonicalCamera=null;
            if(gate!=null)gate.BindCanonicalBattle(null);
            if(surface!=null)surface.InitializeCanonicalBattle(null);
        }

        private void SetPresentationState(VexforgeTier1PresentationState state,string failure)
        {
            var normalizedFailure=state==VexforgeTier1PresentationState.Ready?null:failure;
            if(PresentationState==state&&string.Equals(PresentationFailure,normalizedFailure,StringComparison.Ordinal))
                return;
            PresentationState=state;
            PresentationFailure=normalizedFailure;
            PresentationReadinessChanged?.Invoke();
        }

        private void LogReadinessFailure(string failure)
        {
            if(Time.unscaledTime<nextReadinessWarning)return;
            nextReadinessWarning=Time.unscaledTime+30f;
            Debug.LogWarning("VEXFORGE Tier1 readiness FailedRetryable. "+failure+" "+DescribeDiscoveredObjects());
        }

        private void Update()
        {
            if(PresentationState==VexforgeTier1PresentationState.Ready)
            {
                if(Time.unscaledTime<nextPresentationValidation)return;
                nextPresentationValidation=Time.unscaledTime+ReadyValidationIntervalSeconds;
                string reason;
                if(!ValidatePublishedPresentation(out reason))
                {
                    ClearPublishedPresentation();
                    SetPresentationState(VexforgeTier1PresentationState.FailedRetryable,reason);
                    nextPresentationRetry=Time.unscaledTime+RetryIntervalSeconds;
                }
                return;
            }

            if(PresentationState==VexforgeTier1PresentationState.FailedRetryable&&
                Time.unscaledTime>=nextPresentationRetry&&presentationBinding==null)
                RetryPresentationBinding("reintento automático");
        }

        private void OnActiveSceneChanged(Scene previous,Scene next)
        {
            if(presentationBinding!=null)StopCoroutine(presentationBinding);
            presentationBinding=null;
            presentationGeneration++;
            ClearPublishedPresentation();
            var reason="Cambió la escena activa de '"+(previous.IsValid()?previous.name:"<sin escena>")+
                "' a '"+(next.IsValid()?next.name:"<sin escena>")+"'; revalidando la presentación canónica.";
            SetPresentationState(VexforgeTier1PresentationState.FailedRetryable,reason);
            nextPresentationRetry=Time.unscaledTime;
            RetryPresentationBinding("cambio de escena");
        }

        private static string SafeTrigger(string value)
        {
            return string.IsNullOrWhiteSpace(value)?"solicitud sin etiqueta":value.Trim();
        }

        private static string DescribeDiscoveredObjects()
        {
            var directors=FindObjectsByType<BattlePresentationDirector>(FindObjectsInactive.Include,FindObjectsSortMode.None);
            var stages=FindObjectsByType<VexforgeBattlefieldStage>(FindObjectsInactive.Include,FindObjectsSortMode.None);
            var cameras=FindObjectsByType<Camera>(FindObjectsInactive.Include,FindObjectsSortMode.None);
            var directorNames=new System.Text.StringBuilder();
            for(var i=0;i<directors.Length;i++)
            {
                if(i>0)directorNames.Append(", ");
                directorNames.Append(directors[i]==null?"<destroyed>":directors[i].name+"[initialized="+directors[i].IsInitialized+"]");
            }
            return "Objetos encontrados: directors="+directors.Length+" ["+directorNames+
                "], battlefieldStages="+stages.Length+", cameras="+cameras.Length+
                ", activeScene='"+(SceneManager.GetActiveScene().IsValid()?SceneManager.GetActiveScene().name:"<sin escena>")+"'.";
        }

        private void OnAuth(Vexforge.Session.AuthState state)
        {
            if(state==Vexforge.Session.AuthState.Authenticated)
            {
                RetryPresentationBinding("sesión autenticada");
                if(tutorial!=null)tutorial.TryStart();
            }
            if(state!=Vexforge.Session.AuthState.Authenticated&&turnCombatGate!=null)
            {
                turnCombatGate.HandleSignedOut();
                if(tutorial!=null)tutorial.Hide();
            }
        }

        private void OnDestroy()
        {
            SceneManager.activeSceneChanged -= OnActiveSceneChanged;
            if(presentationBinding!=null)StopCoroutine(presentationBinding);
            if(VexforgeApp.Instance!=null&&VexforgeApp.Instance.Session!=null)VexforgeApp.Instance.Session.StateChanged-=OnAuth;
        }
    }
}
