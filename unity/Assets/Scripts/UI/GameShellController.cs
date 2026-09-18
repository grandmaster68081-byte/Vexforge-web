using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
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
        private bool built;

        private void Start()
        {
            app = VexforgeApp.Instance;
            if (app == null) return;
            if (GetComponent<NexusWorldController>() == null) gameObject.AddComponent<NexusWorldController>();
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
            var background = UiFactory.PanelObject(canvas.transform, "AuthGate", UiFactory.Background);
            UiFactory.Stretch(background.GetComponent<RectTransform>(), 0, 0, 0, 0);
            var panel = UiFactory.PanelObject(background.transform, "AuthPanel", UiFactory.Panel);
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.08f, 0.31f), new Vector2(0.92f, 0.7f), Vector2.zero, Vector2.zero);
            var title = UiFactory.Label(panel.transform, "VEXFORGE", 42, UiFactory.Gold, TextAnchor.MiddleCenter);
            UiFactory.Anchor(title.rectTransform, new Vector2(0.05f, 0.72f), new Vector2(0.95f, 0.9f), Vector2.zero, Vector2.zero);
            var subtitle = UiFactory.Label(panel.transform, "Nexus de desarrollo Unity · Supabase authority", 17, UiFactory.Muted, TextAnchor.MiddleCenter);
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
            var header = UiFactory.PanelObject(background.transform, "Header", UiFactory.Panel);
            UiFactory.Anchor(header.GetComponent<RectTransform>(), new Vector2(0f, 0.89f), new Vector2(1f, 1f), Vector2.zero, Vector2.zero);
            var profileName = app.GameState.Profile != null && !string.IsNullOrWhiteSpace(app.GameState.Profile.display_name)
                ? app.GameState.Profile.display_name
                : "Jugador autenticado";
            var heading = UiFactory.Label(header.transform, "NEXUS  /  " + profileName, 20, UiFactory.Gold);
            UiFactory.Anchor(heading.rectTransform, new Vector2(0.05f, 0.32f), new Vector2(0.72f, 0.78f), Vector2.zero, Vector2.zero);
            var syncText = app.GameState.SyncState == SyncState.Connected ? "SUPABASE · CONNECTED" : app.GameState.SyncState.ToString().ToUpperInvariant();
            var sync = UiFactory.Label(header.transform, syncText, 12, app.GameState.SyncState == SyncState.Connected ? UiFactory.Arcane : UiFactory.Muted, TextAnchor.MiddleRight);
            UiFactory.Anchor(sync.rectTransform, new Vector2(0.63f, 0.32f), new Vector2(0.95f, 0.78f), Vector2.zero, Vector2.zero);

            var contentObject = UiFactory.PanelObject(background.transform, "RouteContent", new Color(0f, 0f, 0f, 0f));
            UiFactory.Anchor(contentObject.GetComponent<RectTransform>(), new Vector2(0.04f, 0.13f), new Vector2(0.96f, 0.87f), Vector2.zero, Vector2.zero);
            content = contentObject.GetComponent<RectTransform>();
            RenderRoute();

            var nav = UiFactory.PanelObject(background.transform, "Navigation", UiFactory.Panel);
            UiFactory.Anchor(nav.GetComponent<RectTransform>(), new Vector2(0f, 0f), new Vector2(1f, 0.11f), Vector2.zero, Vector2.zero);
            AddNavButton(nav.transform, "NEXUS", GameRoute.Nexus, 0);
            AddNavButton(nav.transform, "ARCHIVE", GameRoute.Collection, 1);
            AddNavButton(nav.transform, "FORGE", GameRoute.Deck, 2);
            AddNavButton(nav.transform, "ARENA", GameRoute.Battle, 3);
            AddNavButton(nav.transform, "LEGADO", GameRoute.Profile, 4);
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
            Title("THE NEXUS", "Mundo principal · navegación por dominios reales");
            if (app.GameState.SyncState != SyncState.Connected)
            {
                Message("El Nexus espera una sincronización válida de Supabase. No se muestran datos inventados.");
                return;
            }

            var progress = app.GameState.Progress;
            var profile = app.GameState.Profile;
            Message("Sesión: " + (profile == null ? "identidad no disponible" : profile.display_name) +
                    "\nNivel: " + (progress == null ? "no disponible" : progress.level.ToString()) +
                    "\nEnergía: " + (progress == null ? "no disponible" : progress.energy + " / " + progress.max_energy));
            ActionButton("ARCHIVO DE CARTAS", GameRoute.Collection, 0.7f);
            ActionButton("FORJA DE DECK", GameRoute.Deck, 0.54f);
            ActionButton("ARENA", GameRoute.Battle, 0.38f);
            ActionButton("MISIONES", GameRoute.Missions, 0.22f);
        }

        private void BuildCollection()
        {
            Title("ARCHIVE", "Catálogo y colección cargados desde Supabase");
            Message("Catálogo: " + app.GameState.Catalog.Length + " · Colección: " + app.GameState.Collection.Length);
            var y = 0.7f;
            foreach (var card in app.GameState.Collection)
            {
                if (card == null || card.card == null) continue;
                MessageAt(card.card.name + "  ·  " + card.card.rarity + "  ·  " + card.quantity + "x", y);
                y -= 0.075f;
                if (y < 0.08f) break;
            }
            if (app.GameState.Collection.Length == 0) MessageAt("La colección está vacía o no fue autorizada por el backend.", 0.62f);
        }

        private void BuildDeck()
        {
            Title("FORGE", "Deck actual · las reglas permanecen en RPCs del servidor");
            Message("Slots cargados: " + app.GameState.Deck.Length);
            var y = 0.7f;
            var ids = new string[app.GameState.Deck.Length];
            for (var i = 0; i < app.GameState.Deck.Length; i++)
            {
                var slot = app.GameState.Deck[i];
                ids[i] = slot.card_id;
                MessageAt((slot.is_champion ? "CHAMPION · " : "SLOT " + slot.slot_number + " · ") + slot.name, y);
                y -= 0.07f;
            }
            ActionButton("VALIDAR CON BACKEND", GameRoute.Deck, 0.18f, () => ValidateDeck(ids));
            ActionButton("GUARDAR DECK", GameRoute.Deck, 0.06f, () => SaveDeck(ids));
        }

        private void BuildBattle()
        {
            Title("ARENA", "Resolución competitiva autoritativa");
            Message("Unity solo envía intención. Supabase resuelve el combate y devuelve eventos/resultados.");
            var opponentInput = UiFactory.Input(content, "UUID del oponente", false);
            UiFactory.Anchor(opponentInput.GetComponent<RectTransform>(), new Vector2(0.08f, 0.51f), new Vector2(0.92f, 0.61f), Vector2.zero, Vector2.zero);
            ActionButton("RESOLVER BATALLA", GameRoute.Battle, 0.31f, () => ResolveBattle(opponentInput.text));
            MessageAt("No se crea un rival local ni se calcula un resultado en Unity.", 0.14f);
        }

        private void BuildMissions()
        {
            Title("MISSIONS", "Progreso y recompensas provenientes del backend");
            if (app.GameState.Missions.Length == 0) Message("No hay misiones autorizadas disponibles.");
            var y = 0.7f;
            foreach (var mission in app.GameState.Missions)
            {
                MessageAt(mission.name + "  ·  " + mission.difficulty + "  ·  reward XP " + mission.reward_xp, y);
                y -= 0.075f;
                if (y < 0.08f) break;
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

        private void AddNavButton(Transform parent, string text, GameRoute route, int index)
        {
            var button = UiFactory.Button(parent, text, () => app.Navigation.Navigate(route));
            var rect = button.GetComponent<RectTransform>();
            UiFactory.Anchor(rect, new Vector2(index / 5f, 0.08f), new Vector2((index + 1) / 5f, 0.92f), Vector2.zero, Vector2.zero);
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
            MessageAt(result == null ? "El backend no devolvió resultado." : (result.ok ? "RESULTADO RECIBIDO · " + result.status : result.error), 0.22f);
        }

        private void ClearCanvas()
        {
            for (var i = canvas.transform.childCount - 1; i >= 0; i--) Destroy(canvas.transform.GetChild(i).gameObject);
            content = null;
        }
    }
}