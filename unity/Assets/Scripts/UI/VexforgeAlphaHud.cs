using System;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
using Vexforge.Presentation;
using Vexforge.Session;

namespace Vexforge.UI
{
    /// <summary>
    /// Contextual alpha HUD. It is intentionally small: the world owns navigation and this HUD owns only
    /// status, actions, and transient confirmation. Backend remains authoritative.
    /// </summary>
    public sealed class VexforgeAlphaHud : MonoBehaviour
    {
        private VexforgeApp app;
        private Canvas canvas;
        private VexforgeVirtualizedCardGallery gallery;
        private BattlePresentationDirector battleDirector;
        private VexforgeAlphaWorldDirector world;
        private VexforgeSocialHub socialHub;
        private VexforgeGlobalChatDock globalChatDock;
        private Transform root;
        private Text eventRibbon;
        private InputField opponentInput;
        private CardRecord[] lastCatalog;
        private PlayerCardRecord[] lastCollection;
        private bool initialized;
        private int renderVersion;
        private bool requestInFlight;

        public void Initialize(
            VexforgeApp application,
            Canvas targetCanvas,
            VexforgeVirtualizedCardGallery cardGallery,
            BattlePresentationDirector director,
            VexforgeAlphaWorldDirector worldDirector)
        {
            if (initialized)
                return;

            app = application;
            canvas = targetCanvas;
            gallery = cardGallery;
            battleDirector = director;
            world = worldDirector;
            if (canvas != null)
            {
                socialHub = canvas.gameObject.GetComponent<VexforgeSocialHub>();
                if (socialHub == null)
                    socialHub = canvas.gameObject.AddComponent<VexforgeSocialHub>();
                socialHub.Initialize(app, canvas);

                globalChatDock = canvas.gameObject.GetComponent<VexforgeGlobalChatDock>();
                if (globalChatDock == null)
                    globalChatDock = canvas.gameObject.AddComponent<VexforgeGlobalChatDock>();
                globalChatDock.Initialize(canvas, socialHub);
                globalChatDock.SetVisible(app.Session != null && app.Session.IsAuthenticated);
            }
            if (app.Session != null)
                app.Session.StateChanged += HandleSessionChanged;
            if (battleDirector != null)
            {
                battleDirector.EventPresented += HandleBattleEvent;
                battleDirector.PresentationCompleted += HandleBattleCompleted;
            }
            initialized = true;
        }

        public void RenderRoute(GameRoute route)
        {
            if (!initialized || app == null || canvas == null)
                return;

            if (globalChatDock != null)
                globalChatDock.SetVisible(app.Session != null && app.Session.IsAuthenticated);

            renderVersion++;
            if (route != GameRoute.Battle && battleDirector != null)
                battleDirector.StopAndHide();
            Clear();
            lastCatalog = app.GameState.Catalog;
            lastCollection = app.GameState.Collection;

            if (world != null)
                world.SetRoute(route);

            if (gallery != null)
            {
                var showGallery = route == GameRoute.Collection || route == GameRoute.Deck;
                if (showGallery)
                {
                    gallery.SetData(
                        route == GameRoute.Collection
                            ? app.GameState.Catalog
                            : ResolveDeckCards(),
                        app.GameState.Collection);
                    gallery.Show();
                }
                else
                {
                    gallery.Hide();
                }
            }

            root = new GameObject("AlphaHudRoot", typeof(RectTransform)).transform;
            root.SetParent(canvas.transform, false);

            BuildTopBar(route);

            switch (route)
            {
                case GameRoute.Nexus:
                    BuildNexusHud();
                    break;
                case GameRoute.Collection:
                    BuildArchiveHud();
                    break;
                case GameRoute.Deck:
                    BuildForgeHud();
                    break;
                case GameRoute.Battle:
                    BuildBattleHud();
                    break;
                case GameRoute.Missions:
                    BuildMissionHud();
                    break;
                case GameRoute.Economy:
                    BuildEconomyHud();
                    break;
                case GameRoute.Profile:
                    BuildProfileHud();
                    break;
                default:
                    BuildNexusHud();
                    break;
            }
        }

        private void BuildTopBar(GameRoute route)
        {
            var panel = UiFactory.PanelObject(root, "TopBar", new Color(0.025f, 0.020f, 0.018f, 0.78f));
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.035f, 0.91f), new Vector2(0.965f, 0.985f), Vector2.zero, Vector2.zero);

            var profileName = app.GameState.Profile != null &&
                              !string.IsNullOrWhiteSpace(app.GameState.Profile.display_name)
                ? app.GameState.Profile.display_name
                : "VESSEL";
            var title = UiFactory.Label(root, "VEXFORGE  ·  " + routeLabel(route), 21, UiFactory.Gold, TextAnchor.MiddleLeft);
            UiFactory.Anchor(title.rectTransform, new Vector2(0.055f, 0.93f), new Vector2(0.70f, 0.972f), Vector2.zero, Vector2.zero);

            var player = UiFactory.Label(root, profileName.ToUpperInvariant(), 12, UiFactory.Muted, TextAnchor.MiddleRight);
            UiFactory.Anchor(player.rectTransform, new Vector2(0.70f, 0.93f), new Vector2(0.94f, 0.972f), Vector2.zero, Vector2.zero);
        }

        private void BuildNexusHud()
        {
            var progress = app.GameState.Progress;
            var message = progress == null
                ? "EL NEXUS ESPERA TU SIGUIENTE MOVIMIENTO"
                : "NIVEL " + progress.level + "   ·   ENERGÍA " + progress.energy + " / " + progress.max_energy;
            AddRibbon(message, 0.075f);
            AddHint("TOCA UN DOMINIO DEL NEXUS PARA ENTRAR", 0.035f);
        }

        private void BuildArchiveHud()
        {
            var count = app.GameState.Catalog == null ? 0 : app.GameState.Catalog.Length;
            AddRibbon("ARCHIVE  ·  " + count + " CARTAS DISPONIBLES", 0.075f);
            AddHint("DESLIZA PARA RECORRER · TOCA UNA CARTA PARA INSPECCIONAR", 0.035f);
            AddBackButton(0.055f);
        }

        private void BuildForgeHud()
        {
            var slots = app.GameState.Deck == null ? 0 : app.GameState.Deck.Length;
            AddRibbon("FORGE  ·  " + slots + " SLOTS REPORTADOS", 0.075f);
            AddHint("LA VALIDACIÓN Y EL SELLADO SON AUTORIZADOS POR SUPABASE", 0.035f);
            AddAction("VALIDAR EN EL ALTAR", 0.16f, ValidateDeck);
            AddAction("SELLAR DECK", 0.065f, SaveDeck);
            AddBackButton(0.27f);
        }

        private void BuildBattleHud()
        {
            AddRibbon("BATTLEFIELD  ·  ESTADO AUTORIZADO POR EL SERVIDOR", 0.075f);
            AddHint("INTRODUCE EL OPONENTE Y ABRE EL DESAFÍO", 0.035f);

            opponentInput = UiFactory.Input(root, "UUID DEL OPONENTE", false);
            UiFactory.Anchor(opponentInput.GetComponent<RectTransform>(), new Vector2(0.10f, 0.15f), new Vector2(0.90f, 0.215f), Vector2.zero, Vector2.zero);

            AddAction("ABRIR DESAFÍO", 0.075f, ResolveBattle);
            AddBackButton(0.28f);

            eventRibbon = UiFactory.Label(root, "", 13, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Anchor(eventRibbon.rectTransform, new Vector2(0.17f, 0.875f), new Vector2(0.83f, 0.905f), Vector2.zero, Vector2.zero);
        }

        private void BuildMissionHud()
        {
            var missions = app.GameState.Missions;
            AddRibbon("MISSIONS  ·  ACTIVIDAD DEL MUNDO", 0.075f);
            AddHint("LOS CONTRATOS DEBEN LLEVAR AL JUGADOR HACIA LA ACCIÓN", 0.035f);
            AddBackButton(0.055f);

            if (missions == null || missions.Length == 0)
            {
                AddInfo("NO HAY CONTRATOS DISPONIBLES EN LA SESIÓN ACTUAL.", 0.52f);
                return;
            }

            var top = 0.67f;
            var step = Mathf.Min(0.105f, 0.46f / Mathf.Max(1, missions.Length));
            for (var i = 0; i < missions.Length; i++)
            {
                var mission = missions[i];
                if (mission == null) continue;
                var panel = UiFactory.PanelObject(root, "Mission_" + i, UiFactory.PanelGlass);
                UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.07f, top - i * step), new Vector2(0.93f, top + 0.055f - i * step), Vector2.zero, Vector2.zero);
                var text = UiFactory.Label(
                    panel.transform,
                    ValueOr(mission.name, "CONTRATO") + "  ·  " + ValueOr(mission.difficulty, "DIFICULTAD") + "  ·  XP " + mission.reward_xp,
                    14,
                    UiFactory.Text,
                    TextAnchor.MiddleCenter);
                UiFactory.Stretch(text.rectTransform, 10f, 5f, 10f, 5f);
            }
        }

        private void BuildEconomyHud()
        {
            AddRibbon("TREASURY  ·  ESTADO ECONÓMICO REPORTADO", 0.075f);
            AddBackButton(0.055f);
            var wallet = app.GameState.Wallet;
            AddInfo(
                wallet == null
                    ? "CARTERA NO REPORTADA POR LA SESIÓN ACTUAL."
                    : "VEX IN-GAME  " + wallet.vex_ingame +
                      "\nVEX TRADEABLE  " + wallet.vex_tradeable +
                      "\nRESERVADO IN-GAME  " + wallet.reserved_ingame +
                      "\nRESERVADO TRADEABLE  " + wallet.reserved_tradeable,
                0.47f);
        }

        private void BuildProfileHud()
        {
            AddRibbon("HALL  ·  TU IDENTIDAD EN VEXFORGE", 0.075f);
            AddBackButton(0.055f);
            var profile = app.GameState.Profile;
            var progress = app.GameState.Progress;
            AddInfo(
                profile == null
                    ? "PERFIL NO REPORTADO."
                    : ValueOr(profile.display_name, "VESSEL") +
                      "\nROL  " + ValueOr(profile.role, "NO REPORTADO") +
                      "\nESTADO  " + ValueOr(profile.status, "NO REPORTADO") +
                      "\nNIVEL  " + (progress == null ? "—" : progress.level.ToString()),
                0.47f);
            AddAction("HALL DE ALIADOS", 0.20f, OpenSocialHub);
            AddAction("CERRAR SESIÓN", 0.105f, () => app.SignOut());
        }

        private void OpenSocialHub()
        {
            if (socialHub != null)
                socialHub.OpenFriends();
        }

        private void HandleSessionChanged(AuthState _)
        {
            if (app == null || app.Session == null || app.Session.IsAuthenticated) return;
            if (socialHub != null) socialHub.Close();
            if (globalChatDock != null) globalChatDock.SetVisible(false);
        }

        public void HideForSignedOut()
        {
            renderVersion++;
            requestInFlight = false;
            if (socialHub != null) socialHub.Close();
            if (globalChatDock != null) globalChatDock.SetVisible(false);
            Clear();
        }

        private void AddRibbon(string value, float y)
        {
            var panel = UiFactory.PanelObject(root, "Ribbon_" + y, new Color(0.02f, 0.018f, 0.022f, 0.52f));
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.08f, y), new Vector2(0.92f, y + 0.045f), Vector2.zero, Vector2.zero);
            var text = UiFactory.Label(panel.transform, value, 12, UiFactory.Arcane, TextAnchor.MiddleCenter);
            UiFactory.Stretch(text.rectTransform, 5f, 1f, 5f, 1f);
        }

        private void AddHint(string value, float y)
        {
            var text = UiFactory.Label(root, value, 11, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Anchor(text.rectTransform, new Vector2(0.12f, y), new Vector2(0.88f, y + 0.03f), Vector2.zero, Vector2.zero);
        }

        private void AddInfo(string value, float y)
        {
            var panel = UiFactory.PanelObject(root, "Info_" + y, UiFactory.PanelGlass);
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.14f, y), new Vector2(0.86f, y + 0.20f), Vector2.zero, Vector2.zero);
            var text = UiFactory.Label(panel.transform, value, 16, UiFactory.Text, TextAnchor.MiddleCenter);
            UiFactory.Stretch(text.rectTransform, 12f, 8f, 12f, 8f);
        }

        private void AddBackButton(float y)
        {
            AddAction("VOLVER AL NEXUS", y, () => app.Navigation.Navigate(GameRoute.Nexus));
        }

        private void AddAction(string label, float y, Action action)
        {
            var button = UiFactory.Button(root, label, () => action());
            UiFactory.Anchor(button.GetComponent<RectTransform>(), new Vector2(0.18f, y), new Vector2(0.82f, y + 0.075f), Vector2.zero, Vector2.zero);
        }

        private async void ValidateDeck()
        {
            if (requestInFlight) return;
            requestInFlight = true;
            var version = renderVersion;
            var route = app.Navigation.CurrentRoute;
            try
            {
                var ids = ResolveDeckIds();
                var result = await app.Repository.ValidateDeckAsync(ids);
                if (!IsCurrentRequest(version, route)) return;
                AddTransientMessage(
                    result == null
                        ? "VALIDACIÓN NO REPORTADA"
                        : result.valid ? "DECK VALIDADO POR EL SERVIDOR" : string.Join("\n", result.errors ?? new string[0]));
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrentRequest(version, route))
                    AddTransientMessage("VALIDACIÓN INTERRUMPIDA · " + ex.GetType().Name);
            }
            finally
            {
                requestInFlight = false;
            }
        }

        private async void SaveDeck()
        {
            if (requestInFlight) return;
            requestInFlight = true;
            var version = renderVersion;
            var route = app.Navigation.CurrentRoute;
            try
            {
                var ids = ResolveDeckIds();
                var result = await app.Repository.SaveDeckAsync(ids);
                if (!IsCurrentRequest(version, route)) return;
                AddTransientMessage(
                    result == null
                        ? "GUARDADO NO REPORTADO"
                        : result.ok ? "DECK SELLADO" : ValueOr(result.reason, "OPERACIÓN NO CONFIRMADA"));
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrentRequest(version, route))
                    AddTransientMessage("SELLADO INTERRUMPIDO · " + ex.GetType().Name);
            }
            finally
            {
                requestInFlight = false;
            }
        }

        private async void ResolveBattle()
        {
            if (requestInFlight ||
                (battleDirector != null && battleDirector.State == PresentationState.Playing) ||
                opponentInput == null ||
                string.IsNullOrWhiteSpace(opponentInput.text) ||
                app.Session.Current == null)
                return;

            requestInFlight = true;
            var version = renderVersion;
            var route = app.Navigation.CurrentRoute;
            var opponentId = opponentInput.text.Trim();
            try
            {
                var result = await app.Repository.ResolveBattleAsync(
                    app.GameState.PlayerId,
                    opponentId,
                    Guid.NewGuid().ToString("N"));

                if (!IsCurrentRequest(version, route)) return;
                if (result == null)
                {
                    AddTransientMessage("EL SERVIDOR NO DEVOLVIÓ RESULTADO");
                    return;
                }

                if (!result.ok)
                {
                    AddTransientMessage(ValueOr(result.error, "BATALLA NO DISPONIBLE"));
                    return;
                }

                if (battleDirector == null || !battleDirector.IsInitialized)
                {
                    AddTransientMessage("PRESENTACIÓN DE BATALLA NO INICIALIZADA");
                    return;
                }

                if (battleDirector != null)
                {
                    battleDirector.SetLocalPlayerId(app.GameState.PlayerId);
                    battleDirector.Play(result.events);
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrentRequest(version, route))
                    AddTransientMessage("BATALLA INTERRUMPIDA · " + ex.GetType().Name);
            }
            finally
            {
                requestInFlight = false;
            }
        }

        private bool IsCurrentRequest(int version, GameRoute route)
        {
            return initialized && version == renderVersion && app != null && app.Session != null &&
                   app.Session.IsAuthenticated && app.Navigation.CurrentRoute == route;
        }

        private void HandleBattleEvent(BattleEvent _)
        {
            if (eventRibbon != null)
                eventRibbon.text = "EL TABLERO RESPONDE";
        }

        private async void HandleBattleCompleted()
        {
            if (app == null || app.Session == null || !app.Session.IsAuthenticated)
                return;

            var version = renderVersion;
            var route = app.Navigation.CurrentRoute;
            try
            {
                await app.GameState.RefreshAsync();
                if (!IsCurrentRequest(version, route))
                    return;
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrentRequest(version, route))
                    AddTransientMessage("SINCRONIZACIÓN POST-COMBATE INTERRUMPIDA · " + ex.GetType().Name);
            }
        }

        private void AddTransientMessage(string text)
        {
            if (root == null) return;
            var panel = UiFactory.PanelObject(root, "TransientMessage", new Color(0.04f, 0.03f, 0.025f, 0.84f));
            UiFactory.Anchor(panel.GetComponent<RectTransform>(), new Vector2(0.12f, 0.30f), new Vector2(0.88f, 0.43f), Vector2.zero, Vector2.zero);
            var label = UiFactory.Label(panel.transform, text, 13, UiFactory.Gold, TextAnchor.MiddleCenter);
            UiFactory.Stretch(label.rectTransform, 12f, 8f, 12f, 8f);
        }

        private CardRecord[] ResolveDeckCards()
        {
            var slots = app.GameState.Deck;
            if (slots == null)
                return new CardRecord[0];
            var cards = new CardRecord[slots.Length];
            for (var i = 0; i < slots.Length; i++)
            {
                cards[i] = FindCard(slots[i].card_id);
            }
            return cards;
        }

        private string[] ResolveDeckIds()
        {
            var slots = app.GameState.Deck;
            if (slots == null)
                return new string[0];
            var ids = new string[slots.Length];
            for (var i = 0; i < slots.Length; i++)
                ids[i] = slots[i].card_id;
            return ids;
        }

        private CardRecord FindCard(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) || app.GameState.Catalog == null)
                return null;
            for (var i = 0; i < app.GameState.Catalog.Length; i++)
            {
                var card = app.GameState.Catalog[i];
                if (card != null && card.id == cardId)
                    return card;
            }
            return null;
        }

        private static string routeLabel(GameRoute route)
        {
            switch (route)
            {
                case GameRoute.Nexus: return "NEXUS";
                case GameRoute.Collection: return "ARCHIVE";
                case GameRoute.Deck: return "FORGE";
                case GameRoute.Battle: return "BATTLEFIELD";
                case GameRoute.Missions: return "MISSIONS";
                case GameRoute.Economy: return "TREASURY";
                case GameRoute.Profile: return "HALL";
                default: return "BOOT";
            }
        }

        private static string ValueOr(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private void Clear()
        {
            renderVersion++;
            opponentInput = null;
            eventRibbon = null;
            if (root != null)
                Destroy(root.gameObject);
            root = null;
        }

        private void OnDestroy()
        {
            initialized = false;
            renderVersion++;
            requestInFlight = false;
            if (app != null && app.Session != null)
                app.Session.StateChanged -= HandleSessionChanged;
            if (socialHub != null) socialHub.Close();
            if (battleDirector != null)
            {
                battleDirector.EventPresented -= HandleBattleEvent;
                battleDirector.PresentationCompleted -= HandleBattleCompleted;
            }
        }
    }
}
