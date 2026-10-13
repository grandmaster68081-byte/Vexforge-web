using System;
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
        private const float CanonicalBindingTimeoutSeconds = 15f;
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
        private int presentationGeneration;
        private bool initialized;

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
                if (PresentationState != VexforgeTier1PresentationState.Ready)
                    return false;

                string ignored;
                if (ValidatePublishedPresentation(out ignored))
                    return true;

                FailPresentation(ignored);
                return false;
            }
        }

        public event Action PresentationReadinessChanged;

        public void Initialize(VexforgeApp owner)
        {
            if (owner == null)
            {
                FailPresentation("El VexforgeApp propietario no está disponible.");
                return;
            }
            if (initialized)
            {
                if (app != owner)
                    FailPresentation("El bootstrap ya pertenece a otra instancia de VexforgeApp.");
                return;
            }

            app = owner;
            SetPresentationState(
                VexforgeTier1PresentationState.Initializing,
                "Inicializando la presentación Tier1 desde VexforgeApp.");
            LockUprightPortrait();
            Build(app);
            app.Session.StateChanged -= OnAuth;
            app.Session.StateChanged += OnAuth;
            SceneManager.activeSceneChanged += OnActiveSceneChanged;
            initialized = true;
            Invoke(nameof(HandleCanonicalBindingTimeout), CanonicalBindingTimeoutSeconds);
            Debug.Log("[VEXFORGE][Lifecycle] VexforgeTier1Bootstrap phase=initialized-from-app", this);
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
        }

        public void BindCanonicalPresentation(
            BattlePresentationDirector director,
            VexforgeBattlefieldStage stage,
            VexforgeCardArtResolver resolver,
            Camera camera,
            string trigger)
        {
            var safeTrigger = SafeTrigger(trigger);
            if (!initialized || app == null)
            {
                FailPresentation("No se puede enlazar Battle antes de inicializar el bootstrap desde VexforgeApp.");
                return;
            }

            string reason;
            if (!ValidateCandidate(director, stage, resolver, camera, out reason))
            {
                FailPresentation(reason);
                return;
            }

            if (PresentationState == VexforgeTier1PresentationState.Ready &&
                canonicalBattle == director &&
                canonicalStage == stage &&
                canonicalArtResolver == resolver &&
                canonicalCamera == camera &&
                ValidatePublishedPresentation(out reason))
                return;

            CancelInvoke(nameof(HandleCanonicalBindingTimeout));
            presentationGeneration++;
            SetPresentationState(
                VexforgeTier1PresentationState.Initializing,
                "Enlazando la presentación canónica (" + safeTrigger + ").");
            try
            {
                PublishCanonicalPresentation(director, stage, resolver, camera);
            }
            catch (Exception ex)
            {
                FailPresentation(
                    "No se pudieron publicar las referencias canónicas: " +
                    ex.GetType().Name + ": " + ex.Message);
                return;
            }

            if (!ValidatePublishedPresentation(out reason))
            {
                FailPresentation(reason);
                return;
            }

            SetPresentationState(VexforgeTier1PresentationState.Ready, null);
            Debug.Log(
                "[VEXFORGE][Lifecycle] VexforgeTier1Bootstrap phase=canonical-bound generation=" +
                presentationGeneration + " trigger=" + safeTrigger,
                this);
            if (app.Session != null && app.Session.IsAuthenticated && tutorial != null)
                tutorial.TryStart();
        }

        public void RetryPresentationBinding(string trigger)
        {
            if (!initialized || app == null || !gameObject.activeInHierarchy)
                return;

            var shell = app.GetComponent<GameShellController>();
            if (shell == null)
            {
                FailPresentation("No se encontró GameShellController en el VexforgeApp propietario.");
                return;
            }

            BattlePresentationDirector director;
            VexforgeBattlefieldStage stage;
            VexforgeCardArtResolver resolver;
            Camera camera;
            string reason;
            if (!shell.TryGetCanonicalBattlePresentation(
                    out director,
                    out stage,
                    out resolver,
                    out camera,
                    out reason))
            {
                FailPresentation(reason);
                return;
            }

            BindCanonicalPresentation(director, stage, resolver, camera, trigger);
        }

        private bool ValidateCandidate(
            BattlePresentationDirector director,
            VexforgeBattlefieldStage stage,
            VexforgeCardArtResolver resolver,
            Camera camera,
            out string reason)
        {
            if (app == null || !app.gameObject.scene.IsValid())
            {
                reason = "El VexforgeApp propietario no pertenece a una escena válida.";
                return false;
            }

            var ownerScene = app.gameObject.scene;
            if (director == null || !director.isActiveAndEnabled ||
                !director.gameObject.activeInHierarchy ||
                director.gameObject.scene != ownerScene || !director.IsInitialized)
            {
                reason = "El BattlePresentationDirector canónico falta, no está inicializado o no pertenece al VexforgeApp.";
                return false;
            }

            if (stage == null || !stage.IsInitialized || stage.gameObject.scene != ownerScene)
            {
                reason = "El VexforgeBattlefieldStage canónico falta, no está inicializado o no pertenece al VexforgeApp.";
                return false;
            }

            if (resolver == null || resolver.IsDisposed)
            {
                reason = "El resolver canónico de arte de cartas falta o está liberado.";
                return false;
            }

            if (camera == null || !camera.isActiveAndEnabled ||
                !camera.gameObject.activeInHierarchy || Camera.main != camera)
            {
                reason = "La cámara MainCamera canónica falta, está inactiva o dejó de ser la cámara activa.";
                return false;
            }

            reason = null;
            return true;
        }

        private void FailPresentation(string failure)
        {
            presentationGeneration++;
            ClearPublishedPresentation();
            SetPresentationState(VexforgeTier1PresentationState.FailedRetryable, failure);
        }

        private void HandleCanonicalBindingTimeout()
        {
            if (PresentationState != VexforgeTier1PresentationState.Initializing)
                return;

            FailPresentation(
                "Timeout esperando el enlace explícito desde GameShellController.InitializeBattlePresentation.");
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
            if(app==null||!app.gameObject.scene.IsValid())
            {
                reason="El VexforgeApp propietario no pertenece a una escena válida.";
                return false;
            }

            var ownerScene=app.gameObject.scene;
            if(canonicalBattle==null||!canonicalBattle.isActiveAndEnabled||
                !canonicalBattle.gameObject.activeInHierarchy||canonicalBattle.gameObject.scene!=ownerScene||
                !canonicalBattle.IsInitialized)
            {
                reason="El BattlePresentationDirector canónico desapareció, salió de la escena propietaria o dejó de estar inicializado.";
                return false;
            }

            if(canonicalStage==null||!canonicalStage.IsInitialized||canonicalStage.gameObject.scene!=ownerScene)
            {
                reason="El VexforgeBattlefieldStage canónico desapareció, salió de la escena propietaria o dejó de estar inicializado.";
                return false;
            }

            if(canonicalArtResolver==null||canonicalArtResolver.IsDisposed)
            {
                reason="El resolver canónico de arte de cartas desapareció o está liberado.";
                return false;
            }

            if(canonicalCamera==null||!canonicalCamera.isActiveAndEnabled||
                !canonicalCamera.gameObject.activeInHierarchy||Camera.main!=canonicalCamera)
            {
                reason="La cámara MainCamera de la presentación desapareció, dejó de estar activa o ya no es la cámara activa.";
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
            var message="[VEXFORGE][Lifecycle] VexforgeTier1Bootstrap state="+state+
                (string.IsNullOrWhiteSpace(normalizedFailure)?string.Empty:" failure="+normalizedFailure);
            if(state==VexforgeTier1PresentationState.FailedRetryable)
                Debug.LogWarning(message,this);
            else
                Debug.Log(message,this);
            PresentationReadinessChanged?.Invoke();
        }

        private void OnActiveSceneChanged(Scene previous,Scene next)
        {
            var reason="Cambió la escena activa de '"+(previous.IsValid()?previous.name:"<sin escena>")+
                "' a '"+(next.IsValid()?next.name:"<sin escena>")+"'; revalidando desde el propietario canónico.";
            Debug.Log("[VEXFORGE][Lifecycle] VexforgeTier1Bootstrap phase=active-scene-changed",this);
            FailPresentation(reason);
            RetryPresentationBinding("cambio de escena");
        }

        private static string SafeTrigger(string value)
        {
            return string.IsNullOrWhiteSpace(value)?"solicitud sin etiqueta":value.Trim();
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
            CancelInvoke(nameof(HandleCanonicalBindingTimeout));
            SceneManager.activeSceneChanged -= OnActiveSceneChanged;
            if(app!=null&&app.Session!=null)app.Session.StateChanged-=OnAuth;
        }
    }
}
