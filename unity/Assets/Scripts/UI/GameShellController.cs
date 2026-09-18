using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
using Vexforge.Presentation;

namespace Vexforge.UI
{
    public sealed class GameShellController : MonoBehaviour
    {
        private VexforgeApp app;
        private Canvas canvas;
        private RectTransform content;
        private Text status;
        private InputField emailInput;
        private InputField passwordInput;
        private BattlePresentationDirector battleDirector;
        private VexforgeNexusStage nexusStage;
        private VexforgeCardArtResolver cardArtResolver;
        private VexforgeCardPool cardPool;
        private Transform cardWorldRoot;
        private bool built;

        private void Start()
        {
            app = VexforgeApp.Instance;
            if (app == null) return;

            nexusStage = GetComponent<VexforgeNexusStage>();
            if (nexusStage == null) nexusStage = gameObject.AddComponent<VexforgeNexusStage>();
            nexusStage.Initialize(app);

            battleDirector = GetComponent<BattlePresentationDirector>();
            if (battleDirector == null) battleDirector = gameObject.AddComponent<BattlePresentationDirector>();
            battleDirector.EventPresented += PresentBattleEvent;

            cardWorldRoot = new GameObject("CardPresentationWorld").transform;
            cardWorldRoot.SetParent(transform, false);
            cardWorldRoot.localPosition = new Vector3(0f, 0.8f, 6f);
            cardArtResolver = new VexforgeCardArtResolver(new VexforgeTextureLruCache(128 * 1024 * 1024));
            cardPool = new VexforgeCardPool(
                cardWorldRoot,
                () => VexforgeCardView.CreateRuntime(cardWorldRoot),
                24,
                12);

            BuildCanvas();
            app.Session.StateChanged += _ => Render();
            app.GameState.SyncStateChanged += _ => Render();
            app.Navigation.RouteChanged += HandleRouteChanged;
            Render();
        }

        private void BuildCanvas()
        {
            var canvasObject = new GameObject("VexforgeContextCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = Camera.main;
            canvas.planeDistance = 7f;
            canvasObject.GetComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasObject.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1080f, 1920f);
            canvasObject.GetComponent<CanvasScaler>().matchWidthOrHeight = 0.45f;
            built = true;
        }

        private void HandleRouteChanged(GameRoute route)
        {
            if (nexusStage != null)
            {
                nexusStage.SetNexusVisible(app != null && app.Session.IsAuthenticated && route == GameRoute.Nexus);
            }
            Render();
        }

        private void Render()
        {
            if (!built || app == null) return;
            ClearCanvas();
            if (cardPool != null) cardPool.ReturnAll();

            if (!app.Session.IsAuthenticated)
            {
                if (nexusStage != null) nexusStage.SetNexusVisible(false);
                RenderSignIn();
                return;
            }

            if (app.Navigation.CurrentRoute == GameRoute.Nexus)
            {
                if (nexusStage != null) nexusStage.SetNexusVisible(true);
                RenderNexusContext();
                return;
            }

            if (nexusStage != null) nexusStage.SetNexusVisible(false);
            RenderShell();
        }

        private void RenderSignIn()
        {
            var panel = UiFactory.PanelObject(canvas.transform, "NexusSeal", UiFactory.PanelGlass);
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.1f, 0.27f), new Vector2(0.9f, 0.75f), Vector2.zero, Vector2.zero);
            var outline = panel.AddComponent<Outline>();
            outline.effectColor = UiFactory.GoldDim;
            outline.effectDistance = new Vector2(2f, 2f);
            var title = UiFactory.Label(panel.transform, "NEXUS SEAL", 42, UiFactory.Gold, TextAnchor.MiddleCenter);
            UiFactory.Anchor(title.rectTransform, new Vector2(0.05f, 0.72f), new Vector2(0.95f, 0.9f), Vector2.zero, Vector2.zero);
            var subtitle = UiFactory.Label(panel.transform, "Autenticación real · Supabase authority", 17, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Anchor(subtitle.rectTransform, new Vector2(0.08f, 0.64f), new Vector2(0.92f, 0.72f), Vector2.zero, Vector2.zero);
            emailInput = UiFactory.Input(panel.transform, "Email", false);
            UiFactory.Anchor(emailInput.GetComponent<RectTransform>(), new Vector2(0.1f, 0.46f), new Vector2(0.9f, 0.57f), Vector2.zero, Vector2.zero);
            passwordInput = UiFactory.Input(panel.transform, "Contraseña", true);
            UiFactory.Anchor(passwordInput.GetComponent<RectTransform>(), new Vector2(0.1f, 0.31f), new Vector2(0.9f, 0.42f), Vector2.zero, Vector2.zero);
            var signIn = UiFactory.Button(panel.transform, "ENTRAR AL NEXUS", SignInClicked);
            UiFactory.Anchor(signIn.GetComponent<RectTransform>(), new Vector2(0.1f, 0.14f), new Vector2(0.9f, 0.26f), Vector2.zero, Vector2.zero);
            var message = app.InitializationError ?? app.Session.LastError ?? "Inicia sesión para cargar datos reales del jugador.";
            status = UiFactory.Label(panel.transform, message, 14, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Anchor(status.rectTransform, new Vector2(0.08f, 0.02f), new Vector2(0.92f, 0.11f), Vector2.zero, Vector2.zero);
        }

        private void RenderNexusContext()
        {
            var context = UiFactory.PanelObject(canvas.transform, "NexusContext", new Color(0.015f, 0.012f, 0.01f, 0.66f));
            UiFactory.Anchor(context.GetComponent<RectTransform>(), new Vector2(0.04f, 0.84f), new Vector2(0.96f, 0.98f), Vector2.zero, Vector2.zero);
            var profileName = app.GameState.Profile != null && !string.IsNullOrWhiteSpace(app.GameState.Profile.display_name)
                ? app.GameState.Profile.display_name
                : "Jugador autenticado";
            var heading = UiFactory.Label(context.transform, "VEXFORGE  /  " + profileName, 20, UiFactory.Gold);
            UiFactory.Anchor(heading.rectTransform, new Vector2(0.04f, 0.22f), new Vector2(0.58f, 0.78f), Vector2.zero, Vector2.zero);
            var syncText = app.GameState.SyncState == SyncState.Connected ? "SUPABASE · CONNECTED" : app.GameState.SyncState.ToString().ToUpperInvariant();
            var sync = UiFactory.Label(context.transform, syncText, 12,
                app.GameState.SyncState == SyncState.Connected ? UiFactory.Arcane : UiFactory.Muted, TextAnchor.MiddleRight);
            UiFactory.Anchor(sync.rectTransform, new Vector2(0.58f, 0.22f), new Vector2(0.96f, 0.78f), Vector2.zero, Vector2.zero);
        }

        private void RenderShell()
        {
            var background = UiFactory.PanelObject(canvas.transform, "ContextSurface", UiFactory.Background);
            UiFactory.Stretch(background.GetComponent<RectTransform>(), 0, 0, 0, 0);
            background.GetComponent<Image>().color = new Color(UiFactory.Background.r, UiFactory.Background.g, UiFactory.Background.b, 0.52f);
            var header = UiFactory.PanelObject(background.transform, "Header", new Color(0.03f, 0.02f, 0.018f, 0.78f));
            UiFactory.Anchor(header.GetComponent<RectTransform>(), new Vector2(0f, 0.89f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            var profileName = app.GameState.Profile != null && !string.IsNullOrWhiteSpace(app.GameState.Profile.display_name)
                ? app.GameState.Profile.display_name
                : "Jugador autenticado";
            var heading = UiFactory.Label(header.transform, "VEXFORGE  /  " + profileName, 20, UiFactory.Gold);
            UiFactory.Anchor(heading.rectTransform, new Vector2(0.05f, 0.32f), new Vector2(0.72f, 0.78f), Vector2.zero, Vector2.zero);
            var syncText = app.GameState.SyncState == SyncState.Connected ? "SUPABASE · CONNECTED" : app.GameState.SyncState.ToString().ToUpperInvariant();
            var sync = UiFactory.Label(header.transform, syncText, 12,
                app.GameState.SyncState == SyncState.Connected ? UiFactory.Arcane : UiFactory.Muted, TextAnchor.MiddleRight);
            UiFactory.Anchor(sync.rectTransform, new Vector2(0.63f, 0.32f), new Vector2(0.95f, 0.78f), Vector2.zero, Vector2.zero);

            var contentObject = UiFactory.PanelObject(background.transform, "RouteContext", new Color(0f, 0f, 0f, 0f));
            UiFactory.Anchor(contentObject.GetComponent<RectTransform>(), new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.89f), Vector2.zero, Vector2.zero);
            content = contentObject.GetComponent<RectTransform>();
            RenderRoute();
        }

        private void RenderRoute()
        {
            if (content == null) return;
            switch (app.Navigation.CurrentRoute)
            {
                case GameRoute.Archive: BuildCollection(); break;
                case GameRoute.Forge: BuildDeck(); break;
                case GameRoute.Battlefield: BuildBattle(); break;
                case GameRoute.Missions: BuildMissions(); break;
                case GameRoute.Economy: BuildEconomy(); break;
                case GameRoute.Profile: BuildProfile(); break;
                default: BuildNexus(); break;
            }
        }

        private void BuildNexus()
        {
            Title("THE NEXUS", "La ciudadela permanece en el mundo; usa sus gateways para navegar.");
            Message("El Canvas sólo muestra contexto. La navegación principal vive en los objetos del Nexus.");
        }

        private void BuildCollection()
        {
            Title("ARCHIVE", "Santuario de cartas · catálogo y ownership desde Supabase");
            AddReturnRune();
            var catalog = app.GameState.Catalog ?? new CardRecord[0];
            if (catalog.Length == 0)
            {
                MessageAt("SIN CONTENIDO DISPONIBLE", 0.56f);
                return;
            }

            for (var i = 0; i < catalog.Length; i++)
            {
                var card = catalog[i];
                var view = cardPool.Rent(
                    card,
                    FindOwnership(card == null ? null : card.id),
                    false,
                    false,
                    FindOwnership(card == null ? null : card.id) != null && FindOwnership(card.id).locked,
                    cardArtResolver);
                if (view == null) continue;
                PositionCard(view.transform, i, 6);
            }

            MessageAt("El archivo carga arte oficial bajo demanda y respeta el presupuesto de memoria de la presentación.", 0.2f);
        }

        private void BuildDeck()
        {
            Title("FORGE", "Mesa de forja · validación y persistencia server-authoritative");
            AddReturnRune();
            var ids = new string[app.GameState.Deck.Length];
            for (var i = 0; i < app.GameState.Deck.Length; i++)
            {
                var slot = app.GameState.Deck[i];
                ids[i] = slot.card_id;
                var card = FindCard(slot.card_id);
                var view = cardPool.Rent(card, null, false, slot.is_champion, false, cardArtResolver);
                if (view != null) PositionCard(view.transform, i, 3);
            }
            MessageAt(app.GameState.Deck.Length == 0 ? "FORJA VACIA · SIN SLOTS REPORTADOS" : "La mesa muestra únicamente cartas devueltas por Supabase.", 0.2f);
            ActionButton("VALIDAR EN EL ALTAR", GameRoute.Forge, 0.08f, () => ValidateDeck(ids));
            ActionButton("SELLAR DECK", GameRoute.Forge, 0.0f, () => SaveDeck(ids));
        }

        private void BuildBattle()
        {
            Title("BATTLEFIELD", "Arena de eventos · Supabase resuelve el combate");
            AddReturnRune();
            var board = UiFactory.PanelObject(content, "BattlefieldContext", new Color(0.04f, 0.025f, 0.03f, 0.88f));
            UiFactory.Anchor(board.GetComponent<RectTransform>(), new Vector2(0.05f, 0.38f), new Vector2(0.95f, 0.76f), Vector2.zero, Vector2.zero);
            var boardText = UiFactory.Label(board.transform, "ARENA EN ESPERA\n\nZONA DEL JUGADOR\n\n— NÚCLEO DE BATALLA —\n\nZONA DEL OPONENTE", 18, UiFactory.Text, TextAnchor.MiddleCenter);
            UiFactory.Stretch(boardText.rectTransform, 10f, 10f, 10f, 10f);
            MessageAt("Unity sólo envía intención y presenta eventos. No se crea un rival local ni se calcula un resultado.", 0.3f);
            var opponentInput = UiFactory.Input(content, "UUID del oponente", false);
            UiFactory.Anchor(opponentInput.GetComponent<RectTransform>(), new Vector2(0.08f, 0.17f), new Vector2(0.92f, 0.25f), Vector2.zero, Vector2.zero);
            ActionButton("ABRIR DESAFIO", GameRoute.Battlefield, 0.06f, () => ResolveBattle(opponentInput.text));
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
                if (i >= 5) break;
                var mission = missions[i];
                var contract = UiFactory.PanelObject(content, "Contract_" + i, UiFactory.PanelGlass);
                UiFactory.Anchor(contract.GetComponent<RectTransform>(), new Vector2(0.08f, 0.54f - i * 0.09f), new Vector2(0.92f, 0.61f - i * 0.09f), Vector2.zero, Vector2.zero);
                var text = UiFactory.Label(contract.transform,
                    VexforgeCardView.ValueOr(mission.name, "CONTRATO NO REPORTADO") + "  ·  " +
                    VexforgeCardView.ValueOr(mission.difficulty, "DIFICULTAD NO REPORTADA") +
                    "\nXP REPORTADO: " + mission.reward_xp, 14, UiFactory.Text);
                UiFactory.Stretch(text.rectTransform, 12f, 4f, 12f, 4f);
            }
        }

        private void BuildEconomy()
        {
            Title("TREASURY", "Balances de solo lectura · sin funciones financieras ficticias");
            var wallet = app.GameState.Wallet;
            Message(wallet == null
                ? "La cartera no está disponible desde la sesión actual."
                : "VEX in-game: " + wallet.vex_ingame + "\nVEX tradeable: " + wallet.vex_tradeable +
                  "\nReservado in-game: " + wallet.reserved_ingame + "\nReservado tradeable: " + wallet.reserved_tradeable);
        }

        private void BuildProfile()
        {
            Title("LEGADO", "Identidad, estadísticas y progreso autorizados");
            var profile = app.GameState.Profile;
            var progress = app.GameState.Progress;
            Message(profile == null
                ? "El perfil no está disponible."
                : "Nombre: " + profile.display_name + "\nRol: " + profile.role + "\nEstado: " + profile.status +
                  "\nNivel: " + (progress == null ? "no disponible" : progress.level.ToString()));
            ActionButton("CERRAR SESIÓN", GameRoute.Profile, 0.2f, () => app.SignOut());
        }

        private void PositionCard(Transform card, int index, int columns)
        {
            var column = index % columns;
            var row = index / columns;
            card.localPosition = new Vector3((column - (columns - 1) * 0.5f) * 2.05f, -row * 2.9f, 0f);
            card.localRotation = Quaternion.identity;
        }

        private void AddReturnRune()
        {
            var button = UiFactory.Button(content, "VOLVER AL NEXUS", () => app.Navigation.Navigate(GameRoute.Nexus));
            UiFactory.Anchor(button.GetComponent<RectTransform>(), new Vector2(0.68f, 0.88f), new Vector2(0.98f, 0.98f), Vector2.zero, Vector2.zero);
        }

        private void ActionButton(string text, GameRoute route, float y, UnityAction onClick = null)
        {
            var button = UiFactory.Button(content, text, onClick ?? (() => app.Navigation.Navigate(route)));
            UiFactory.Anchor(button.GetComponent<RectTransform>(), new Vector2(0.08f, y), new Vector2(0.92f, y + 0.1f), Vector2.zero, Vector2.zero);
        }

        private void Title(string title, string subtitle)
        {
            var heading = UiFactory.Label(content, title, 30, UiFactory.Gold);
            UiFactory.Anchor(heading.rectTransform, new Vector2(0.04f, 0.87f), new Vector2(0.96f, 0.98f), Vector2.zero, Vector2.zero);
            var sub = UiFactory.Label(content, subtitle, 14, UiFactory.Muted);
            UiFactory.Anchor(sub.rectTransform, new Vector2(0.04f, 0.79f), new Vector2(0.96f, 0.87f), Vector2.zero, Vector2.zero);
        }

        private void Message(string text)
        {
            MessageAt(text, 0.68f);
        }

        private void MessageAt(string text, float y)
        {
            var message = UiFactory.Label(content, text, 16, UiFactory.Text);
            UiFactory.Anchor(message.rectTransform, new Vector2(0.06f, y), new Vector2(0.94f, y + 0.08f), Vector2.zero, Vector2.zero);
        }

        private async void SignInClicked()
        {
            if (emailInput == null || passwordInput == null) return;
            await app.SignInAndSyncAsync(emailInput.text.Trim(), passwordInput.text);
        }

        private async void ValidateDeck(string[] ids)
        {
            var result = await app.Repository.ValidateDeckAsync(ids);
            MessageAt(result == null ? "El backend no devolvió validación." : (result.valid ? "DECK VÁLIDO" : string.Join("\n", result.errors ?? new string[0])), 0.3f);
        }

        private async void SaveDeck(string[] ids)
        {
            var result = await app.Repository.SaveDeckAsync(ids);
            MessageAt(result == null ? "El backend no devolvió confirmación." : (result.ok ? "DECK GUARDADO" : result.reason), 0.3f);
        }

        private async void ResolveBattle(string opponentId)
        {
            if (string.IsNullOrWhiteSpace(opponentId) || app.Session.Current == null) return;
            var result = await app.Repository.ResolveBattleAsync(app.GameState.PlayerId, opponentId.Trim(), Guid.NewGuid().ToString("N"));
            if (result == null)
            {
                MessageAt("EL BACKEND NO DEVOLVIO RESULTADO", 0.22f);
                return;
            }
            if (!result.ok)
            {
                MessageAt(VexforgeCardView.ValueOr(result.error, "BATALLA NO DISPONIBLE"), 0.22f);
                return;
            }
            MessageAt("RESULTADO RECIBIDO · " + VexforgeCardView.ValueOr(result.status, "ESTADO NO REPORTADO"), 0.22f);
            battleDirector.Play(result.events);
        }

        private void ClearCanvas()
        {
            for (var i = canvas.transform.childCount - 1; i >= 0; i--) Destroy(canvas.transform.GetChild(i).gameObject);
            content = null;
        }

        private PlayerCardRecord FindOwnership(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) || app.GameState.Collection == null) return null;
            for (var i = 0; i < app.GameState.Collection.Length; i++)
            {
                var ownership = app.GameState.Collection[i];
                if (ownership != null && ownership.card_id == cardId) return ownership;
            }
            return null;
        }

        private CardRecord FindCard(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) || app.GameState.Catalog == null) return null;
            for (var i = 0; i < app.GameState.Catalog.Length; i++)
            {
                var card = app.GameState.Catalog[i];
                if (card != null && card.id == cardId) return card;
            }
            return null;
        }

        private void PresentBattleEvent(BattleEvent battleEvent)
        {
            if (battleEvent == null || content == null) return;
            var eventText = VexforgeCardView.ValueOr(battleEvent.event_type, "EVENTO NO REPORTADO") +
                "  ·  " + VexforgeCardView.ValueOr(battleEvent.actor_id, "ACTOR NO REPORTADO");
            MessageAt(eventText, 0.34f);
        }

        private void OnDestroy()
        {
            if (battleDirector != null) battleDirector.EventPresented -= PresentBattleEvent;
            if (cardPool != null) cardPool.Dispose();
            if (cardArtResolver != null) cardArtResolver.Dispose();
        }
    }
}