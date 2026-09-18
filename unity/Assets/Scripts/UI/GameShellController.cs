using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
using Vexforge.Presentation;
using Vexforge.World;

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
        private bool built;

        private void Start()
        {
            app = VexforgeApp.Instance;
            if (app == null) return;
            if (GetComponent<NexusWorldController>() == null) gameObject.AddComponent<NexusWorldController>();
            battleDirector = GetComponent<BattlePresentationDirector>();
            if (battleDirector == null) battleDirector = gameObject.AddComponent<BattlePresentationDirector>();
            battleDirector.EventPresented += PresentBattleEvent;
            BuildCanvas();
            app.Session.StateChanged += _ => Render();
            app.GameState.SyncStateChanged += _ => Render();
            app.Navigation.RouteChanged += _ => Render();
            Render();
        }

        private void BuildCanvas()
        {
            var canvasObject = new GameObject("VexforgeCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObject.GetComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasObject.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1080f, 1920f);
            canvasObject.GetComponent<CanvasScaler>().matchWidthOrHeight = 0.45f;
            built = true;
        }

        private void Render()
        {
            if (!built || app == null) return;
            ClearCanvas();
            if (!app.Session.IsAuthenticated)
            {
                RenderSignIn();
                return;
            }

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

        private void RenderShell()
        {
            var background = UiFactory.PanelObject(canvas.transform, "GameShell", UiFactory.Background);
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
            var sync = UiFactory.Label(header.transform, syncText, 12, app.GameState.SyncState == SyncState.Connected ? UiFactory.Arcane : UiFactory.Muted, TextAnchor.MiddleRight);
            UiFactory.Anchor(sync.rectTransform, new Vector2(0.63f, 0.32f), new Vector2(0.95f, 0.78f), Vector2.zero, Vector2.zero);

            var contentObject = UiFactory.PanelObject(background.transform, "RouteContent", new Color(0f, 0f, 0f, 0f));
            UiFactory.Anchor(contentObject.GetComponent<RectTransform>(), new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.89f), Vector2.zero, Vector2.zero);
            content = contentObject.GetComponent<RectTransform>();
            RenderRoute();
        }

        private void RenderRoute()
        {
            if (content == null) return;
            switch (app.Navigation.CurrentRoute)
            {
                case GameRoute.Collection: BuildCollection(); break;
                case GameRoute.Deck: BuildDeck(); break;
                case GameRoute.Battle: BuildBattle(); break;
                case GameRoute.Missions: BuildMissions(); break;
                case GameRoute.Economy: BuildEconomy(); break;
                case GameRoute.Profile: BuildProfile(); break;
                default: BuildNexus(); break;
            }
        }

        private void BuildNexus()
        {
            Title("THE NEXUS", "Citadel hub · elige un dominio en el mundo");
            if (app.GameState.SyncState != SyncState.Connected)
            {
                Message("El Nexus espera una sincronización válida de Supabase.\nNo se muestran datos inventados.");
                return;
            }

            var progress = app.GameState.Progress;
            var profile = app.GameState.Profile;
            Message("Sello: " + (profile == null ? "IDENTIDAD NO REPORTADA" : profile.display_name) +
                    "\nNivel: " + (progress == null ? "NO REPORTADO" : progress.level.ToString()) +
                    "\nEnergía: " + (progress == null ? "NO REPORTADA" : progress.energy + " / " + progress.max_energy) +
                    "\nUsa los pedestales del Nexus para entrar a cada dominio.");
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
            var count = Mathf.Min(catalog.Length, 8);
            for (var i = 0; i < count; i++)
            {
                var card = catalog[i];
                var ownership = FindOwnership(card == null ? null : card.id);
                var cardObject = CardRenderer.CreateCard(content, card, ownership, false, false, ownership != null && ownership.locked);
                var column = i % 4;
                var row = i / 4;
                UiFactory.Anchor(cardObject.GetComponent<RectTransform>(),
                    new Vector2(0.02f + column * 0.245f, 0.13f + (1 - row) * 0.31f),
                    new Vector2(0.24f + column * 0.245f, 0.42f + (1 - row) * 0.31f), Vector2.zero, Vector2.zero);
            }
        }

        private void BuildDeck()
        {
            Title("FORGE", "Mesa de forja · validación y persistencia server-authoritative");
            AddReturnRune();
            var ids = new string[app.GameState.Deck.Length];
            var count = Mathf.Min(app.GameState.Deck.Length, 6);
            for (var i = 0; i < app.GameState.Deck.Length; i++)
            {
                var slot = app.GameState.Deck[i];
                ids[i] = slot.card_id;
                if (i >= count) continue;
                var card = FindCard(slot.card_id);
                var cardObject = CardRenderer.CreateCard(content, card, null, false, slot.is_champion, false);
                var column = i % 3;
                var row = i / 3;
                UiFactory.Anchor(cardObject.GetComponent<RectTransform>(),
                    new Vector2(0.04f + column * 0.31f, 0.28f + (1 - row) * 0.27f),
                    new Vector2(0.29f + column * 0.31f, 0.52f + (1 - row) * 0.27f), Vector2.zero, Vector2.zero);
            }
            MessageAt(app.GameState.Deck.Length == 0 ? "FORJA VACIA · SIN SLOTS REPORTADOS" : "La mesa muestra únicamente cartas devueltas por Supabase.", 0.2f);
            ActionButton("VALIDAR EN EL ALTAR", GameRoute.Deck, 0.08f, () => ValidateDeck(ids));
            ActionButton("SELLAR DECK", GameRoute.Deck, 0.0f, () => SaveDeck(ids));
        }

        private void BuildBattle()
        {
            Title("BATTLEFIELD", "Arena de eventos · Supabase resuelve el combate");
            AddReturnRune();
            var board = UiFactory.PanelObject(content, "BattlefieldBoard", new Color(0.04f, 0.025f, 0.03f, 0.88f));
            UiFactory.Anchor(board.GetComponent<RectTransform>(), new Vector2(0.05f, 0.38f), new Vector2(0.95f, 0.76f), Vector2.zero, Vector2.zero);
            var boardText = UiFactory.Label(board.transform, "ARENA EN ESPERA\n\nZONA DEL JUGADOR\n\n— NÚCLEO DE BATALLA —\n\nZONA DEL OPONENTE", 18, UiFactory.Text, TextAnchor.MiddleCenter);
            UiFactory.Stretch(boardText.rectTransform, 10f, 10f, 10f, 10f);
            MessageAt("Unity sólo envía intención y presenta eventos. No se crea un rival local ni se calcula un resultado.", 0.3f);
            var opponentInput = UiFactory.Input(content, "UUID del oponente", false);
            UiFactory.Anchor(opponentInput.GetComponent<RectTransform>(), new Vector2(0.08f, 0.17f), new Vector2(0.92f, 0.25f), Vector2.zero, Vector2.zero);
            ActionButton("ABRIR DESAFIO", GameRoute.Battle, 0.06f, () => ResolveBattle(opponentInput.text));
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
            for (var i = 0; i < Mathf.Min(missions.Length, 5); i++)
            {
                var mission = missions[i];
                var contract = UiFactory.PanelObject(content, "Contract_" + i, UiFactory.PanelGlass);
                UiFactory.Anchor(contract.GetComponent<RectTransform>(), new Vector2(0.08f, 0.54f - i * 0.09f), new Vector2(0.92f, 0.61f - i * 0.09f), Vector2.zero, Vector2.zero);
                var text = UiFactory.Label(contract.transform,
                    CardRenderer.ValueOr(mission.name, "CONTRATO NO REPORTADO") + "  ·  " +
                    CardRenderer.ValueOr(mission.difficulty, "DIFICULTAD NO REPORTADA") +
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
                MessageAt(CardRenderer.ValueOr(result.error, "BATALLA NO DISPONIBLE"), 0.22f);
                return;
            }
            MessageAt("RESULTADO RECIBIDO · " + CardRenderer.ValueOr(result.status, "ESTADO NO REPORTADO"), 0.22f);
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
            var eventText = CardRenderer.ValueOr(battleEvent.event_type, "EVENTO NO REPORTADO") +
                "  ·  " + CardRenderer.ValueOr(battleEvent.actor_id, "ACTOR NO REPORTADO");
            MessageAt(eventText, 0.34f);
        }
    }
}