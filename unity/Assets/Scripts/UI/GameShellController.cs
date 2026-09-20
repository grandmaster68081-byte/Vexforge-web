using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityEngine.InputSystem.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
using Vexforge.Presentation;
using Vexforge.Session;

namespace Vexforge.UI
{
    /// <summary>
    /// Canonical Unity shell. Canvas is restricted to contextual UI; world presentation owns
    /// Nexus and card presentation. Backend remains authoritative.
    /// </summary>
    public sealed class GameShellController : MonoBehaviour
    {
        private VexforgeApp app;

        private Canvas canvas;
        private RectTransform content;
        private InputField emailInput;
        private InputField passwordInput;

        private BattlePresentationDirector battleDirector;

        private GameObject presentationHost;
        private VexforgeNexusStage nexusStage;
        private VexforgeTextureLruCache textureCache;
        private VexforgeCardArtResolver artResolver;
        private VexforgeCardPool cardPool;
        private VexforgeVirtualizedCardGallery gallery;
        private VexforgeAlphaWorldDirector alphaWorld;
        private VexforgeAlphaHud alphaHud;
        private VexforgeDiegeticInputRouter alphaInput;

        private bool built;
        private bool subscribed;

        private void Start()
        {
            app = VexforgeApp.Instance;
            if (app == null) return;

            BuildPresentation();
            BuildBattlePresentationHost();
            BuildCanvas();
            alphaHud = GetComponent<VexforgeAlphaHud>();
            if (alphaHud == null)
                alphaHud = gameObject.AddComponent<VexforgeAlphaHud>();
            alphaHud.Initialize(app, canvas, gallery, battleDirector, alphaWorld);
            Subscribe();

            Render();
        }

        private void BuildBattlePresentationHost()
        {
            if (battleDirector != null) return;

            var legacyDirector = GetComponent<BattlePresentationDirector>();
            if (legacyDirector != null)
                legacyDirector.enabled = false;

            var host = new GameObject("BattlePresentationHost");
            host.transform.SetParent(presentationHost.transform, false);
            battleDirector = host.AddComponent<BattlePresentationDirector>();
            host.AddComponent<VexforgeBattlefieldStage>();
        }

        private void BuildPresentation()
        {
            if (presentationHost != null) return;

            presentationHost = new GameObject("VexforgePresentationRuntime");
            presentationHost.transform.SetParent(transform, false);

            nexusStage = presentationHost.AddComponent<VexforgeNexusStage>();
            nexusStage.Initialize(app);
            nexusStage.SetNexusVisible(false);

            var cardWorldRootObject = new GameObject("WorldCardPresentation");
            cardWorldRootObject.transform.SetParent(presentationHost.transform, false);

            var camera = Camera.main;
            if (camera == null)
            {
                throw new InvalidOperationException("VEXFORGE requires a MainCamera from NexusPresentationRoot.");
            }

            cardWorldRootObject.transform.position = new Vector3(0f, 3.15f, 5.4f);
            cardWorldRootObject.transform.rotation = camera.transform.rotation;

            textureCache = new VexforgeTextureLruCache(32L * 1024L * 1024L);
            artResolver = new VexforgeCardArtResolver(textureCache, 3, 20, 8L * 1024L * 1024L, 4096);

            cardPool = new VexforgeCardPool(
                cardWorldRootObject.transform,
                () => VexforgeCardView.CreateRuntime(cardWorldRootObject.transform),
                24,
                12);

            var galleryObject = new GameObject("WorldCardGallery");
            galleryObject.transform.SetParent(presentationHost.transform, false);
            galleryObject.transform.position = new Vector3(0f, 3.15f, 5.4f);
            galleryObject.transform.rotation = camera.transform.rotation;

            alphaInput = presentationHost.AddComponent<VexforgeDiegeticInputRouter>();
            alphaInput.Initialize(camera);

            gallery = galleryObject.AddComponent<VexforgeVirtualizedCardGallery>();
            gallery.Initialize(
                camera,
                cardPool,
                artResolver,
                alphaInput);

            galleryObject.SetActive(false);

            alphaWorld = presentationHost.AddComponent<VexforgeAlphaWorldDirector>();
            alphaWorld.Initialize(app.Navigation, camera);
            alphaWorld.BindGalleryRoot(galleryObject.transform);

            built = true;
        }

        private void BuildCanvas()
        {
            if (canvas != null) return;

            var mainCamera = Camera.main;
            if (mainCamera == null)
            {
                throw new InvalidOperationException("VEXFORGE cannot create UI without MainCamera.");
            }

            EnsureEventSystem();

            var canvasObject = new GameObject(
                "VexforgeCanvas",
                typeof(RectTransform),
                typeof(Canvas),
                typeof(CanvasScaler),
                typeof(GraphicRaycaster));

            canvasObject.transform.SetParent(transform, false);

            canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = mainCamera;
            canvas.planeDistance = 5f;

            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 1920f);
            scaler.matchWidthOrHeight = 0.45f;
        }

        private void EnsureEventSystem()
        {
            var eventSystem = EventSystem.current;

            if (eventSystem == null)
            {
                var eventSystemObject = new GameObject(
                    "VexforgeEventSystem",
                    typeof(EventSystem),
                    typeof(InputSystemUIInputModule));
                eventSystem = eventSystemObject.GetComponent<EventSystem>();
                eventSystemObject.transform.SetParent(transform, false);
                return;
            }

            var legacyModule = eventSystem.GetComponent<StandaloneInputModule>();
            if (legacyModule != null)
            {
                legacyModule.enabled = false;
            }

            if (eventSystem.GetComponent<InputSystemUIInputModule>() == null)
            {
                eventSystem.gameObject.AddComponent<InputSystemUIInputModule>();
            }
        }

        private void Subscribe()
        {
            if (subscribed) return;

            app.Session.StateChanged += HandleSessionChanged;
            app.GameState.SyncStateChanged += HandleSyncChanged;
            app.Navigation.RouteChanged += HandleRouteChanged;
            subscribed = true;
        }

        private void Unsubscribe()
        {
            if (!subscribed || app == null) return;

            app.Session.StateChanged -= HandleSessionChanged;
            app.GameState.SyncStateChanged -= HandleSyncChanged;
            app.Navigation.RouteChanged -= HandleRouteChanged;
            subscribed = false;
        }

        private void HandleSessionChanged(AuthState _)
        {
            Render();
        }

        private void HandleSyncChanged(SyncState _)
        {
            Render();
        }

        private void HandleRouteChanged(GameRoute _)
        {
            Render();
        }

        private void Render()
        {
            if (!built || app == null || canvas == null) return;

            if (!app.Session.IsAuthenticated)
            {
                HideWorldPresentation();
                ClearCanvas();
                RenderSignIn();
                return;
            }

            PrepareWorldPresentation();
            ClearCanvas();
            RenderShell();
        }

        private void PrepareWorldPresentation()
        {
            nexusStage.SetNexusVisible(false);
            if (alphaWorld != null)
                alphaWorld.SetVisible(true);
        }

        private void HideWorldPresentation()
        {
            if (battleDirector != null) battleDirector.StopAndHide();
            if (nexusStage != null) nexusStage.SetNexusVisible(false);
            if (alphaWorld != null) alphaWorld.SetVisible(false);
            if (gallery != null) gallery.Hide();
            if (cardPool != null) cardPool.ReturnAll();
        }

        private void RenderSignIn()
        {
            var panel = UiFactory.PanelObject(canvas.transform, "NexusSeal", UiFactory.PanelGlass);
            UiFactory.Anchor(panel.GetComponent<RectTransform>(),
                new Vector2(0.1f, 0.27f),
                new Vector2(0.9f, 0.75f),
                Vector2.zero,
                Vector2.zero);

            var outline = panel.AddComponent<Outline>();
            outline.effectColor = UiFactory.GoldDim;
            outline.effectDistance = new Vector2(2f, 2f);

            var title = UiFactory.Label(panel.transform, "NEXUS SEAL", 42, UiFactory.Gold, TextAnchor.MiddleCenter);
            UiFactory.Anchor(title.rectTransform,
                new Vector2(0.05f, 0.72f),
                new Vector2(0.95f, 0.9f),
                Vector2.zero,
                Vector2.zero);

            var subtitle = UiFactory.Label(
                panel.transform,
                "Autenticación real · Supabase authority",
                17,
                UiFactory.Muted,
                TextAnchor.MiddleCenter);

            UiFactory.Anchor(subtitle.rectTransform,
                new Vector2(0.08f, 0.64f),
                new Vector2(0.92f, 0.72f),
                Vector2.zero,
                Vector2.zero);

            emailInput = UiFactory.Input(panel.transform, "Email", false);
            UiFactory.Anchor(
                emailInput.GetComponent<RectTransform>(),
                new Vector2(0.1f, 0.46f),
                new Vector2(0.9f, 0.57f),
                Vector2.zero,
                Vector2.zero);

            passwordInput = UiFactory.Input(panel.transform, "Contraseña", true);
            UiFactory.Anchor(
                passwordInput.GetComponent<RectTransform>(),
                new Vector2(0.1f, 0.31f),
                new Vector2(0.9f, 0.42f),
                Vector2.zero,
                Vector2.zero);

            var signIn = UiFactory.Button(panel.transform, "ENTRAR AL NEXUS", SignInClicked);
            UiFactory.Anchor(
                signIn.GetComponent<RectTransform>(),
                new Vector2(0.1f, 0.14f),
                new Vector2(0.9f, 0.26f),
                Vector2.zero,
                Vector2.zero);

            var message = app.InitializationError ??
                          app.Session.LastError ??
                          "Inicia sesión para cargar datos reales del jugador.";

            var status = UiFactory.Label(
                panel.transform,
                message,
                14,
                UiFactory.Muted,
                TextAnchor.MiddleCenter);

            UiFactory.Anchor(
                status.rectTransform,
                new Vector2(0.08f, 0.02f),
                new Vector2(0.92f, 0.11f),
                Vector2.zero,
                Vector2.zero);
        }

        private void RenderShell()
        {
            if (alphaHud == null) return;
            alphaHud.RenderRoute(app.Navigation.CurrentRoute);
        }

        private void RenderRoute()
        {
            switch (app.Navigation.CurrentRoute)
            {
                case GameRoute.Collection:
                    BuildCollection();
                    break;

                case GameRoute.Deck:
                    BuildDeck();
                    break;

                case GameRoute.Battle:
                    BuildBattle();
                    break;

                case GameRoute.Missions:
                    BuildMissions();
                    break;

                case GameRoute.Economy:
                    BuildEconomy();
                    break;

                case GameRoute.Profile:
                    BuildProfile();
                    break;

                default:
                    BuildNexus();
                    break;
            }
        }

        private void BuildNexus()
        {
            Title("THE NEXUS", "Citadel hub · entra en un dominio del mundo");

            if (app.GameState.SyncState != SyncState.Connected)
            {
                Message("El Nexus espera una sincronización válida de Supabase.\nNo se muestran datos inventados.");
                return;
            }

            var progress = app.GameState.Progress;
            var profile = app.GameState.Profile;

            Message(
                "Sello: " + (profile == null ? "NO REPORTADO" : ValueOr(profile.display_name, "NO REPORTADO")) +
                "\nNivel: " + (progress == null ? "NO REPORTADO" : progress.level.ToString()) +
                "\nEnergía: " + (progress == null ? "NO REPORTADA" : progress.energy + " / " + progress.max_energy) +
                "\nLos dominios se recorren mediante objetos del Nexus.");
        }

        private void BuildCollection()
        {
            Title("ARCHIVE", "Santuario de cartas · catálogo y ownership desde Supabase");
            AddReturnRune();

            var catalog = app.GameState.Catalog ?? new CardRecord[0];
            gallery.SetData(catalog, app.GameState.Collection);
            gallery.Show();

            if (catalog.Length == 0)
            {
                MessageAt("SIN CONTENIDO DISPONIBLE", 0.16f);
                return;
            }

            MessageAt(
                "CATÁLOGO " + catalog.Length +
                " · arrastra para recorrer el archivo completo",
                0.02f);
        }

        private void BuildDeck()
        {
            Title("FORGE", "Mesa de forja · slots recibidos y persistidos por Supabase");
            AddReturnRune();

            var deckSlots = app.GameState.Deck ?? new DeckSlot[0];
            var deckCards = new CardRecord[deckSlots.Length];

            for (var i = 0; i < deckSlots.Length; i++)
            {
                deckCards[i] = FindCard(deckSlots[i].card_id);
            }

            gallery.SetData(deckCards, app.GameState.Collection);
            gallery.Show();

            MessageAt(
                deckSlots.Length == 0
                    ? "FORJA VACÍA · SIN SLOTS REPORTADOS"
                    : "La mesa muestra todos los slots reportados por Supabase.",
                0.02f);

            var ids = new string[deckSlots.Length];
            for (var i = 0; i < deckSlots.Length; i++)
            {
                ids[i] = deckSlots[i].card_id;
            }

            ActionButton("VALIDAR EN EL ALTAR", GameRoute.Deck, 0.08f, () => ValidateDeck(ids));
            ActionButton("SELLAR DECK", GameRoute.Deck, 0.0f, () => SaveDeck(ids));
        }

        private void BuildBattle()
        {
            Title("BATTLEFIELD", "Arena de eventos · Supabase resuelve el combate");
            AddReturnRune();

            var board = UiFactory.PanelObject(
                content,
                "BattlefieldContext",
                new Color(0.04f, 0.025f, 0.03f, 0.66f));

            UiFactory.Anchor(
                board.GetComponent<RectTransform>(),
                new Vector2(0.05f, 0.38f),
                new Vector2(0.95f, 0.76f),
                Vector2.zero,
                Vector2.zero);

            var boardText = UiFactory.Label(
                board.transform,
                "ARENA EN ESPERA\n\nZONA DEL JUGADOR\n\n— NÚCLEO DE BATALLA —\n\nZONA DEL OPONENTE",
                18,
                UiFactory.Text,
                TextAnchor.MiddleCenter);

            UiFactory.Stretch(boardText.rectTransform, 10f, 10f, 10f, 10f);

            MessageAt(
                "Unity sólo envía intención y presenta eventos. No se crea un rival local ni se calcula un resultado.",
                0.30f);

            var opponentInput = UiFactory.Input(content, "UUID del oponente", false);
            UiFactory.Anchor(
                opponentInput.GetComponent<RectTransform>(),
                new Vector2(0.08f, 0.17f),
                new Vector2(0.92f, 0.25f),
                Vector2.zero,
                Vector2.zero);

            ActionButton(
                "ABRIR DESAFÍO",
                GameRoute.Battle,
                0.06f,
                () => ResolveBattle(opponentInput.text));
        }

        private void BuildMissions()
        {
            Title("MISSIONS", "Cámara de contratos · actividad publicada por Supabase");
            AddReturnRune();

            var missions = app.GameState.Missions ?? new MissionRecord[0];

            if (missions.Length == 0)
            {
                MessageAt("SIN CONTENIDO DISPONIBLE", 0.55f);
                return;
            }

            for (var i = 0; i < missions.Length; i++)
            {
                var mission = missions[i];

                var contract = UiFactory.PanelObject(
                    content,
                    "Contract_" + i,
                    UiFactory.PanelGlass);

                UiFactory.Anchor(
                    contract.GetComponent<RectTransform>(),
                    new Vector2(0.08f, 0.54f - i * 0.09f),
                    new Vector2(0.92f, 0.61f - i * 0.09f),
                    Vector2.zero,
                    Vector2.zero);

                var text = UiFactory.Label(
                    contract.transform,
                    ValueOr(mission == null ? null : mission.name, "CONTRATO NO REPORTADO") +
                    "  ·  " +
                    ValueOr(mission == null ? null : mission.difficulty, "DIFICULTAD NO REPORTADA") +
                    "\nXP REPORTADO: " +
                    (mission == null ? "NO REPORTADO" : mission.reward_xp.ToString()),
                    14,
                    UiFactory.Text);

                UiFactory.Stretch(text.rectTransform, 12f, 4f, 12f, 4f);
            }
        }

        private void BuildEconomy()
        {
            Title("TREASURY", "Balances de solo lectura · autoridad Supabase");

            AddReturnRune();

            var wallet = app.GameState.Wallet;

            Message(
                wallet == null
                    ? "La cartera no está disponible desde la sesión actual."
                    : "VEX in-game: " + wallet.vex_ingame +
                      "\nVEX tradeable: " + wallet.vex_tradeable +
                      "\nReservado in-game: " + wallet.reserved_ingame +
                      "\nReservado tradeable: " + wallet.reserved_tradeable);
        }

        private void BuildProfile()
        {
            Title("PROFILE", "Identidad, estadísticas y progreso autorizados");

            AddReturnRune();

            var profile = app.GameState.Profile;
            var progress = app.GameState.Progress;

            Message(
                profile == null
                    ? "El perfil no está disponible."
                    : "Nombre: " + ValueOr(profile.display_name, "NO REPORTADO") +
                      "\nRol: " + ValueOr(profile.role, "NO REPORTADO") +
                      "\nEstado: " + ValueOr(profile.status, "NO REPORTADO") +
                      "\nNivel: " + (progress == null ? "NO REPORTADO" : progress.level.ToString()));

            ActionButton(
                "CERRAR SESIÓN",
                GameRoute.Profile,
                0.20f,
                () => app.SignOut());
        }

        private void AddReturnRune()
        {
            var button = UiFactory.Button(
                content,
                "VOLVER AL NEXUS",
                () => app.Navigation.Navigate(GameRoute.Nexus));

            UiFactory.Anchor(
                button.GetComponent<RectTransform>(),
                new Vector2(0.68f, 0.89f),
                new Vector2(0.98f, 0.98f),
                Vector2.zero,
                Vector2.zero);
        }

        private void ActionButton(
            string text,
            GameRoute route,
            float y,
            UnityAction onClick = null)
        {
            var button = UiFactory.Button(
                content,
                text,
                onClick ?? (() => app.Navigation.Navigate(route)));

            UiFactory.Anchor(
                button.GetComponent<RectTransform>(),
                new Vector2(0.08f, y),
                new Vector2(0.92f, y + 0.1f),
                Vector2.zero,
                Vector2.zero);
        }

        private void Title(string title, string subtitle)
        {
            var heading = UiFactory.Label(
                content,
                title,
                30,
                UiFactory.Gold);

            UiFactory.Anchor(
                heading.rectTransform,
                new Vector2(0.04f, 0.87f),
                new Vector2(0.96f, 0.98f),
                Vector2.zero,
                Vector2.zero);

            var sub = UiFactory.Label(
                content,
                subtitle,
                14,
                UiFactory.Muted);

            UiFactory.Anchor(
                sub.rectTransform,
                new Vector2(0.04f, 0.79f),
                new Vector2(0.96f, 0.87f),
                Vector2.zero,
                Vector2.zero);
        }

        private void Message(string text)
        {
            MessageAt(text, 0.68f);
        }

        private void MessageAt(string text, float y)
        {
            var message = UiFactory.Label(
                content,
                text,
                16,
                UiFactory.Text);

            UiFactory.Anchor(
                message.rectTransform,
                new Vector2(0.06f, y),
                new Vector2(0.94f, y + 0.08f),
                Vector2.zero,
                Vector2.zero);
        }

        private async void SignInClicked()
        {
            if (emailInput == null || passwordInput == null) return;
            await app.SignInAndSyncAsync(
                emailInput.text.Trim(),
                passwordInput.text);
        }

        private async void ValidateDeck(string[] ids)
        {
            var result = await app.Repository.ValidateDeckAsync(ids);

            MessageAt(
                result == null
                    ? "EL BACKEND NO DEVOLVIÓ VALIDACIÓN."
                    : result.valid
                        ? "DECK VÁLIDO"
                        : string.Join("\n", result.errors ?? new string[0]),
                0.30f);
        }

        private async void SaveDeck(string[] ids)
        {
            var result = await app.Repository.SaveDeckAsync(ids);

            MessageAt(
                result == null
                    ? "EL BACKEND NO DEVOLVIÓ CONFIRMACIÓN."
                    : result.ok
                        ? "DECK GUARDADO"
                        : ValueOr(result.reason, "OPERACIÓN NO CONFIRMADA"),
                0.30f);
        }

        private async void ResolveBattle(string opponentId)
        {
            if (string.IsNullOrWhiteSpace(opponentId) ||
                app.Session.Current == null)
            {
                return;
            }

            var result = await app.Repository.ResolveBattleAsync(
                app.GameState.PlayerId,
                opponentId.Trim(),
                Guid.NewGuid().ToString("N"));

            if (result == null)
            {
                MessageAt("EL BACKEND NO DEVOLVIÓ RESULTADO", 0.22f);
                return;
            }

            if (!result.ok)
            {
                MessageAt(
                    ValueOr(result.error, "BATALLA NO DISPONIBLE"),
                    0.22f);
                return;
            }

            MessageAt(
                "RESULTADO RECIBIDO · " +
                ValueOr(result.status, "ESTADO NO REPORTADO"),
                0.22f);

            battleDirector.Play(result.events);
        }

        private void PresentBattleEvent(BattleEvent battleEvent)
        {
            if (battleEvent == null || content == null) return;

            var eventText =
                ValueOr(battleEvent.event_type, "EVENTO NO REPORTADO") +
                " · " +
                ValueOr(battleEvent.actor_id, "ACTOR NO REPORTADO");

            MessageAt(eventText, 0.34f);
        }

        private CardRecord FindCard(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) ||
                app.GameState.Catalog == null)
            {
                return null;
            }

            for (var i = 0; i < app.GameState.Catalog.Length; i++)
            {
                var card = app.GameState.Catalog[i];
                if (card != null && card.id == cardId)
                {
                    return card;
                }
            }

            return null;
        }

        private static string ValueOr(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private void ClearCanvas()
        {
            for (var i = canvas.transform.childCount - 1; i >= 0; i--)
            {
                Destroy(canvas.transform.GetChild(i).gameObject);
            }

            content = null;
            emailInput = null;
            passwordInput = null;
        }

        private void OnDestroy()
        {
            Unsubscribe();

            if (battleDirector != null)
            {
                battleDirector.EventPresented -= PresentBattleEvent;
            }

            if (gallery != null) gallery.Hide();
            if (cardPool != null) cardPool.Dispose();
            if (artResolver != null) artResolver.Dispose();
            if (textureCache != null) textureCache.Dispose();
        }
    }
}
