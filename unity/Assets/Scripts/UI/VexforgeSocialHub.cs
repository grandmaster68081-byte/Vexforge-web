using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.UI
{
    /// <summary>
    /// Premium social surface for Profile/Hall and world communications.
    /// The Alpha intentionally uses low-frequency REST polling because the current Unity transport
    /// is HTTP-only; the backend contract is ready for a later Realtime transport without changing
    /// the data authority or UI contract.
    /// </summary>
    public sealed class VexforgeSocialHub : MonoBehaviour
    {
        private enum SocialTab
        {
            Friends,
            Direct,
            Global,
            Clan
        }

        private VexforgeApp app;
        private VexforgeSocialRepository repository;
        private Canvas canvas;
        private GameObject overlay;
        private RectTransform modalRoot;
        private RectTransform contentRoot;
        private InputField searchInput;
        private InputField composerInput;
        private Text statusLabel;
        private SocialTab activeTab;
        private string selectedConversationId;
        private string selectedFriendId;
        private string selectedFriendName;
        private SocialFriendData friendData;
        private SocialSearchPlayer[] searchResults;
        private string searchQuery;
        private SocialConversationData conversationData;
        private SocialMessageData messageData;
        private SocialClanData clanData;
        private bool open;
        private bool refreshInFlight;
        private bool presenceInFlight;
        private int lifecycleGeneration;
        private float nextPresenceTouch;
        private int lastRenderFingerprint = int.MinValue;
        private Coroutine pollRoutine;

        public bool IsOpen { get { return open; } }

        public void Initialize(VexforgeApp application, Canvas targetCanvas)
        {
            if (app != null) return;
            app = application;
            canvas = targetCanvas;
            var client = app != null && app.Services != null ? app.Services.Resolve<SupabaseClient>() : null;
            if (client == null || canvas == null) return;
            repository = new VexforgeSocialRepository(client);
            BuildOverlay();
            nextPresenceTouch = 0f;
        }

        private void Update()
        {
            if (app == null || repository == null || app.Session == null || !app.Session.IsAuthenticated)
                return;
            if (Time.unscaledTime < nextPresenceTouch || presenceInFlight)
                return;
            nextPresenceTouch = Time.unscaledTime + 30f;
            _ = TouchPresenceHeartbeatAsync();
        }

        private async Task TouchPresenceHeartbeatAsync()
        {
            if (presenceInFlight || repository == null) return;
            presenceInFlight = true;
            try
            {
                await repository.TouchPresenceAsync();
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
            }
            finally
            {
                presenceInFlight = false;
            }
        }

        public void OpenFriends()
        {
            OpenInternal(SocialTab.Friends);
        }

        public void OpenGlobal()
        {
            OpenInternal(SocialTab.Global);
        }

        public void OpenClan()
        {
            OpenInternal(SocialTab.Clan);
        }

        public async void OpenConversation(string friendId, string friendName)
        {
            if (string.IsNullOrWhiteSpace(friendId)) return;
            selectedFriendId = friendId;
            selectedFriendName = string.IsNullOrWhiteSpace(friendName) ? "Guerrero" : friendName;
            OpenInternal(SocialTab.Direct);
            var generation = lifecycleGeneration;
            if (repository == null) return;
            try
            {
                var result = await repository.GetOrCreateConversationAsync(friendId);
                if (!IsCurrent(generation)) return;
                if (result == null || !result.ok || string.IsNullOrWhiteSpace(result.conversation_id))
                {
                    SetStatus("NO SE PUDO ABRIR EL CANAL PRIVADO");
                    return;
                }
                selectedConversationId = result.conversation_id;
                RenderActiveTab();
                await RefreshMessagesOnlyAsync(generation);
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrent(generation)) SetStatus("CANAL PRIVADO NO DISPONIBLE");
            }
        }

        public void Close()
        {
            lifecycleGeneration++;
            open = false;
            presenceInFlight = false;
            lastRenderFingerprint = int.MinValue;
            if (pollRoutine != null)
            {
                StopCoroutine(pollRoutine);
                pollRoutine = null;
            }
            if (overlay != null) overlay.SetActive(false);
            selectedConversationId = null;
            selectedFriendId = null;
            selectedFriendName = null;
        }

        private void OpenInternal(SocialTab tab)
        {
            if (repository == null || app == null || !app.Session.IsAuthenticated) return;
            activeTab = tab;
            open = true;
            lifecycleGeneration++;
            lastRenderFingerprint = int.MinValue;
            if (overlay != null) overlay.SetActive(true);
            RenderActiveTab();
            if (pollRoutine != null) StopCoroutine(pollRoutine);
            pollRoutine = StartCoroutine(PollLoop());
            _ = RefreshActiveAsync(lifecycleGeneration, true);
        }

        private IEnumerator PollLoop()
        {
            nextPresenceTouch = 0f;
            while (open)
            {
                if (!refreshInFlight && !IsComposerFocused())
                    _ = RefreshActiveAsync(lifecycleGeneration, false);

                yield return new WaitForSecondsRealtime(activeTab == SocialTab.Friends ? 5f : 2.5f);
            }
        }

        private async Task TouchPresenceAsync(int generation)
        {
            try { await repository.TouchPresenceAsync(); }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
            }
            if (!IsCurrent(generation)) return;
        }

        private async Task RefreshActiveAsync(int generation, bool initial)
        {
            if (repository == null || !open || !app.Session.IsAuthenticated || refreshInFlight) return;
            refreshInFlight = true;
            try
            {
                switch (activeTab)
                {
                    case SocialTab.Friends:
                        friendData = await repository.GetFriendDataAsync();
                        break;
                    case SocialTab.Direct:
                        conversationData = await repository.GetConversationsAsync();
                        if (!string.IsNullOrWhiteSpace(selectedConversationId))
                            messageData = await repository.GetPrivateMessagesAsync(selectedConversationId);
                        break;
                    case SocialTab.Global:
                        messageData = await repository.GetGlobalMessagesAsync();
                        break;
                    case SocialTab.Clan:
                        clanData = await repository.GetMyClanAsync();
                        if (clanData != null && clanData.has_clan)
                            messageData = await repository.GetClanMessagesAsync();
                        break;
                }

                if (!IsCurrent(generation)) return;
                var fingerprint = ComputeActiveFingerprint();
                if (initial || (!IsComposerFocused() && fingerprint != lastRenderFingerprint))
                {
                    lastRenderFingerprint = fingerprint;
                    RenderActiveTab();
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrent(generation)) SetStatus("COMUNICACIONES NO DISPONIBLES");
            }
            finally
            {
                refreshInFlight = false;
            }
        }

        private async Task RefreshMessagesOnlyAsync(int generation)
        {
            if (!IsCurrent(generation) || string.IsNullOrWhiteSpace(selectedConversationId)) return;
            try
            {
                messageData = await repository.GetPrivateMessagesAsync(selectedConversationId);
                if (!IsCurrent(generation)) return;
                await repository.MarkPrivateReadAsync(selectedConversationId);
                if (!IsComposerFocused())
                {
                    lastRenderFingerprint = ComputeActiveFingerprint() ^ 0x5A17;
                    RenderActiveTab();
                    lastRenderFingerprint = ComputeActiveFingerprint();
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
            }
        }

        private int ComputeActiveFingerprint()
        {
            unchecked
            {
                var hash = 17;
                hash = hash * 31 + (int)activeTab;
                hash = hash * 31 + StableHash(selectedConversationId);
                if (activeTab == SocialTab.Friends)
                {
                    var friends = friendData == null ? null : friendData.friends;
                    var incoming = friendData == null ? null : friendData.incoming_requests;
                    var outgoing = friendData == null ? null : friendData.outgoing_requests;
                    hash = hash * 31 + FingerprintFriends(friends);
                    hash = hash * 31 + FingerprintRequests(incoming);
                    hash = hash * 31 + FingerprintRequests(outgoing);
                }
                else if (activeTab == SocialTab.Direct)
                {
                    var conversations = conversationData == null ? null : conversationData.conversations;
                    hash = hash * 31 + FingerprintConversations(conversations);
                    hash = hash * 31 + FingerprintMessages(messageData == null ? null : messageData.messages);
                }
                else if (activeTab == SocialTab.Global)
                {
                    hash = hash * 31 + FingerprintMessages(messageData == null ? null : messageData.messages);
                }
                else
                {
                    var clan = clanData == null ? null : clanData.clan;
                    hash = hash * 31 + StableHash(clan == null ? null : clan.id);
                    hash = hash * 31 + StableHash(clan == null ? null : clan.name);
                    hash = hash * 31 + (clan == null ? 0 : clan.member_count);
                    hash = hash * 31 + (clan == null || clan.active_wars == null ? 0 : clan.active_wars.Length);
                    hash = hash * 31 + FingerprintMessages(messageData == null ? null : messageData.messages);
                }
                return hash;
            }
        }

        private static int FingerprintFriends(SocialFriend[] values)
        {
            unchecked
            {
                var hash = values == null ? 0 : values.Length;
                if (values == null) return hash;
                for (var i = 0; i < values.Length; i++)
                {
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].id);
                    hash = hash * 31 + (values[i] != null && values[i].is_online ? 1 : 0);
                }
                return hash;
            }
        }

        private static int FingerprintRequests(SocialFriendRequest[] values)
        {
            unchecked
            {
                var hash = values == null ? 0 : values.Length;
                if (values == null) return hash;
                for (var i = 0; i < values.Length; i++)
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].id);
                return hash;
            }
        }

        private static int FingerprintConversations(SocialConversation[] values)
        {
            unchecked
            {
                var hash = values == null ? 0 : values.Length;
                if (values == null) return hash;
                for (var i = 0; i < values.Length; i++)
                {
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].conversation_id);
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].last_message_at);
                    hash = hash * 31 + (values[i] == null ? 0 : values[i].unread_count);
                }
                return hash;
            }
        }

        private static int FingerprintMessages(SocialMessage[] values)
        {
            unchecked
            {
                var hash = values == null ? 0 : values.Length;
                if (values == null) return hash;
                for (var i = 0; i < values.Length; i++)
                {
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].id);
                    hash = hash * 31 + StableHash(values[i] == null ? null : values[i].body);
                }
                return hash;
            }
        }

        private static int StableHash(string value)
        {
            unchecked
            {
                if (value == null) return 0;
                var hash = 23;
                for (var i = 0; i < value.Length; i++) hash = hash * 31 + value[i];
                return hash;
            }
        }

        private bool IsCurrent(int generation)
        {
            return open && generation == lifecycleGeneration && app != null && app.Session != null && app.Session.IsAuthenticated;
        }

        private bool IsComposerFocused()
        {
            if (composerInput == null || EventSystem.current == null) return false;
            return EventSystem.current.currentSelectedGameObject == composerInput.gameObject;
        }

        private void BuildOverlay()
        {
            overlay = new GameObject("VexforgeSocialOverlay", typeof(RectTransform), typeof(Image));
            overlay.transform.SetParent(canvas.transform, false);
            var overlayImage = overlay.GetComponent<Image>();
            overlayImage.color = new Color(0f, 0f, 0f, 0.74f);
            UiFactory.Stretch(overlay.GetComponent<RectTransform>(), 0f, 0f, 0f, 0f);

            modalRoot = new GameObject("SocialModal", typeof(RectTransform), typeof(Image)).GetComponent<RectTransform>();
            modalRoot.SetParent(overlay.transform, false);
            modalRoot.GetComponent<Image>().color = new Color(0.028f, 0.022f, 0.020f, 0.97f);
            ApplySafeArea(modalRoot);

            overlay.SetActive(false);
        }

        private void ApplySafeArea(RectTransform target)
        {
            var safe = Screen.safeArea;
            var width = Mathf.Max(1f, Screen.width);
            var height = Mathf.Max(1f, Screen.height);
            target.anchorMin = new Vector2(safe.xMin / width, safe.yMin / height);
            target.anchorMax = new Vector2(safe.xMax / width, safe.yMax / height);
            target.offsetMin = Vector2.zero;
            target.offsetMax = Vector2.zero;
        }

        private void RenderActiveTab()
        {
            if (!open || modalRoot == null) return;
            ClearModalChildren();
            contentRoot = new GameObject("SocialContent", typeof(RectTransform)).GetComponent<RectTransform>();
            contentRoot.SetParent(modalRoot, false);
            UiFactory.Anchor(contentRoot, new Vector2(0.035f, 0.075f), new Vector2(0.965f, 0.80f), Vector2.zero, Vector2.zero);

            var title = activeTab == SocialTab.Friends ? "HALL DE ALIADOS" :
                        activeTab == SocialTab.Direct ? "SUSURROS" :
                        activeTab == SocialTab.Global ? "WORLD CHAT" : "CLAN HALL";
            var titleText = UiFactory.Label(modalRoot, title, 22, UiFactory.Gold, TextAnchor.MiddleLeft);
            UiFactory.Anchor(titleText.rectTransform, new Vector2(0.06f, 0.925f), new Vector2(0.82f, 0.975f), Vector2.zero, Vector2.zero);

            var close = UiFactory.Button(modalRoot, "CERRAR", Close);
            UiFactory.Anchor(close.GetComponent<RectTransform>(), new Vector2(0.78f, 0.925f), new Vector2(0.95f, 0.975f), Vector2.zero, Vector2.zero);

            AddTabs();
            switch (activeTab)
            {
                case SocialTab.Friends: BuildFriendsTab(); break;
                case SocialTab.Direct: BuildDirectTab(); break;
                case SocialTab.Global: BuildGlobalTab(); break;
                case SocialTab.Clan: BuildClanTab(); break;
            }
        }

        private void AddTabs()
        {
            var labels = new[] { "ALIADOS", "DM", "WORLD", "CLAN" };
            var values = new[] { SocialTab.Friends, SocialTab.Direct, SocialTab.Global, SocialTab.Clan };
            for (var i = 0; i < labels.Length; i++)
            {
                var index = i;
                var button = UiFactory.Button(modalRoot, labels[i], () => SwitchTab(values[index]));
                var x0 = 0.04f + i * 0.23f;
                UiFactory.Anchor(button.GetComponent<RectTransform>(), new Vector2(x0, 0.84f), new Vector2(x0 + 0.20f, 0.895f), Vector2.zero, Vector2.zero);
            }
        }

        private void SwitchTab(SocialTab tab)
        {
            activeTab = tab;
            messageData = null;
            searchResults = null;
            searchQuery = null;
            lifecycleGeneration++;
            lastRenderFingerprint = int.MinValue;
            RenderActiveTab();
            _ = RefreshActiveAsync(lifecycleGeneration, true);
        }

        private void BuildFriendsTab()
        {
            var search = UiFactory.Input(contentRoot, "BUSCAR GUERRERO", false);
            UiFactory.Anchor(search.GetComponent<RectTransform>(), new Vector2(0.03f, 0.90f), new Vector2(0.72f, 0.97f), Vector2.zero, Vector2.zero);
            searchInput = search;
            var searchButton = UiFactory.Button(contentRoot, "BUSCAR", () => _ = SearchPlayersAsync(search.text));
            UiFactory.Anchor(searchButton.GetComponent<RectTransform>(), new Vector2(0.74f, 0.90f), new Vector2(0.97f, 0.97f), Vector2.zero, Vector2.zero);

            if (searchResults != null)
            {
                AddSectionLabel(contentRoot, "RESULTADOS · " + ValueOr(searchQuery, "BÚSQUEDA"), 0.84f);
                var clear = UiFactory.Button(contentRoot, "CERRAR RESULTADOS", ClearSearchResults);
                UiFactory.Anchor(clear.GetComponent<RectTransform>(), new Vector2(0.62f, 0.785f), new Vector2(0.97f, 0.84f), Vector2.zero, Vector2.zero);
                var results = CreateScrollList(contentRoot, "SearchResults", 0.10f, 0.78f);
                for (var i = 0; i < searchResults.Length; i++)
                {
                    var player = searchResults[i];
                    var row = CreateRow(results.content, 58f);
                    var presence = player.is_online ? "● " : "○ ";
                    var label = UiFactory.Label(row.transform, presence + ValueOr(player.display_name, "Guerrero") + " · " + ValueOr(player.friend_state, "none"), 11, player.is_online ? UiFactory.Arcane : UiFactory.Text);
                    UiFactory.Anchor(label.rectTransform, new Vector2(0.03f, 0.12f), new Vector2(0.62f, 0.88f), Vector2.zero, Vector2.zero);
                    var playerId = player.id;
                    Action action = null;
                    string actionLabel = "AÑADIR";
                    if (player.friend_state == "friends")
                    {
                        actionLabel = "AMIGO";
                    }
                    else if (player.friend_state == "pending_incoming" && !string.IsNullOrWhiteSpace(player.request_id))
                    {
                        actionLabel = "ACEPTAR";
                        var incomingId = player.request_id;
                        action = () => _ = RespondRequestAsync(incomingId, true);
                    }
                    else if (player.friend_state == "pending_outgoing" && !string.IsNullOrWhiteSpace(player.request_id))
                    {
                        actionLabel = "CANCELAR";
                        var outgoingId = player.request_id;
                        action = () => _ = CancelRequestAsync(outgoingId);
                    }
                    else
                    {
                        action = () => _ = SendFriendRequestAsync(playerId);
                    }
                    var block = UiFactory.Button(row.transform, "BLOQUEAR", () => _ = BlockPlayerAsync(playerId));
                    UiFactory.Anchor(block.GetComponent<RectTransform>(), new Vector2(0.59f, 0.12f), new Vector2(0.76f, 0.88f), Vector2.zero, Vector2.zero);

                    var actionButton = UiFactory.Button(row.transform, actionLabel, action ?? (() => { }));
                    actionButton.GetComponent<Button>().interactable = action != null;
                    UiFactory.Anchor(actionButton.GetComponent<RectTransform>(), new Vector2(0.78f, 0.12f), new Vector2(0.96f, 0.88f), Vector2.zero, Vector2.zero);
                }
                if (searchResults.Length == 0) AddListMessage(results.content, "No hay guerreros que coincidan.");
                return;
            }

            if (friendData == null)
            {
                AddStatus("CARGANDO RELACIONES...");
                return;
            }

            AddSectionLabel(contentRoot, "AMIGOS · " + LengthOf(friendData.friends), 0.83f);
            var friendList = CreateScrollList(contentRoot, "Friends", 0.55f, 0.82f);
            var friends = friendData.friends ?? new SocialFriend[0];
            for (var i = 0; i < friends.Length; i++)
            {
                var friend = friends[i];
                var row = CreateRow(friendList.content, 54f);
                var name = UiFactory.Label(row.transform, (friend.is_online ? "● " : "○ ") + ValueOr(friend.display_name, "Guerrero"), 13, friend.is_online ? UiFactory.Arcane : UiFactory.Text);
                UiFactory.Anchor(name.rectTransform, new Vector2(0.03f, 0.1f), new Vector2(0.58f, 0.9f), Vector2.zero, Vector2.zero);
                var id = friend.id;
                var chat = UiFactory.Button(row.transform, "CHAT", () => OpenConversation(id, friend.display_name));
                UiFactory.Anchor(chat.GetComponent<RectTransform>(), new Vector2(0.45f, 0.12f), new Vector2(0.61f, 0.88f), Vector2.zero, Vector2.zero);
                var block = UiFactory.Button(row.transform, "BLOQ", () => _ = BlockPlayerAsync(id));
                UiFactory.Anchor(block.GetComponent<RectTransform>(), new Vector2(0.63f, 0.12f), new Vector2(0.78f, 0.88f), Vector2.zero, Vector2.zero);
                var remove = UiFactory.Button(row.transform, "-", () => _ = RemoveFriendAsync(id));
                UiFactory.Anchor(remove.GetComponent<RectTransform>(), new Vector2(0.80f, 0.12f), new Vector2(0.96f, 0.88f), Vector2.zero, Vector2.zero);
            }
            if (friends.Length == 0) AddListMessage(friendList.content, "Aún no tienes aliados.");

            AddSectionLabel(contentRoot, "SOLICITUDES", 0.50f);
            var requestList = CreateScrollList(contentRoot, "Requests", 0.22f, 0.49f);
            var incoming = friendData.incoming_requests ?? new SocialFriendRequest[0];
            for (var i = 0; i < incoming.Length; i++)
            {
                var request = incoming[i];
                var row = CreateRow(requestList.content, 54f);
                var name = UiFactory.Label(row.transform, ValueOr(request.display_name, "Guerrero"), 13, UiFactory.Text);
                UiFactory.Anchor(name.rectTransform, new Vector2(0.03f, 0.1f), new Vector2(0.48f, 0.9f), Vector2.zero, Vector2.zero);
                var acceptId = request.id;
                var accept = UiFactory.Button(row.transform, "ACEPTAR", () => _ = RespondRequestAsync(acceptId, true));
                UiFactory.Anchor(accept.GetComponent<RectTransform>(), new Vector2(0.50f, 0.12f), new Vector2(0.73f, 0.88f), Vector2.zero, Vector2.zero);
                var decline = UiFactory.Button(row.transform, "NO", () => _ = RespondRequestAsync(acceptId, false));
                UiFactory.Anchor(decline.GetComponent<RectTransform>(), new Vector2(0.75f, 0.12f), new Vector2(0.96f, 0.88f), Vector2.zero, Vector2.zero);
            }
            if (incoming.Length == 0) AddListMessage(requestList.content, "No hay solicitudes entrantes.");

            AddSectionLabel(contentRoot, "SOLICITUDES ENVIADAS", 0.18f);
            var outgoingList = CreateScrollList(contentRoot, "OutgoingRequests", 0.045f, 0.17f);
            var outgoing = friendData.outgoing_requests ?? new SocialFriendRequest[0];
            for (var i = 0; i < outgoing.Length; i++)
            {
                var request = outgoing[i];
                var row = CreateRow(outgoingList.content, 48f);
                var label = UiFactory.Label(row.transform, ValueOr(request.display_name, "Guerrero"), 11, UiFactory.Text);
                UiFactory.Anchor(label.rectTransform, new Vector2(0.03f, 0.12f), new Vector2(0.62f, 0.88f), Vector2.zero, Vector2.zero);
                var requestId = request.id;
                var cancel = UiFactory.Button(row.transform, "CANCELAR", () => _ = CancelRequestAsync(requestId));
                UiFactory.Anchor(cancel.GetComponent<RectTransform>(), new Vector2(0.65f, 0.12f), new Vector2(0.96f, 0.88f), Vector2.zero, Vector2.zero);
            }
            if (outgoing.Length == 0) AddListMessage(outgoingList.content, "No hay solicitudes enviadas.");
        }

        private void BuildDirectTab()
        {
            var conversationList = CreateScrollList(contentRoot, "Conversations", 0.60f, 0.97f);
            var conversations = conversationData == null ? new SocialConversation[0] : (conversationData.conversations ?? new SocialConversation[0]);
            for (var i = 0; i < conversations.Length; i++)
            {
                var conversation = conversations[i];
                var row = CreateRow(conversationList.content, 58f);
                var selected = conversation.conversation_id == selectedConversationId;
                var name = UiFactory.Label(row.transform, (selected ? "◆ " : "◇ ") + ValueOr(conversation.other_display_name, "Guerrero"), 13, selected ? UiFactory.Gold : UiFactory.Text);
                UiFactory.Anchor(name.rectTransform, new Vector2(0.03f, 0.1f), new Vector2(0.58f, 0.86f), Vector2.zero, Vector2.zero);
                var preview = UiFactory.Label(row.transform, Truncate(conversation.last_message, 48), 9, UiFactory.Muted, TextAnchor.MiddleLeft);
                UiFactory.Anchor(preview.rectTransform, new Vector2(0.03f, 0.02f), new Vector2(0.58f, 0.26f), Vector2.zero, Vector2.zero);
                var id = conversation.conversation_id;
                var otherId = conversation.other_player_id;
                var otherName = conversation.other_display_name;
                var open = UiFactory.Button(row.transform, conversation.unread_count > 0 ? ("(" + conversation.unread_count + ") ABRIR") : "ABRIR", () => OpenConversationById(id, otherId, otherName));
                UiFactory.Anchor(open.GetComponent<RectTransform>(), new Vector2(0.62f, 0.16f), new Vector2(0.96f, 0.82f), Vector2.zero, Vector2.zero);
            }
            if (conversations.Length == 0)
                AddListMessage(conversationList.content, "Agrega un aliado desde HALL DE ALIADOS para iniciar un canal.");

            if (!string.IsNullOrWhiteSpace(selectedConversationId))
            {
                AddSectionLabel(contentRoot, "CANAL · " + ValueOr(selectedFriendName, "ALIADO"), 0.55f);
                var messages = CreateScrollList(contentRoot, "DirectMessages", 0.18f, 0.53f);
                RenderMessages(messages.content, messageData == null ? null : messageData.messages, "private");
                BuildComposer("ESCRIBE UN SUSURRO...", 0.06f, SendPrivateMessage);
            }
        }

        private void BuildGlobalTab()
        {
            AddSectionLabel(contentRoot, "COMUNICACIÓN GLOBAL · TODOS LOS VASALLOS", 0.94f);
            var messages = CreateScrollList(contentRoot, "GlobalMessages", 0.17f, 0.92f);
            RenderMessages(messages.content, messageData == null ? null : messageData.messages, "global");
            BuildComposer("ESCRIBE AL MUNDO...", 0.05f, SendGlobalMessage);
        }

        private void BuildClanTab()
        {
            if (clanData == null)
            {
                AddStatus("CARGANDO CLAN...");
                return;
            }

            if (!clanData.has_clan)
            {
                AddSectionLabel(contentRoot, "DESCUBRIR CLAN", 0.92f);
                var list = CreateScrollList(contentRoot, "ClanDiscovery", 0.57f, 0.90f);
                var clans = clanData.available_clans ?? new SocialClanDiscovery[0];
                for (var i = 0; i < clans.Length; i++)
                {
                    var clan = clans[i];
                    var row = CreateRow(list.content, 58f);
                    var label = UiFactory.Label(row.transform, ValueOr(clan.name, "Clan") + "  ·  " + clan.prestige + " prestigio · " + clan.member_count + " miembros", 11, UiFactory.Text);
                    UiFactory.Anchor(label.rectTransform, new Vector2(0.03f, 0.12f), new Vector2(0.70f, 0.86f), Vector2.zero, Vector2.zero);
                    var clanId = clan.id;
                    var join = UiFactory.Button(row.transform, "UNIRSE", () => _ = JoinClanAsync(clanId));
                    UiFactory.Anchor(join.GetComponent<RectTransform>(), new Vector2(0.73f, 0.12f), new Vector2(0.96f, 0.86f), Vector2.zero, Vector2.zero);
                }
                if (clans.Length == 0) AddListMessage(list.content, "No hay Clanes visibles.");

                AddSectionLabel(contentRoot, "FORJA TU CLAN", 0.54f);
                clanNameInput = UiFactory.Input(contentRoot, "NOMBRE DEL CLAN", false);
                UiFactory.Anchor(clanNameInput.GetComponent<RectTransform>(), new Vector2(0.04f, 0.40f), new Vector2(0.96f, 0.48f), Vector2.zero, Vector2.zero);
                clanDescriptionInput = UiFactory.Input(contentRoot, "DESCRIPCIÓN DEL CLAN", false);
                UiFactory.Anchor(clanDescriptionInput.GetComponent<RectTransform>(), new Vector2(0.04f, 0.30f), new Vector2(0.96f, 0.38f), Vector2.zero, Vector2.zero);
                var create = UiFactory.Button(contentRoot, "CREAR CLAN", () => _ = CreateClanAsync());
                UiFactory.Anchor(create.GetComponent<RectTransform>(), new Vector2(0.28f, 0.21f), new Vector2(0.72f, 0.285f), Vector2.zero, Vector2.zero);
                var note = UiFactory.Label(contentRoot, "EL SERVIDOR DECIDE NOMBRE, PERMISOS Y PERTENENCIA", 9, UiFactory.Muted, TextAnchor.MiddleCenter);
                UiFactory.Anchor(note.rectTransform, new Vector2(0.08f, 0.13f), new Vector2(0.92f, 0.18f), Vector2.zero, Vector2.zero);
                return;
            }

            var clan = clanData.clan;
            var activeWars = clan.active_wars ?? new SocialClanWar[0];
            var summary = UiFactory.Label(contentRoot,
                ValueOr(clan.name, "CLAN") + " · " + ValueOr(clan.role, "miembro") + " · PRESTIGIO " + clan.prestige + " · " + clan.member_count + " GUERREROS" + (activeWars.Length > 0 ? " · " + activeWars.Length + " GUERRA(S) ACTIVA(S)" : ""),
                12, UiFactory.Gold, TextAnchor.MiddleCenter);
            UiFactory.Anchor(summary.rectTransform, new Vector2(0.04f, 0.89f), new Vector2(0.96f, 0.95f), Vector2.zero, Vector2.zero);

            if (activeWars.Length > 0)
            {
                var war = activeWars[0];
                var warLabel = UiFactory.Label(contentRoot,
                    "CONFLICTO ACTIVO · " + ValueOr(war.clan_a_name, "CLAN A") + " VS " + ValueOr(war.clan_b_name, "CLAN B") + " · " + ValueOr(war.status, "ACTIVO"),
                    9, UiFactory.Arcane, TextAnchor.MiddleCenter);
                UiFactory.Anchor(warLabel.rectTransform, new Vector2(0.06f, 0.85f), new Vector2(0.94f, 0.885f), Vector2.zero, Vector2.zero);
            }

            var members = clan.members ?? new SocialClanMember[0];
            var memberList = CreateScrollList(contentRoot, "ClanMembers", 0.57f, 0.84f);
            for (var i = 0; i < members.Length; i++)
            {
                var member = members[i];
                var row = CreateRow(memberList.content, 44f);
                var label = UiFactory.Label(row.transform, ValueOr(member.display_name, "Guerrero") + " · " + ValueOr(member.role, "miembro"), 11, UiFactory.Text);
                UiFactory.Stretch(label.rectTransform, 8f, 2f, 8f, 2f);
            }

            AddSectionLabel(contentRoot, "CLAN CHAT", 0.54f);
            var messages = CreateScrollList(contentRoot, "ClanMessages", 0.19f, 0.51f);
            RenderMessages(messages.content, messageData == null ? null : messageData.messages, "clan");
            BuildComposer("ESCRIBE AL CLAN...", 0.05f, SendClanMessage);
            var leave = UiFactory.Button(contentRoot, "SALIR DEL CLAN", () => _ = LeaveClanAsync());
            UiFactory.Anchor(leave.GetComponent<RectTransform>(), new Vector2(0.04f, 0.965f), new Vector2(0.30f, 0.995f), Vector2.zero, Vector2.zero);
        }

        private void BuildComposer(string placeholder, float y, Action send)
        {
            composerInput = UiFactory.Input(contentRoot, placeholder, false);
            UiFactory.Anchor(composerInput.GetComponent<RectTransform>(), new Vector2(0.04f, y), new Vector2(0.72f, y + 0.075f), Vector2.zero, Vector2.zero);
            composerInput.characterLimit = activeTab == SocialTab.Global ? 280 : (activeTab == SocialTab.Direct ? 1000 : 500);
            var sendButton = UiFactory.Button(contentRoot, "ENVIAR", send);
            UiFactory.Anchor(sendButton.GetComponent<RectTransform>(), new Vector2(0.74f, y), new Vector2(0.96f, y + 0.075f), Vector2.zero, Vector2.zero);
        }

        private void RenderMessages(Transform parent, SocialMessage[] messages, string scope)
        {
            if (messages == null || messages.Length == 0)
            {
                AddListMessage(parent, "Aún no hay mensajes en este canal.");
                return;
            }
            for (var i = 0; i < messages.Length; i++)
            {
                var message = messages[i];
                var row = CreateRow(parent, 58f);
                var prefix = message.is_mine ? "TÚ" : ValueOr(message.sender_display_name, "GUERRERO");
                var label = UiFactory.Label(row.transform, prefix + "  ·  " + FormatClock(message.created_at) + "\n" + message.body, 10, message.is_mine ? UiFactory.Gold : UiFactory.Text);
                UiFactory.Anchor(label.rectTransform, new Vector2(0.03f, 0.08f), new Vector2(0.76f, 0.92f), Vector2.zero, Vector2.zero);
                var messageId = message.id;
                var report = UiFactory.Button(row.transform, "REPORTAR", () => _ = ReportMessageAsync(scope, messageId));
                report.GetComponent<Button>().interactable = !message.is_mine && !string.IsNullOrWhiteSpace(messageId);
                UiFactory.Anchor(report.GetComponent<RectTransform>(), new Vector2(0.79f, 0.20f), new Vector2(0.97f, 0.80f), Vector2.zero, Vector2.zero);
            }
        }

        private async Task SearchPlayersAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return;
            var generation = lifecycleGeneration;
            try
            {
                var data = await repository.SearchPlayersAsync(query.Trim());
                if (!IsCurrent(generation)) return;
                searchQuery = query.Trim();
                searchResults = data == null ? new SocialSearchPlayer[0] : (data.players ?? new SocialSearchPlayer[0]);
                lastRenderFingerprint = int.MinValue;
                RenderActiveTab();
                if (data == null || !data.ok)
                {
                    SetStatus(SocialReason(data == null ? null : new SocialActionResult { reason = data.reason }));
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex, this);
                if (IsCurrent(generation)) SetStatus("BÚSQUEDA NO DISPONIBLE");
            }
        }

        private void ClearSearchResults()
        {
            searchResults = null;
            searchQuery = null;
            lastRenderFingerprint = int.MinValue;
            RenderActiveTab();
        }

        private async Task SendFriendRequestAsync(string playerId)
        {
            var generation = lifecycleGeneration;
            var result = await repository.SendFriendRequestAsync(playerId);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "SOLICITUD ENVIADA" : SocialReason(result));
            if (result != null && result.ok) _ = RefreshActiveAsync(generation, true);
        }

        private async Task CancelRequestAsync(string requestId)
        {
            var generation = lifecycleGeneration;
            var result = await repository.CancelFriendRequestAsync(requestId);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "SOLICITUD CANCELADA" : SocialReason(result));
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task RespondRequestAsync(string requestId, bool accept)
        {
            var generation = lifecycleGeneration;
            var result = await repository.RespondFriendRequestAsync(requestId, accept);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? (accept ? "ALIADO AÑADIDO" : "SOLICITUD RECHAZADA") : SocialReason(result));
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task RemoveFriendAsync(string friendId)
        {
            var generation = lifecycleGeneration;
            var result = await repository.RemoveFriendAsync(friendId);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "VÍNCULO ELIMINADO" : SocialReason(result));
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task BlockPlayerAsync(string playerId)
        {
            if (string.IsNullOrWhiteSpace(playerId)) return;
            var generation = lifecycleGeneration;
            var result = await repository.BlockPlayerAsync(playerId);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "GUERRERO BLOQUEADO" : SocialReason(result));
            if (result != null && result.ok && selectedFriendId == playerId)
            {
                selectedFriendId = null;
                selectedConversationId = null;
            }
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task ReportMessageAsync(string scope, string messageId)
        {
            if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(messageId)) return;
            var generation = lifecycleGeneration;
            var result = await repository.ReportMessageAsync(scope, messageId, "USER_REPORTED_MESSAGE");
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "REPORTE ENVIADO" : SocialReason(result));
        }

        private void OpenConversationById(string conversationId, string friendId, string friendName)
        {
            selectedConversationId = conversationId;
            selectedFriendId = friendId;
            selectedFriendName = friendName;
            activeTab = SocialTab.Direct;
            lifecycleGeneration++;
            RenderActiveTab();
            _ = RefreshMessagesOnlyAsync(lifecycleGeneration);
        }

        private async void SendPrivateMessage()
        {
            await SendMessageAsync(false, false);
        }

        private async void SendGlobalMessage()
        {
            await SendMessageAsync(true, false);
        }

        private async void SendClanMessage()
        {
            await SendMessageAsync(false, true);
        }

        private async Task SendMessageAsync(bool global, bool clan)
        {
            if (composerInput == null || string.IsNullOrWhiteSpace(composerInput.text)) return;
            var generation = lifecycleGeneration;
            var body = composerInput.text.Trim();
            SocialActionResult result;
            if (global)
            {
                result = await repository.SendGlobalMessageAsync(body);
            }
            else if (clan)
            {
                result = await repository.SendClanMessageAsync(body);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(selectedConversationId)) return;
                result = await repository.SendPrivateMessageAsync(selectedConversationId, body);
            }
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? (global || clan ? "MENSAJE ENVIADO" : "SUSURRO ENVIADO") : SocialReason(result));
            if (composerInput != null) composerInput.text = string.Empty;
            if (EventSystem.current != null) EventSystem.current.SetSelectedGameObject(null);
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task CreateClanAsync()
        {
            if (clanNameInput == null || clanDescriptionInput == null) return;
            var name = clanNameInput.text == null ? string.Empty : clanNameInput.text.Trim();
            var description = clanDescriptionInput.text == null ? string.Empty : clanDescriptionInput.text.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                SetStatus("NOMBRE DE CLAN REQUERIDO");
                return;
            }

            var generation = lifecycleGeneration;
            var result = await repository.CreateClanAsync(name, description);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "CLAN CREADO" : SocialReason(result));
            if (result != null && result.ok)
            {
                clanNameInput = null;
                clanDescriptionInput = null;
                _ = RefreshActiveAsync(generation, true);
            }
        }

        private async Task JoinClanAsync(string clanId)
        {
            var generation = lifecycleGeneration;
            var result = await repository.JoinClanAsync(clanId);
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "TE HAS UNIDO AL CLAN" : SocialReason(result));
            _ = RefreshActiveAsync(generation, true);
        }

        private async Task LeaveClanAsync()
        {
            var generation = lifecycleGeneration;
            var result = await repository.LeaveClanAsync();
            if (!IsCurrent(generation)) return;
            SetStatus(result != null && result.ok ? "HAS SALIDO DEL CLAN" : SocialReason(result));
            _ = RefreshActiveAsync(generation, true);
        }

        private string SocialReason(SocialActionResult result)
        {
            if (result == null) return "OPERACIÓN NO DISPONIBLE";
            switch (result.reason)
            {
                case "RATE_LIMIT": return "DEMASIADO RÁPIDO · ESPERA UN MOMENTO";
                case "BLOCKED": return "ESTE VÍNCULO ESTÁ BLOQUEADO";
                case "NOT_FRIENDS": return "EL CANAL REQUIERE AMISTAD";
                case "MESSAGE_LENGTH": return "MENSAJE FUERA DE LÍMITES";
                case "PLAYER_NOT_FOUND": return "GUERRERO NO ENCONTRADO";
                case "REQUEST_ALREADY_PENDING": return "SOLICITUD YA PENDIENTE";
                case "ALREADY_FRIENDS": return "YA SOIS ALIADOS";
                case "NO_CLAN": return "NO PERTENECES A UN CLAN";
                case "CLAN_NOT_FOUND": return "CLAN NO ENCONTRADO";
                case "CLAN_CREATE_FAILED": return "NO SE PUDO CREAR EL CLAN";
                case "CLAN_ALREADY_EXISTS": return "EL NOMBRE DEL CLAN YA EXISTE";
                case "CLAN_NAME_REQUIRED": return "NOMBRE DE CLAN REQUERIDO";
                case "ALREADY_IN_CLAN": return "YA PERTENECES A UN CLAN";
                case "INVALID_TARGET": return "OBJETIVO NO VÁLIDO";
                case "REQUEST_NOT_FOUND": return "SOLICITUD NO ENCONTRADA";
                case "AUTH_REQUIRED": return "SESIÓN NO DISPONIBLE";
                default: return ValueOr(result.reason, "OPERACIÓN NO CONFIRMADA");
            }
        }

        private void SetStatus(string value)
        {
            if (statusLabel == null || statusLabel.gameObject == null)
            {
                if (contentRoot == null) return;
                statusLabel = UiFactory.Label(contentRoot, value, 10, UiFactory.Muted, TextAnchor.MiddleCenter);
                UiFactory.Anchor(statusLabel.rectTransform, new Vector2(0.12f, 0.01f), new Vector2(0.88f, 0.04f), Vector2.zero, Vector2.zero);
            }
            else
            {
                statusLabel.text = value;
            }
        }

        private void AddStatus(string value)
        {
            SetStatus(value);
        }

        private void AddSectionLabel(Transform parent, string text, float y)
        {
            var label = UiFactory.Label(parent, text, 10, UiFactory.Arcane, TextAnchor.MiddleLeft);
            UiFactory.Anchor(label.rectTransform, new Vector2(0.03f, y), new Vector2(0.97f, y + 0.035f), Vector2.zero, Vector2.zero);
        }

        private ScrollViewHandle CreateScrollList(Transform parent, string name, float bottom, float top)
        {
            var viewportObject = new GameObject(name + "Viewport", typeof(RectTransform), typeof(Image), typeof(Mask), typeof(ScrollRect));
            viewportObject.transform.SetParent(parent, false);
            var viewport = viewportObject.GetComponent<RectTransform>();
            UiFactory.Anchor(viewport, new Vector2(0.03f, bottom), new Vector2(0.97f, top), Vector2.zero, Vector2.zero);
            viewport.GetComponent<Image>().color = new Color(0.01f, 0.01f, 0.015f, 0.42f);
            viewport.GetComponent<Mask>().showMaskGraphic = true;

            var content = new GameObject(name + "Content", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter)).GetComponent<RectTransform>();
            content.SetParent(viewport, false);
            var layout = content.GetComponent<VerticalLayoutGroup>();
            layout.spacing = 6f;
            layout.padding = new RectOffset(6, 6, 6, 6);
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            content.GetComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            var scroll = viewport.GetComponent<ScrollRect>();
            scroll.content = content;
            scroll.viewport = viewport;
            scroll.horizontal = false;
            scroll.vertical = true;
            scroll.movementType = ScrollRect.MovementType.Elastic;
            return new ScrollViewHandle(content);
        }

        private GameObject CreateRow(Transform parent, float height)
        {
            var row = UiFactory.PanelObject(parent, "Row_" + Guid.NewGuid().ToString("N"), new Color(0.035f, 0.028f, 0.026f, 0.86f));
            var le = row.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
            return row;
        }

        private void AddListMessage(Transform parent, string text)
        {
            var row = CreateRow(parent, 52f);
            var label = UiFactory.Label(row.transform, text, 10, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Stretch(label.rectTransform, 8f, 6f, 8f, 6f);
        }

        private void ClearModalChildren()
        {
            statusLabel = null;
            searchInput = null;
            composerInput = null;
            clanNameInput = null;
            clanDescriptionInput = null;
            for (var i = modalRoot.childCount - 1; i >= 0; i--)
            {
                var child = modalRoot.GetChild(i);
                if (child == null) continue;
                Destroy(child.gameObject);
            }
        }

        private static int LengthOf<T>(T[] values)
        {
            return values == null ? 0 : values.Length;
        }

        private static string ValueOr(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private static string Truncate(string value, int max)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            if (value.Length <= max) return value;
            return value.Substring(0, Mathf.Max(0, max - 1)) + "…";
        }

        private static string FormatClock(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "--:--";
            if (DateTime.TryParse(value, out var date)) return date.ToLocalTime().ToString("HH:mm");
            return value.Length >= 5 ? value.Substring(value.Length - 5) : value;
        }

        private void OnDestroy()
        {
            lifecycleGeneration++;
            open = false;
            presenceInFlight = false;
            if (pollRoutine != null) StopCoroutine(pollRoutine);
            if (overlay != null) Destroy(overlay);
        }

        private sealed class ScrollViewHandle
        {
            public readonly RectTransform content;
            public ScrollViewHandle(RectTransform contentRoot)
            {
                content = contentRoot;
            }
        }
    }
}
