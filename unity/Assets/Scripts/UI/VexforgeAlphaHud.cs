using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.GameState;
using Vexforge.Presentation;
using Vexforge.Session;
using Vexforge.Tier1;

namespace Vexforge.UI
{
    /// <summary>
    /// Contextual alpha HUD. The world owns navigation; this HUD presents route state and actions.
    /// Backend remains authoritative.
    /// </summary>
    public sealed class VexforgeAlphaHud : MonoBehaviour
    {
        private const int MaxFormationSlots = 30;
        private const int DraftRowsPerPage = 4;

        private enum CollectionFilterMode
        {
            All,
            Owned,
            Missing
        }

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
        private CollectionFilterMode collectionFilter;
        private string collectionQuery = string.Empty;
        private readonly List<string> deckDraftIds = new List<string>();
        private string deckDraftPlayerId;
        private int deckDraftPage;
        private bool deckDraftInitialized;
        private Text archiveSummary;
        private GameObject archiveEmptyPanel;
        private Transform deckDraftPanel;
        private GameObject transientMessagePanel;
        private Text transientMessageLabel;
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

            if (VexforgeTier1RouteOwnership.Owns(route))
            {
                renderVersion++;
                if (globalChatDock != null) globalChatDock.SetVisible(false);
                if (route != GameRoute.Battle && battleDirector != null) battleDirector.StopAndHide();
                if (world != null) world.SetRoute(route);
                if (gallery != null) gallery.Hide();
                Clear();
                return;
            }

            if (globalChatDock != null)
                globalChatDock.SetVisible(app.Session != null && app.Session.IsAuthenticated);

            renderVersion++;
            if (route != GameRoute.Battle && battleDirector != null)
                battleDirector.StopAndHide();
            Clear();
            lastCatalog = app.GameState.Catalog ?? new CardRecord[0];
            lastCollection = app.GameState.Collection ?? new PlayerCardRecord[0];
            if (route == GameRoute.Deck)
                EnsureDeckDraft();

            if (world != null)
                world.SetRoute(route);

            if (gallery != null)
            {
                var showGallery = route == GameRoute.Collection || route == GameRoute.Deck;
                if (showGallery && app.GameState.SyncState == SyncState.Connected)
                {
                    gallery.SetData(
                        route == GameRoute.Collection
                            ? FilterCollectionCards()
                            : ResolveOwnedCards(),
                        lastCollection);
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
            if (app.GameState.SyncState != SyncState.Connected)
            {
                AddInfo(SyncStatusMessage("ARCHIVE"), 0.47f);
                return;
            }

            var search = UiFactory.Input(root, "Buscar nombre, código, facción o rareza", false);
            search.text = collectionQuery;
            UiFactory.Anchor(
                search.GetComponent<RectTransform>(),
                new Vector2(0.11f, 0.82f),
                new Vector2(0.89f, 0.875f),
                Vector2.zero,
                Vector2.zero);
            search.onValueChanged.AddListener(HandleCollectionSearchChanged);

            AddArchiveFilterButton("TODAS", CollectionFilterMode.All, 0.06f, 0.34f);
            AddArchiveFilterButton("POSEÍDAS", CollectionFilterMode.Owned, 0.36f, 0.64f);
            AddArchiveFilterButton("NO POSEÍDAS", CollectionFilterMode.Missing, 0.66f, 0.94f);

            archiveSummary = UiFactory.Label(root, string.Empty, 11, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Anchor(
                archiveSummary.rectTransform,
                new Vector2(0.07f, 0.68f),
                new Vector2(0.93f, 0.72f),
                Vector2.zero,
                Vector2.zero);

            archiveEmptyPanel = UiFactory.PanelObject(root, "ArchiveEmptyState", UiFactory.PanelGlass);
            UiFactory.Anchor(
                archiveEmptyPanel.GetComponent<RectTransform>(),
                new Vector2(0.16f, 0.43f),
                new Vector2(0.84f, 0.57f),
                Vector2.zero,
                Vector2.zero);
            var emptyLabel = UiFactory.Label(
                archiveEmptyPanel.transform,
                string.Empty,
                15,
                UiFactory.Muted,
                TextAnchor.MiddleCenter);
            UiFactory.Stretch(emptyLabel.rectTransform, 12f, 8f, 12f, 8f);
            UpdateArchiveView();
        }

        private void AddArchiveFilterButton(
            string label,
            CollectionFilterMode mode,
            float minX,
            float maxX)
        {
            var selected = collectionFilter == mode;
            var button = UiFactory.Button(
                root,
                selected ? "● " + label : label,
                () =>
                {
                    collectionFilter = mode;
                    RenderRoute(GameRoute.Collection);
                });
            var colors = button.colors;
            colors.normalColor = selected ? UiFactory.CardSelected : UiFactory.PanelLight;
            button.colors = colors;
            UiFactory.Anchor(
                button.GetComponent<RectTransform>(),
                new Vector2(minX, 0.75f),
                new Vector2(maxX, 0.805f),
                Vector2.zero,
                Vector2.zero);
            var text = button.GetComponentInChildren<Text>();
            if (text != null)
                text.fontSize = 12;
        }

        private void HandleCollectionSearchChanged(string value)
        {
            collectionQuery = value ?? string.Empty;
            UpdateArchiveView();
        }

        private void UpdateArchiveView()
        {
            var filtered = FilterCollectionCards();
            if (gallery != null)
                gallery.SetData(filtered, lastCollection);

            if (archiveSummary != null)
            {
                archiveSummary.text =
                    "MOSTRANDO " + filtered.Length + " / " + lastCatalog.Length +
                    "  ·  TIPOS POSEÍDOS " + CountOwnedCatalogCards();
            }

            if (archiveEmptyPanel != null)
            {
                archiveEmptyPanel.SetActive(filtered.Length == 0);
                var label = archiveEmptyPanel.GetComponentInChildren<Text>();
                if (label != null)
                {
                    label.text = lastCatalog.Length == 0
                        ? "EL CATÁLOGO NO DEVOLVIÓ CARTAS."
                        : "NINGUNA CARTA COINCIDE CON LOS FILTROS.";
                }
            }
        }

        private void BuildForgeHud()
        {
            if (app.GameState.SyncState != SyncState.Connected)
            {
                AddInfo(SyncStatusMessage("FORGE"), 0.47f);
                return;
            }

            AddDraftPanel();
            AddAction("VALIDAR BORRADOR EN SUPABASE", 0.245f, ValidateDeck);
            AddAction("GUARDAR FORMACIÓN", 0.155f, SaveDeck);
        }

        private string SyncStatusMessage(string surface)
        {
            if (app == null || app.GameState == null)
                return surface + " · ESTADO NO DISPONIBLE.";

            if (app.GameState.SyncState == SyncState.Loading)
                return surface + " · SINCRONIZANDO CON SUPABASE.";
            if (app.GameState.SyncState == SyncState.Error)
                return surface + " · " + ValueOr(app.GameState.LastError, "NO SE PUDO CARGAR EL ESTADO.");
            if (app.GameState.SyncState == SyncState.Unavailable)
                return surface + " · SE REQUIERE UNA SESIÓN AUTENTICADA.";
            return surface + " · DATOS AUTORITATIVOS NO DISPONIBLES.";
        }

        private CardRecord[] FilterCollectionCards()
        {
            var result = new List<CardRecord>();
            var query = collectionQuery.Trim();
            if (lastCatalog == null)
                return result.ToArray();

            for (var i = 0; i < lastCatalog.Length; i++)
            {
                var card = lastCatalog[i];
                if (card == null)
                    continue;

                var ownership = FindOwnership(card.id);
                var owned = ownership != null && ownership.quantity > 0;
                if (collectionFilter == CollectionFilterMode.Owned && !owned)
                    continue;
                if (collectionFilter == CollectionFilterMode.Missing && owned)
                    continue;

                if (query.Length > 0 &&
                    !ContainsIgnoreCase(card.name, query) &&
                    !ContainsIgnoreCase(card.code, query) &&
                    !ContainsIgnoreCase(card.faction, query) &&
                    !ContainsIgnoreCase(card.rarity, query) &&
                    !ContainsIgnoreCase(card.specialization, query))
                    continue;

                result.Add(card);
            }

            return result.ToArray();
        }

        private int CountOwnedCatalogCards()
        {
            var count = 0;
            if (lastCatalog == null)
                return count;

            for (var i = 0; i < lastCatalog.Length; i++)
            {
                var card = lastCatalog[i];
                var owned = card == null ? null : FindOwnership(card.id);
                if (owned != null && owned.quantity > 0)
                    count++;
            }

            return count;
        }

        private CardRecord[] ResolveOwnedCards()
        {
            var cards = new List<CardRecord>();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            if (lastCollection == null)
                return cards.ToArray();

            for (var i = 0; i < lastCollection.Length; i++)
            {
                var owned = lastCollection[i];
                if (owned == null || owned.quantity <= 0 ||
                    string.IsNullOrWhiteSpace(owned.card_id) ||
                    !seen.Add(owned.card_id))
                    continue;

                var card = FindCard(owned.card_id);
                if (card != null)
                    cards.Add(card);
            }

            return cards.ToArray();
        }

        private PlayerCardRecord FindOwnership(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) || lastCollection == null)
                return null;

            for (var i = 0; i < lastCollection.Length; i++)
            {
                var owned = lastCollection[i];
                if (owned != null && owned.card_id == cardId)
                    return owned;
            }

            return null;
        }

        private static bool ContainsIgnoreCase(string source, string query)
        {
            return !string.IsNullOrEmpty(source) &&
                   source.IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private void EnsureDeckDraft()
        {
            if (app == null || app.GameState == null ||
                app.GameState.SyncState != SyncState.Connected ||
                string.IsNullOrWhiteSpace(app.GameState.PlayerId))
                return;

            if (deckDraftInitialized &&
                string.Equals(deckDraftPlayerId, app.GameState.PlayerId, StringComparison.Ordinal))
                return;

            deckDraftIds.Clear();
            var saved = app.GameState.Deck ?? new DeckSlot[0];
            for (var i = 0; i < saved.Length; i++)
            {
                if (saved[i] != null && !string.IsNullOrWhiteSpace(saved[i].card_id))
                    deckDraftIds.Add(saved[i].card_id);
            }

            deckDraftPlayerId = app.GameState.PlayerId;
            deckDraftInitialized = true;
            deckDraftPage = 0;
        }

        private void AddDraftPanel()
        {
            EnsureDeckDraft();
            if (root == null)
                return;

            deckDraftPanel = UiFactory.PanelObject(
                root,
                "FormationDraft",
                new Color(0.025f, 0.020f, 0.018f, 0.91f)).transform;
            UiFactory.Anchor(
                deckDraftPanel.GetComponent<RectTransform>(),
                new Vector2(0.045f, 0.48f),
                new Vector2(0.955f, 0.78f),
                Vector2.zero,
                Vector2.zero);

            var pageCount = Mathf.Max(1, Mathf.CeilToInt(deckDraftIds.Count / (float)DraftRowsPerPage));
            deckDraftPage = Mathf.Clamp(deckDraftPage, 0, pageCount - 1);

            var heading = UiFactory.Label(
                deckDraftPanel,
                "FORMACIÓN BORRADOR  ·  " + deckDraftIds.Count + " / " + MaxFormationSlots +
                "  ·  VALIDA Y GUARDA CON SUPABASE",
                12,
                UiFactory.Gold,
                TextAnchor.MiddleCenter);
            UiFactory.Anchor(
                heading.rectTransform,
                new Vector2(0.035f, 0.84f),
                new Vector2(0.965f, 0.98f),
                Vector2.zero,
                Vector2.zero);

            if (deckDraftIds.Count == 0)
            {
                var empty = UiFactory.Label(
                    deckDraftPanel,
                    "SIN CARTAS EN EL BORRADOR\nVuelve a ARCHIVE y toca cartas poseídas para añadirlas.",
                    13,
                    UiFactory.Muted,
                    TextAnchor.MiddleCenter);
                UiFactory.Anchor(
                    empty.rectTransform,
                    new Vector2(0.08f, 0.30f),
                    new Vector2(0.92f, 0.79f),
                    Vector2.zero,
                    Vector2.zero);
            }
            else
            {
                var start = deckDraftPage * DraftRowsPerPage;
                var end = Mathf.Min(deckDraftIds.Count, start + DraftRowsPerPage);
                for (var index = start; index < end; index++)
                    AddDraftRow(index);
            }

            AddCompactButton(
                deckDraftPanel,
                "<",
                () =>
                {
                    deckDraftPage = Mathf.Max(0, deckDraftPage - 1);
                    RebuildDraftPanel();
                },
                new Vector2(0.055f, 0.025f),
                new Vector2(0.23f, 0.17f)).interactable = deckDraftPage > 0;

            var pageLabel = UiFactory.Label(
                deckDraftPanel,
                "PÁGINA " + (deckDraftPage + 1) + " / " + pageCount,
                10,
                UiFactory.Muted,
                TextAnchor.MiddleCenter);
            UiFactory.Anchor(
                pageLabel.rectTransform,
                new Vector2(0.30f, 0.025f),
                new Vector2(0.70f, 0.17f),
                Vector2.zero,
                Vector2.zero);

            AddCompactButton(
                deckDraftPanel,
                ">",
                () =>
                {
                    deckDraftPage = Mathf.Min(pageCount - 1, deckDraftPage + 1);
                    RebuildDraftPanel();
                },
                new Vector2(0.77f, 0.025f),
                new Vector2(0.945f, 0.17f)).interactable = deckDraftPage < pageCount - 1;
        }

        private void AddDraftRow(int index)
        {
            var card = FindCard(deckDraftIds[index]);
            var title = card == null
                ? "Carta no disponible"
                : ValueOr(card.name, "Identidad sin nombre") +
                  " · " + ValueOr(card.rarity, "RAREZA NO REPORTADA") +
                  " · " + ValueOr(card.faction, "FACCIÓN NO REPORTADA");

            var rowTop = 0.79f - (index % DraftRowsPerPage) * 0.16f;
            var rowBottom = rowTop - 0.13f;
            var label = UiFactory.Label(
                deckDraftPanel,
                String.Format("{0:00}  {1}", index + 1, title),
                11,
                UiFactory.Text,
                TextAnchor.MiddleLeft);
            UiFactory.Anchor(
                label.rectTransform,
                new Vector2(0.035f, rowBottom),
                new Vector2(0.49f, rowTop),
                Vector2.zero,
                Vector2.zero);

            var up = AddCompactButton(
                deckDraftPanel,
                "SUBIR",
                () => MoveDraftCard(index, -1),
                new Vector2(0.505f, rowBottom),
                new Vector2(0.65f, rowTop));
            up.interactable = index > 0;

            var down = AddCompactButton(
                deckDraftPanel,
                "BAJAR",
                () => MoveDraftCard(index, 1),
                new Vector2(0.66f, rowBottom),
                new Vector2(0.805f, rowTop));
            down.interactable = index < deckDraftIds.Count - 1;

            AddCompactButton(
                deckDraftPanel,
                "QUITAR",
                () => RemoveDraftCard(index),
                new Vector2(0.815f, rowBottom),
                new Vector2(0.965f, rowTop));
        }

        private Button AddCompactButton(
            Transform parent,
            string label,
            Action action,
            Vector2 min,
            Vector2 max)
        {
            var button = UiFactory.Button(parent, label, () => action());
            var text = button.GetComponentInChildren<Text>();
            if (text != null)
            {
                text.fontSize = 10;
                text.resizeTextForBestFit = true;
                text.resizeTextMinSize = 8;
                text.resizeTextMaxSize = 12;
            }
            UiFactory.Anchor(button.GetComponent<RectTransform>(), min, max, Vector2.zero, Vector2.zero);
            return button;
        }

        private void RebuildDraftPanel()
        {
            if (deckDraftPanel != null)
                Destroy(deckDraftPanel.gameObject);
            deckDraftPanel = null;
            if (root != null && app != null && app.Navigation.CurrentRoute == GameRoute.Deck)
                AddDraftPanel();
        }

        private void MoveDraftCard(int index, int offset)
        {
            if (requestInFlight)
                return;
            var target = index + offset;
            if (index < 0 || index >= deckDraftIds.Count || target < 0 || target >= deckDraftIds.Count)
                return;

            var cardId = deckDraftIds[index];
            deckDraftIds.RemoveAt(index);
            deckDraftIds.Insert(target, cardId);
            deckDraftPage = target / DraftRowsPerPage;
            RebuildDraftPanel();
        }

        private void RemoveDraftCard(int index)
        {
            if (requestInFlight)
                return;
            if (index < 0 || index >= deckDraftIds.Count)
                return;

            deckDraftIds.RemoveAt(index);
            deckDraftPage = Mathf.Min(
                deckDraftPage,
                Mathf.Max(0, Mathf.CeilToInt(deckDraftIds.Count / (float)DraftRowsPerPage) - 1));
            RebuildDraftPanel();
        }

        public bool TryAddDeckCard(CardRecord card)
        {
            if (app == null || app.Navigation.CurrentRoute != GameRoute.Deck)
                return false;

            if (requestInFlight)
            {
                AddTransientMessage("ESPERA A QUE TERMINE LA VALIDACIÓN O EL GUARDADO.");
                return true;
            }

            EnsureDeckDraft();
            if (card == null)
                return true;

            var ownership = FindOwnership(card.id);
            if (ownership == null || ownership.quantity <= 0)
            {
                AddTransientMessage("EL SERVIDOR NO REPORTA ESTA CARTA COMO POSEÍDA.");
                return true;
            }
            if (deckDraftIds.Count >= MaxFormationSlots)
            {
                AddTransientMessage("EL BORRADOR ALCANZÓ EL MÁXIMO DE 30 SLOTS.");
                return true;
            }

            deckDraftIds.Add(card.id);
            deckDraftPage = (deckDraftIds.Count - 1) / DraftRowsPerPage;
            RebuildDraftPanel();
            AddTransientMessage("AÑADIDA AL BORRADOR · " + ValueOr(card.name, "CARTA"));
            return true;
        }

        public void ShowCardDetails(CardRecord card, PlayerCardRecord ownership, Action close)
        {
            if (root == null || card == null)
                return;

            var panel = UiFactory.PanelObject(
                root,
                "CardDetailPanel",
                new Color(0.018f, 0.014f, 0.012f, 0.97f));
            UiFactory.Anchor(
                panel.GetComponent<RectTransform>(),
                new Vector2(0.08f, 0.27f),
                new Vector2(0.92f, 0.74f),
                Vector2.zero,
                Vector2.zero);

            var title = UiFactory.Label(
                panel.transform,
                ValueOr(card.name, "Identidad sin nombre"),
                22,
                UiFactory.Gold,
                TextAnchor.MiddleCenter);
            UiFactory.Anchor(
                title.rectTransform,
                new Vector2(0.06f, 0.80f),
                new Vector2(0.94f, 0.97f),
                Vector2.zero,
                Vector2.zero);

            var ownershipText = ownership == null || ownership.quantity <= 0
                ? "NO POSEÍDA"
                : "POSEES " + ownership.quantity +
                  (ownership.locked ? " · BLOQUEADA" : string.Empty) +
                  (ownership.listed ? " · PUBLICADA" : string.Empty);
            var lore = ValueOr(card.lore, "El registro no incluye lore.");
            if (lore.Length > 220)
                lore = lore.Substring(0, 217) + "...";
            var details =
                "CÓDIGO  " + ValueOr(card.code, "NO REPORTADO") +
                "\nRAREZA  " + ValueOr(card.rarity, "NO REPORTADA") +
                "   ·   FACCIÓN  " + ValueOr(card.faction, "NO REPORTADA") +
                "\nESPECIALIZACIÓN  " + ValueOr(card.specialization, "NO REPORTADA") +
                "\nPODER  " + card.power +
                "   ·   AFINIDAD  " + card.affinity +
                "   ·   PRESTIGIO  " + card.prestige +
                "   ·   CARGA  " + card.charge +
                "\nPROPIEDAD  " + ownershipText +
                "\n\n" + lore;
            var body = UiFactory.Label(
                panel.transform,
                details,
                14,
                UiFactory.Text,
                TextAnchor.UpperLeft);
            UiFactory.Anchor(
                body.rectTransform,
                new Vector2(0.08f, 0.22f),
                new Vector2(0.92f, 0.77f),
                Vector2.zero,
                Vector2.zero);

            var closeButton = UiFactory.Button(panel.transform, "CERRAR DETALLE", () => close());
            UiFactory.Anchor(
                closeButton.GetComponent<RectTransform>(),
                new Vector2(0.20f, 0.045f),
                new Vector2(0.80f, 0.19f),
                Vector2.zero,
                Vector2.zero);
        }

        private void BuildBattleHud()
        {
            // Tier-1 BattleGate owns the battle entry surface. Legacy controls are intentionally absent.
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
            var profile = app.GameState.Profile;
            var progress = app.GameState.Progress;
            var stats = app.GameState.Stats;
            var rank = app.GameState.Rank;
            AddInfo(
                profile == null
                    ? "PERFIL NO REPORTADO."
                    : ValueOr(profile.display_name, "VESSEL") +
                      "\nROL  " + ValueOr(profile.role, "NO REPORTADO") +
                      "\nESTADO  " + ValueOr(profile.status, "NO REPORTADO") +
                      "\nNIVEL  " + (progress == null ? "—" : progress.level.ToString()) +
                      "  ·  RANGO  " + (rank == null ? "NO REPORTADO" : ValueOr(rank.tier, "NO REPORTADO")) +
                      "\nPVP  " + (stats == null ? "—" : stats.pvp_wins.ToString()) +
                      "  ·  MISIONES  " + (stats == null ? "—" : stats.missions_completed.ToString()) +
                      "\nCARTAS  " + (stats == null ? "—" : stats.cards_owned.ToString()) +
                      "  ·  VENTAS  " + (stats == null ? "—" : stats.market_sales.ToString()) +
                      "  ·  JEFES  " + (stats == null ? "—" : stats.boss_kills.ToString()) +
                      "  ·  PACKS  " + (stats == null ? "—" : stats.packs_opened.ToString()),
                0.47f);
            AddAction("HALL DE ALIADOS", 0.30f, OpenSocialHub);
            AddAction("REPASAR TUTORIAL", 0.21f, OpenTutorialFromProfile);
            AddAction("CERRAR SESIÓN", 0.12f, () => app.SignOut());
        }

        private void OpenTutorialFromProfile()
        {
            var director = FindFirstObjectByType<VexforgeTier1TutorialDirector>(FindObjectsInactive.Include);
            if (director == null)
            {
                AddTransientMessage("EL TUTORIAL NO ESTÁ DISPONIBLE.");
                return;
            }

            app.Navigation.Navigate(GameRoute.Nexus);
            director.OpenFromStart();
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
                var message = result == null
                    ? "VALIDACIÓN NO REPORTADA"
                    : result.valid
                        ? "FORMACIÓN VALIDADA POR EL SERVIDOR"
                        : result.errors == null || result.errors.Length == 0
                            ? "EL BORRADOR NO PASÓ LA VALIDACIÓN DEL SERVIDOR."
                            : string.Join("\n", result.errors);
                AddTransientMessage(message);
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
            var playerId = app.GameState.PlayerId;
            try
            {
                var ids = ResolveDeckIds();
                var validation = await app.Repository.ValidateDeckAsync(ids);
                if (!IsCurrentRequest(version, route)) return;
                if (validation == null)
                {
                    AddTransientMessage("EL SERVIDOR NO DEVOLVIÓ LA VALIDACIÓN.");
                    return;
                }
                if (!validation.valid)
                {
                    AddTransientMessage(
                        validation.errors == null || validation.errors.Length == 0
                            ? "EL BORRADOR NO PASÓ LA VALIDACIÓN DEL SERVIDOR."
                            : string.Join("\n", validation.errors));
                    return;
                }

                var result = await app.Repository.SaveDeckAsync(ids);
                if (!IsCurrentRequest(version, route)) return;
                if (result == null)
                {
                    AddTransientMessage("EL SERVIDOR NO DEVOLVIÓ CONFIRMACIÓN.");
                    return;
                }
                if (!result.ok)
                {
                    AddTransientMessage(ValueOr(result.reason, "EL SERVIDOR NO CONFIRMÓ EL GUARDADO."));
                    return;
                }

                deckDraftInitialized = false;
                try
                {
                    await app.GameState.RefreshAsync();
                }
                catch (Exception refreshException)
                {
                    Debug.LogException(refreshException, this);
                    if (app.Session != null && app.Session.IsAuthenticated &&
                        app.Navigation.CurrentRoute == route &&
                        string.Equals(app.GameState.PlayerId, playerId, StringComparison.Ordinal))
                        AddTransientMessage("FORMACIÓN GUARDADA; NO SE PUDO RECARGAR EL ESTADO.");
                    return;
                }

                if (app.Session == null || !app.Session.IsAuthenticated ||
                    app.Navigation.CurrentRoute != route ||
                    !string.Equals(app.GameState.PlayerId, playerId, StringComparison.Ordinal))
                    return;

                if (app.GameState.SyncState == SyncState.Connected)
                {
                    EnsureDeckDraft();
                    RenderRoute(route);
                    AddTransientMessage("FORMACIÓN GUARDADA · " + result.slots_saved + " SLOTS CONFIRMADOS.");
                }
                else
                {
                    AddTransientMessage("FORMACIÓN GUARDADA; LA RECARGA DEL ESTADO QUEDÓ PENDIENTE.");
                }
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

        [System.Obsolete("Legacy battle entry disabled. VexforgeTier1BattleGate owns Battle entry.")]
        private void ResolveBattle()
        {
            var gate = FindFirstObjectByType<VexforgeTier1BattleGate>(FindObjectsInactive.Include);
            if (gate != null) gate.Show();
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
            if (transientMessagePanel == null)
            {
                transientMessagePanel = UiFactory.PanelObject(
                    root,
                    "TransientMessage",
                    new Color(0.04f, 0.03f, 0.025f, 0.92f));
                UiFactory.Anchor(
                    transientMessagePanel.GetComponent<RectTransform>(),
                    new Vector2(0.12f, 0.35f),
                    new Vector2(0.88f, 0.44f),
                    Vector2.zero,
                    Vector2.zero);
                transientMessageLabel = UiFactory.Label(
                    transientMessagePanel.transform,
                    text,
                    12,
                    UiFactory.Gold,
                    TextAnchor.MiddleCenter);
                UiFactory.Stretch(transientMessageLabel.rectTransform, 12f, 6f, 12f, 6f);
            }
            else if (transientMessageLabel != null)
            {
                transientMessageLabel.text = text;
            }
        }

        private string[] ResolveDeckIds()
        {
            EnsureDeckDraft();
            return deckDraftIds.ToArray();
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
            archiveSummary = null;
            archiveEmptyPanel = null;
            deckDraftPanel = null;
            transientMessagePanel = null;
            transientMessageLabel = null;
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
