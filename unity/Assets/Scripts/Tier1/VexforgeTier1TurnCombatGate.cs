using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    public sealed partial class VexforgeTier1TurnCombatGate : MonoBehaviour
    {
        private const string PreferencePrefix = "vexforge.tier1.v7.";
        private VexforgeApp app;
        private VexforgeTier1BattleGate battleGate;
        private Canvas canvas;
        private Text titleLabel;
        private Text status;
        private Text board;
        private Text eventLog;
        private RectTransform actionContent;
        private ScrollRect actionScroll;
        private Button backButton;
        private Button replayButton;
        private VexforgeTurnCombatResponse current;
        private bool busy;
        private bool retryRequired;
        private int replayIndex = -1;
        private string sessionId;
        private string encounterMode = "training";
        private string encounterTargetId;

        public void Initialize(VexforgeApp host, VexforgeTier1BattleGate legacyGate)
        {
            app = host;
            battleGate = legacyGate;
            Build();
        }

        public void Open()
        {
            OpenEncounter("training", null);
        }

        public void OpenMission(string missionId)
        {
            OpenEncounter("mission", missionId);
        }

        public void OpenBoss(string worldBossId)
        {
            OpenEncounter("boss", worldBossId);
        }

        private void OpenEncounter(string mode, string targetId)
        {
            if (canvas == null) Build();
            if (busy)
            {
                canvas.gameObject.SetActive(true);
                return;
            }
            pvpMode = false;
            encounterMode = mode;
            encounterTargetId = targetId;
            SetEncounterChrome();
            current = null;
            sessionId = null;
            replayIndex = -1;
            retryRequired = false;
            if ((mode == "mission" || mode == "boss") && !Guid.TryParse(targetId, out _))
            {
                ShowMessage(mode == "mission"
                    ? "NO SE PUEDE INICIAR: EL ID DE MISIÓN NO ES VÁLIDO."
                    : "NO SE PUEDE INICIAR: EL ID DEL JEFE NO ES VÁLIDO.");
                return;
            }
            if (app == null || app.Session == null || !app.Session.IsAuthenticated ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
            {
                ShowMessage(mode == "mission"
                    ? "INICIA SESIÓN PARA INICIAR EL COMBATE DE MISIÓN V7."
                    : mode == "boss"
                        ? "INICIA SESIÓN PARA INICIAR EL COMBATE DE JEFE V7."
                        : "INICIA SESIÓN PARA ABRIR EL ENTRENAMIENTO.");
                canvas.gameObject.SetActive(true);
                return;
            }

            OpenCurrentEncounter();
        }

        private void OpenCurrentEncounter()
        {
            if (canvas == null) Build();
            if (busy)
            {
                canvas.gameObject.SetActive(true);
                return;
            }
            pvpMode = false;
            SetEncounterChrome();
            if (app == null || app.Repository == null)
            {
                ShowMessage("SERVICIO DE COMBATE V7 NO DISPONIBLE · NO SE SIMULÓ LOCALMENTE.");
                return;
            }
            if (app == null || app.Session == null || !app.Session.IsAuthenticated ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
            {
                ShowMessage("INICIA SESIÓN PARA CONTINUAR EL COMBATE V7.");
                return;
            }
            canvas.gameObject.SetActive(true);
            current = null;
            sessionId = null;
            replayIndex = -1;
            _ = ResumeOrStartAsync();
        }

        public void HandleSignedOut()
        {
            busy = false;
            pvpMode = false;
            current = null;
            sessionId = null;
            replayIndex = -1;
            encounterMode = "training";
            encounterTargetId = null;
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        private void Build()
        {
            if (canvas != null) return;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1TurnCombatV7", 76, 4.3f);
            var backdrop = VexforgeTier1Ui.Panel(canvas.transform, "Backdrop", VexforgeTier1Ui.Ink);
            VexforgeTier1Ui.Full(backdrop.rectTransform);
            backdrop.raycastTarget = false;

            var plaque = VexforgeTier1Ui.Panel(
                canvas.transform, "CombatPlaque", new Color(.012f,.014f,.020f,.97f));
            VexforgeTier1Ui.Anchor(plaque.rectTransform, .035f,.025f,.965f,.975f);

            titleLabel = VexforgeTier1Ui.Label(
                plaque.transform, "Title", "V7 · ENTRENAMIENTO ESPEJO", 25,
                VexforgeTier1Ui.Gold, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(titleLabel.rectTransform, .055f,.91f,.945f,.975f);

            status = VexforgeTier1Ui.Label(
                plaque.transform, "Status", "ESTADO AUTORITATIVO DEL SERVIDOR", 13,
                VexforgeTier1Ui.Muted, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(status.rectTransform, .055f,.86f,.945f,.91f);

            board = VexforgeTier1Ui.Label(
                plaque.transform, "ConfirmedBoard", "ESPERANDO ESTADO CONFIRMADO", 12,
                VexforgeTier1Ui.Text, TextAnchor.UpperLeft);
            VexforgeTier1Ui.Anchor(board.rectTransform, .065f,.515f,.935f,.85f);

            eventLog = VexforgeTier1Ui.Label(
                plaque.transform, "ConfirmedEvents", string.Empty, 11,
                VexforgeTier1Ui.Muted, TextAnchor.UpperLeft);
            VexforgeTier1Ui.Anchor(eventLog.rectTransform, .065f,.315f,.935f,.50f);

            var scrollObject = new GameObject(
                "LegalActionsViewport", typeof(RectTransform), typeof(Image), typeof(Mask), typeof(ScrollRect));
            scrollObject.transform.SetParent(plaque.transform, false);
            VexforgeTier1Ui.Anchor(scrollObject.GetComponent<RectTransform>(), .065f,.12f,.935f,.30f);
            var viewportImage = scrollObject.GetComponent<Image>();
            viewportImage.color = new Color(.025f,.029f,.037f,.95f);
            var mask = scrollObject.GetComponent<Mask>();
            mask.showMaskGraphic = false;
            actionScroll = scrollObject.GetComponent<ScrollRect>();
            actionScroll.horizontal = false;
            actionScroll.vertical = true;
            actionScroll.movementType = ScrollRect.MovementType.Clamped;
            actionScroll.viewport = scrollObject.GetComponent<RectTransform>();
            var contentObject = new GameObject("LegalActions", typeof(RectTransform));
            contentObject.transform.SetParent(scrollObject.transform, false);
            actionContent = contentObject.GetComponent<RectTransform>();
            actionContent.anchorMin = new Vector2(0f, 1f);
            actionContent.anchorMax = new Vector2(1f, 1f);
            actionContent.pivot = new Vector2(.5f, 1f);
            actionContent.anchoredPosition = Vector2.zero;
            actionContent.sizeDelta = new Vector2(0f, 0f);
            actionScroll.content = actionContent;

            backButton = VexforgeTier1Ui.Button(
                plaque.transform, "Back", "VOLVER A BATALLA",
                Close, new Color(.045f,.050f,.056f,.97f), 12);
            VexforgeTier1Ui.Anchor(backButton.GetComponent<RectTransform>(), .075f,.035f,.47f,.095f);
            replayButton = VexforgeTier1Ui.Button(
                plaque.transform, "ReplayOrRetry", "REPLAY / REINTENTAR",
                ReplayOrRetry, new Color(.075f,.055f,.040f,.97f), 12);
            VexforgeTier1Ui.Anchor(replayButton.GetComponent<RectTransform>(), .53f,.035f,.925f,.095f);
            canvas.gameObject.SetActive(false);
        }

        private async Task ResumeOrStartAsync()
        {
            if (busy || app == null || app.Repository == null) return;
            busy = true;
            SetStatus("CARGANDO ESTADO V7 CONFIRMADO…");
            var playerId = app.GameState.PlayerId;
            var sessionPreference = SessionPreferenceName(playerId);
            sessionId = PlayerPrefs.GetString(sessionPreference, string.Empty);

            if (!string.IsNullOrWhiteSpace(sessionId))
            {
                try
                {
                    var restored = await app.Repository.GetTurnCombatStateAsync(sessionId);
                    if (restored != null && restored.ok)
                    {
                        if (!IsExpectedEncounterProfile(restored))
                        {
                            ShowBackendError("unsupported_profile");
                            busy = false;
                            return;
                        }
                        current = restored;
                        Render(restored);
                        busy = false;
                        return;
                    }
                    if (restored == null || restored.error == "session_not_found")
                    {
                        PlayerPrefs.DeleteKey(sessionPreference);
                        PlayerPrefs.Save();
                        sessionId = null;
                    }
                    else
                    {
                        ShowBackendError(restored.error);
                        busy = false;
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning("VEXFORGE V7 state restore failed: " + ex.Message);
                    ShowBackendError(null);
                    busy = false;
                    return;
                }
            }

            busy = false;
            await StartNewEncounterAsync(playerId);
        }

        private async Task StartNewEncounterAsync(string playerId)
        {
            if (busy || app == null || app.Repository == null || string.IsNullOrWhiteSpace(playerId)) return;
            busy = true;
            SetStatus(StartStatus());
            var keyName = StartPreferenceName(playerId);
            var idempotencyKey = GetOrCreateKey(keyName);
            try
            {
                var result = await StartSelectedEncounterAsync(idempotencyKey);
                if (result == null || !result.ok || string.IsNullOrWhiteSpace(result.session_id))
                {
                    ShowBackendError(result == null ? null : result.error);
                    busy = false;
                    return;
                }
                if (!IsExpectedEncounterProfile(result))
                {
                    ShowBackendError("unsupported_profile");
                    busy = false;
                    return;
                }

                sessionId = result.session_id;
                PlayerPrefs.SetString(SessionPreferenceName(playerId), sessionId);
                PlayerPrefs.DeleteKey(keyName);
                PlayerPrefs.Save();
                current = result;
                retryRequired = false;
                Render(result);
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 " + encounterMode + " start failed: " + ex.Message);
                ShowStartException(ex);
            }
            finally
            {
                busy = false;
            }
        }

        private Task<VexforgeTurnCombatResponse> StartSelectedEncounterAsync(string idempotencyKey)
        {
            if (encounterMode == "mission")
                return app.Repository.StartTurnCombatMissionAsync(encounterTargetId, idempotencyKey);
            if (encounterMode == "boss")
                return app.Repository.StartTurnCombatBossAsync(encounterTargetId, idempotencyKey);
            return app.Repository.StartTurnCombatTrainingAsync(idempotencyKey);
        }

        private bool IsExpectedEncounterProfile(VexforgeTurnCombatResponse response)
        {
            if (response == null) return false;
            if (pvpMode)
                return response.mode == "pvp" &&
                       response.profile == "pvp_no_rewards_v1" &&
                       response.ruleset_version == "vexforge_turn_v7_pvp_1" &&
                       !response.rewards_granted;
            if (encounterMode == "mission")
                return response.mode == "mission" &&
                       response.profile == "mission_card_profile_v1" &&
                       response.ruleset_version == "vexforge_turn_v7_mission_1";
            if (encounterMode == "boss")
                return response.mode == "boss" &&
                       response.profile == "boss_card_profile_v1" &&
                       response.ruleset_version == "vexforge_turn_v7_boss_1";
            return response.mode == "training_mirror" &&
                   response.profile == "training_mirror_v1" &&
                   response.ruleset_version == "vexforge_turn_v7_mirror_1" &&
                   !response.rewards_granted;
        }

        private string SessionPreferenceName(string playerId)
        {
            return encounterMode == "training"
                ? PreferenceKey(playerId, "session")
                : PreferenceKey(playerId, encounterMode + "." + encounterTargetId + ".session");
        }

        private string StartPreferenceName(string playerId)
        {
            return encounterMode == "training"
                ? PreferenceKey(playerId, "start")
                : PreferenceKey(playerId, encounterMode + "." + encounterTargetId + ".start");
        }

        private string StartStatus()
        {
            if (encounterMode == "mission") return "CREANDO COMBATE DE MISIÓN V7…";
            if (encounterMode == "boss") return "CREANDO COMBATE DE JEFE V7…";
            return "CREANDO ENTRENAMIENTO ESPEJO · SIN PREMIOS…";
        }

        private void SetEncounterChrome()
        {
            if (titleLabel != null)
            {
                titleLabel.text = encounterMode == "mission"
                    ? "V7 · COMBATE DE MISIÓN"
                    : encounterMode == "boss"
                        ? "V7 · COMBATE DE JEFE"
                        : encounterMode == "pvp"
                            ? "V7 · SALAS PvP"
                            : "V7 · ENTRENAMIENTO ESPEJO";
            }
            if (backButton != null)
            {
                backButton.GetComponentInChildren<Text>().text =
                    encounterMode == "mission"
                        ? "VOLVER A MISIONES"
                        : encounterMode == "boss"
                            ? "VOLVER AL ATLAS"
                            : "VOLVER A BATALLA";
            }
        }

        private void ShowStartException(Exception exception)
        {
            var message = exception == null ? string.Empty : exception.Message ?? string.Empty;
            var expectedRpc = encounterMode == "mission"
                ? "vexforge_turn_v7_start_mission"
                : encounterMode == "boss"
                    ? "vexforge_turn_v7_start_boss"
                    : string.Empty;
            if (!string.IsNullOrEmpty(expectedRpc) &&
                (message.IndexOf(expectedRpc, StringComparison.OrdinalIgnoreCase) >= 0 ||
                 message.IndexOf("PGRST202", StringComparison.OrdinalIgnoreCase) >= 0))
            {
                retryRequired = true;
                SetStatus("EL RPC V7 DE " +
                          (encounterMode == "mission" ? "MISIÓN" : "JEFE") +
                          " NO ESTÁ INSTALADO EN SUPABASE LIVE. NO SE INICIÓ NI SE SIMULÓ EL COMBATE.");
                if (replayButton != null)
                    replayButton.GetComponentInChildren<Text>().text = "REINTENTAR CON EL SERVIDOR";
                return;
            }
            ShowBackendError(null);
        }

        private async void SubmitAction(VexforgeTurnCombatAction action)
        {
            if (busy || current == null || !current.ok || action == null ||
                string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
                return;

            busy = true;
            SetStatus("ENVIANDO INTENCIÓN · ESPERANDO AL SERVIDOR…");
            var sequenceName = "action." + sessionId + "." + current.event_seq.ToString();
            var keyName = PreferenceKey(app.GameState.PlayerId, sequenceName);
            var idempotencyKey = GetOrCreateKey(keyName);
            try
            {
                var result = await app.Repository.SubmitTurnCombatActionAsync(
                    sessionId, current.event_seq, idempotencyKey, action);
                if (result == null || !result.ok)
                {
                    if (result != null && (result.error == "stale_event_seq" || result.error == "illegal_action"))
                    {
                        SetStatus("ESTADO CAMBIÓ · ACTUALIZANDO ACCIONES LEGALES…");
                        await RefreshStateAsync();
                    }
                    else
                    {
                        ShowBackendError(result == null ? null : result.error);
                    }
                    return;
                }

                PlayerPrefs.DeleteKey(keyName);
                PlayerPrefs.Save();
                current = result;
                replayIndex = -1;
                retryRequired = false;
                Render(result);
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 action request failed: " + ex.Message);
                ShowBackendError(null);
            }
            finally
            {
                busy = false;
            }
        }

        private async Task RefreshStateAsync()
        {
            if (string.IsNullOrWhiteSpace(sessionId)) return;
            try
            {
                var result = await app.Repository.GetTurnCombatStateAsync(sessionId);
                if (result != null && result.ok)
                {
                    current = result;
                    replayIndex = -1;
                    retryRequired = false;
                    Render(result);
                }
                else
                {
                    ShowBackendError(result == null ? null : result.error);
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 refresh failed: " + ex.Message);
                ShowBackendError(null);
            }
        }

        private void Render(VexforgeTurnCombatResponse response)
        {
            if (response == null) return;
            current = response;
            var isPvp = response.mode == "pvp";
            var isMission = response.mode == "mission";
            var isBoss = response.mode == "boss";
            if (!IsExpectedEncounterProfile(response))
            {
                SetStatus("PERFIL V7 NO ADMITIDO · NO SE ENVIARÁN MÁS ACCIONES.");
                board.text = "SESIÓN BLOQUEADA HASTA CONFIRMAR EL PERFIL DEL SERVIDOR.";
                eventLog.text = RenderEvents(response.events);
                ClearActionList();
                AddActionButton("SESIÓN V7 BLOQUEADA", null,
                    new Color(.055f,.025f,.025f,.97f), 0);
                return;
            }
            SetEncounterChrome();
            replayIndex = -1;
            retryRequired = false;
            canvas.gameObject.SetActive(true);
            if (replayButton != null)
                replayButton.GetComponentInChildren<Text>().text =
                    response.events != null && response.events.Length > 0
                        ? "REPLAY · EVENTOS CONFIRMADOS"
                        : "ACTUALIZAR ESTADO";
            if (response.status == "completed")
            {
                var winner = response.outcome == null ? null : response.outcome.winner_side;
                var won = winner == response.you_are_side;
                SetStatus(isPvp
                    ? (won
                        ? "PvP CERRADO · VICTORIA CONFIRMADA · SIN RECOMPENSAS"
                        : "PvP CERRADO · RESULTADO CONFIRMADO · SIN RECOMPENSAS")
                    : isMission
                        ? (won
                            ? "MISIÓN CUMPLIDA · RESULTADO CONFIRMADO" +
                              (response.rewards_granted ? " · RECOMPENSAS APLICADAS" : " · SIN RECOMPENSAS")
                            : "MISIÓN FALLIDA · RESULTADO CONFIRMADO · SIN RECOMPENSAS")
                        : isBoss
                            ? (won
                                ? "ENCUENTRO DE JEFE · VICTORIA CONFIRMADA" +
                                  (response.rewards_granted ? " · CONTRIBUCIÓN REGISTRADA" : string.Empty)
                                : "COMBATE DE JEFE CERRADO · DERROTA CONFIRMADA · SIN RECOMPENSAS")
                            : (won
                                ? "ENTRENAMIENTO COMPLETADO · VICTORIA CONFIRMADA"
                                : "ENTRENAMIENTO COMPLETADO · RESULTADO CONFIRMADO"));
            }
            else if (response.awaiting_opponent)
            {
                SetStatus("SALA PvP ABIERTA · ESPERANDO RIVAL · SIN RECOMPENSAS");
            }
            else if (response.phase == "response")
            {
                SetStatus(response.is_my_turn
                    ? "VENTANA DE RESPUESTA · ACCIÓN LEGAL DEL SERVIDOR"
                    : (isPvp
                        ? "ESPERANDO RESPUESTA DEL RIVAL"
                        : "ESPERANDO RESPUESTA DEL MOTOR"));
            }
            else
            {
                SetStatus(response.is_my_turn
                    ? "TU TURNO · RONDA " + response.round + " · EVENTO " + response.event_seq
                    : (isPvp
                        ? "ESPERANDO TURNO DEL RIVAL · EVENTO " + response.event_seq
                        : "ESPERANDO AL OTRO LADO · EVENTO " + response.event_seq));
            }

            board.text = RenderBoard(response.board, response.you_are_side);
            if (response.awaiting_opponent)
                board.text += "\nID DE SALA: " + response.session_id;
            eventLog.text = RenderEvents(response.events);
            ClearActionList();

            if (response.status == "completed")
            {
                if (isPvp)
                {
                    AddActionButton(
                        "VOLVER A SALAS PvP",
                        ReturnToPvpLobby,
                        new Color(.045f,.050f,.056f,.97f),
                        0);
                }
                else if (!isMission && !isBoss)
                {
                    AddActionButton(
                        "INICIAR OTRO ENTRENAMIENTO · SIN RECOMPENSAS",
                        () =>
                        {
                            if (app != null && app.GameState != null)
                                _ = StartNewEncounterAsync(app.GameState.PlayerId);
                        },
                        new Color(.075f,.055f,.040f,.97f),
                        0);
                }
                return;
            }
            if (response.awaiting_opponent)
            {
                AddActionButton(
                    "ACTUALIZAR ESTADO DE LA SALA",
                    () => { _ = RefreshStateAsync(); },
                    new Color(.045f,.050f,.056f,.97f),
                    0);
                return;
            }
            if (!response.is_my_turn)
            {
                AddActionButton(
                    isPvp ? "ACTUALIZAR ESTADO PvP" : "ESPERANDO CONFIRMACIÓN DEL SERVIDOR",
                    isPvp ? (Action)(() => { _ = RefreshStateAsync(); }) : null,
                    new Color(.035f,.040f,.048f,.96f),
                    0);
                return;
            }

            var actions = response.legal_actions ?? new VexforgeTurnCombatAction[0];
            if (actions.Length == 0)
            {
                AddActionButton("EL SERVIDOR NO REPORTÓ ACCIONES LEGALES", null,
                    new Color(.035f,.040f,.048f,.96f), 0);
                if (isPvp)
                    AddActionButton("ACTUALIZAR ESTADO PvP",
                        () => { _ = RefreshStateAsync(); },
                        new Color(.045f,.050f,.056f,.97f), 1);
                return;
            }
            for (var i = 0; i < actions.Length; i++)
            {
                var action = actions[i];
                AddActionButton(
                    FormatAction(action, response.board),
                    () => SubmitAction(action),
                    action.kind == "attack"
                        ? new Color(.075f,.055f,.040f,.97f)
                        : new Color(.045f,.050f,.056f,.97f),
                    i);
            }
            if (isPvp)
                AddActionButton("ACTUALIZAR ESTADO PvP",
                    () => { _ = RefreshStateAsync(); },
                    new Color(.045f,.050f,.056f,.97f),
                    actions.Length);
        }

        private static string RenderBoard(VexforgeTurnCombatBoard value, string ownerSide)
        {
            if (value == null) return "EL SERVIDOR AÚN NO DEVOLVIÓ EL TABLERO.";
            var builder = new StringBuilder();
            AppendSide(builder, "A · " + (ownerSide == "a" ? "TÚ" : "RIVAL"), value.a);
            builder.AppendLine();
            AppendSide(builder, "B · " + (ownerSide == "b" ? "TÚ" : "RIVAL"), value.b);
            return builder.ToString();
        }

        private static void AppendSide(StringBuilder builder, string label, VexforgeTurnCombatUnit[] units)
        {
            builder.AppendLine(label);
            if (units == null || units.Length == 0)
            {
                builder.AppendLine("  SIN UNIDADES");
                return;
            }
            for (var i = 0; i < units.Length; i++)
            {
                var unit = units[i];
                if (unit == null) continue;
                if (unit.hidden)
                {
                    builder.AppendLine("  RESERVA · OCULTA POR EL SERVIDOR");
                    continue;
                }
                builder.Append("  ").Append((unit.slot ?? "UNIDAD").ToUpperInvariant())
                    .Append(" · ").Append(unit.name ?? "UNIDAD")
                    .Append(" · HP ").Append(unit.hp).Append('/').Append(unit.max_hp)
                    .Append(" · ATQ ").Append(unit.atk)
                    .Append(" · DEF ").Append(unit.def)
                    .Append(" · VEL ").Append(unit.spd);
                if (!unit.alive) builder.Append(" · CAÍDA");
                builder.AppendLine();
                if (unit.is_champion && unit.stat_breakdown != null)
                {
                    var breakdown = unit.stat_breakdown;
                    if (breakdown.base_stats != null && breakdown.formation != null && breakdown.effects != null)
                    {
                        builder.Append("    BASE ").Append(breakdown.base_stats.hp).Append('/')
                            .Append(breakdown.base_stats.atk).Append('/')
                            .Append(breakdown.base_stats.def).Append('/')
                            .Append(breakdown.base_stats.spd)
                            .Append(" · FORMACIÓN RESERVA ")
                            .Append(breakdown.formation.reserve_count)
                            .Append(" · EFECTOS GUARD ")
                            .Append(breakdown.effects.guard_def)
                            .Append(" / SURGE ")
                            .Append(breakdown.effects.surge_speed)
                            .AppendLine();
                    }
                }
            }
        }

        private static string RenderEvents(VexforgeTurnCombatEvent[] events)
        {
            if (events == null || events.Length == 0) return "REGISTRO: SIN EVENTOS.";
            var builder = new StringBuilder("REGISTRO CONFIRMADO · ");
            builder.Append(events.Length).AppendLine(" EVENTOS");
            var start = Math.Max(0, events.Length - 4);
            for (var i = start; i < events.Length; i++)
            {
                var item = events[i];
                if (item == null) continue;
                builder.Append('#').Append(item.event_seq).Append(" · ")
                    .Append(DescribeEvent(item)).AppendLine();
            }
            return builder.ToString();
        }

        private static string DescribeEvent(VexforgeTurnCombatEvent item)
        {
            var payload = item.event_payload;
            switch (item.event_type)
            {
                case "session_started": return "SESIÓN V7 INICIADA · PERFIL CONFIRMADO POR EL SERVIDOR";
                case "attack_declared":
                    return "ATAQUE DECLARADO POR " + SideLabel(item.actor_side);
                case "attack_resolved":
                    return "DAÑO CONFIRMADO " + (payload == null ? 0 : payload.damage) +
                           (payload != null && payload.critical ? " · CRÍTICO" : string.Empty) +
                           (payload != null && payload.shield_blocked ? " · BLOQUEADO POR VEIL" : string.Empty);
                case "formation_changed":
                    return "FORMACIÓN ACTUALIZADA · " +
                           (payload == null ? "CAMBIO" : (payload.kind ?? "CAMBIO").ToUpperInvariant());
                case "turn_ended": return "TURNO CERRADO POR " + SideLabel(item.actor_side);
                case "combat_completed":
                    return "COMBATE CERRADO · GANADOR " +
                           SideLabel(payload == null ? null : payload.winner_side);
                default: return "EVENTO CONFIRMADO";
            }
        }

        private static string SideLabel(string side)
        {
            if (side == "a") return "A";
            if (side == "b") return "B";
            return "SISTEMA";
        }

        private string FormatAction(VexforgeTurnCombatAction action, VexforgeTurnCombatBoard value)
        {
            if (action == null) return "ACCIÓN";
            if (action.kind == "attack")
                return "ATACAR · " + UnitName(value, action.unit_id) + " → " + UnitName(value, action.target_id);
            if (action.kind == "move")
                return "MOVER · " + UnitName(value, action.source_unit_id) + " ↔ " +
                       UnitName(value, action.target_unit_id);
            if (action.kind == "replace")
                return "REEMPLAZAR · " + UnitName(value, action.target_unit_id) + " ← " +
                       UnitName(value, action.source_unit_id);
            if (action.kind == "pass_priority") return "PASAR PRIORIDAD";
            if (action.kind == "end_turn") return "TERMINAR TURNO";
            return "ACCIÓN NO RECONOCIDA";
        }

        private static string UnitName(VexforgeTurnCombatBoard value, string unitId)
        {
            if (value == null) return "UNIDAD";
            var name = FindUnitName(value.a, unitId);
            if (!string.IsNullOrEmpty(name)) return name;
            name = FindUnitName(value.b, unitId);
            return string.IsNullOrEmpty(name) ? "UNIDAD" : name;
        }

        private static string FindUnitName(VexforgeTurnCombatUnit[] units, string unitId)
        {
            if (units == null) return null;
            for (var i = 0; i < units.Length; i++)
                if (units[i] != null && units[i].unit_id == unitId)
                    return units[i].hidden ? "RESERVA" : (units[i].name ?? "UNIDAD");
            return null;
        }

        private void AddActionButton(string label, Action action, Color fill, int index)
        {
            UnityEngine.Events.UnityAction callback = null;
            if (action != null) callback = delegate { action(); };
            var button = VexforgeTier1Ui.Button(
                actionContent, "LegalAction_" + index, label,
                callback,
                fill, 12);
            var rect = button.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0f, 1f);
            rect.anchorMax = new Vector2(1f, 1f);
            rect.pivot = new Vector2(.5f, 1f);
            rect.anchoredPosition = new Vector2(0f, -index * 104f - 8f);
            rect.sizeDelta = new Vector2(-16f, 92f);
            if (action == null) button.interactable = false;
            actionContent.sizeDelta = new Vector2(0f, (index + 1) * 104f + 8f);
        }

        private void ClearActionList()
        {
            if (actionContent == null) return;
            for (var i = actionContent.childCount - 1; i >= 0; i--)
                Destroy(actionContent.GetChild(i).gameObject);
            actionContent.sizeDelta = Vector2.zero;
        }

        private void ReplayOrRetry()
        {
            if (retryRequired)
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    if (pvpMode) _ = DiscoverPvpRoomsAsync();
                    else OpenCurrentEncounter();
                }
                else _ = RefreshStateAsync();
                return;
            }
            if (current == null || current.events == null || current.events.Length == 0)
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    if (pvpMode) _ = DiscoverPvpRoomsAsync();
                    else OpenCurrentEncounter();
                }
                else _ = RefreshStateAsync();
                return;
            }
            replayIndex = (replayIndex + 1) % current.events.Length;
            var item = current.events[replayIndex];
            if (item == null || item.state == null) return;
            board.text = RenderBoard(item.state.board, current.you_are_side);
            SetStatus("REPLAY DEL EVENTO " + item.event_seq + " · SNAPSHOT CONFIRMADO");
            if (replayButton != null) replayButton.GetComponentInChildren<Text>().text =
                "SIGUIENTE EVENTO · " + (replayIndex + 1) + "/" + current.events.Length;
        }

        private void Close()
        {
            var playerId = app == null || app.GameState == null ? null : app.GameState.PlayerId;
            if ((encounterMode == "mission" || encounterMode == "boss") &&
                current != null && current.status == "completed" &&
                !string.IsNullOrWhiteSpace(playerId))
            {
                PlayerPrefs.DeleteKey(SessionPreferenceName(playerId));
                PlayerPrefs.Save();
            }
            if (canvas != null) canvas.gameObject.SetActive(false);
            if ((encounterMode == "mission" || encounterMode == "boss") &&
                app != null && app.Navigation != null)
            {
                app.Navigation.Navigate(encounterMode == "mission" ? GameRoute.Missions : GameRoute.World);
                return;
            }
            if (battleGate != null && app != null && app.Session != null && app.Session.IsAuthenticated)
                battleGate.Show();
        }

        private void ShowBackendError(string error)
        {
            retryRequired = true;
            if (error == "active_deck_required")
                SetStatus(pvpMode
                    ? "CONFIGURA UN DECK ACTIVO ANTES DE UNIRTE A PvP."
                    : encounterMode == "mission"
                        ? "CONFIGURA UN DECK ACTIVO ANTES DE INICIAR LA MISIÓN."
                        : encounterMode == "boss"
                            ? "CONFIGURA UN DECK ACTIVO ANTES DE INICIAR EL COMBATE DE JEFE."
                            : "CONFIGURA UN DECK ACTIVO ANTES DE INICIAR EL ENTRENAMIENTO.");
            else if (error == "authentication_required")
                SetStatus(pvpMode
                    ? "INICIA SESIÓN PARA ABRIR LAS SALAS PvP."
                    : encounterMode == "mission"
                        ? "INICIA SESIÓN PARA INICIAR LA MISIÓN."
                        : encounterMode == "boss"
                            ? "INICIA SESIÓN PARA INICIAR EL COMBATE DE JEFE."
                            : "INICIA SESIÓN PARA ABRIR EL ENTRENAMIENTO.");
            else if (error == "room_not_joinable")
                SetStatus("LA SALA YA NO ESTÁ DISPONIBLE · ACTUALIZA LA LISTA PvP.");
            else if (error == "session_not_found")
                SetStatus(pvpMode
                    ? "LA SALA PvP YA NO ESTÁ DISPONIBLE · ACTUALIZA LA LISTA."
                    : "LA SESIÓN YA NO ESTÁ DISPONIBLE · VUELVE A INICIAR EL ENCUENTRO.");
            else if (error == "not_a_participant")
                SetStatus("ESTA SESIÓN SÓLO ESTÁ DISPONIBLE PARA SUS PARTICIPANTES.");
            else if (error == "unsupported_profile")
                SetStatus(pvpMode
                    ? "EL PERFIL PvP O SU CONTRATO DE RECOMPENSAS NO ESTÁ ADMITIDO."
                    : encounterMode == "mission"
                        ? "EL PERFIL V7 DE MISIÓN NO COINCIDE CON EL CONTRATO ADMITIDO."
                        : encounterMode == "boss"
                            ? "EL PERFIL V7 DE JEFE NO COINCIDE CON EL CONTRATO ADMITIDO."
                            : "EL PERFIL V7 DE ENTRENAMIENTO NO ESTÁ ADMITIDO.");
            else if (error == "insufficient_energy")
                SetStatus("ENERGÍA INSUFICIENTE · NO SE INICIÓ LA MISIÓN.");
            else if (error == "mission_not_eligible" || error == "mission_not_found")
                SetStatus("ESTA MISIÓN NO ESTÁ DISPONIBLE PARA COMBATE V7.");
            else if (error == "world_boss_not_available")
                SetStatus("ESTE JEFE NO ESTÁ DISPONIBLE PARA COMBATE V7.");
            else if (error == "official_card_profile_unavailable")
                SetStatus("EL SERVIDOR NO PUDO PREPARAR UN PERFIL CON CARTAS OFICIALES ACTIVAS.");
            else if (error == "idempotency_key_reused" || error == "battle_run_idempotency_conflict")
                SetStatus("LA CLAVE DE SESIÓN YA ESTÁ ASOCIADA A OTRO COMBATE · NO SE CREÓ OTRO ENCUENTRO.");
            else if (error == "invalid_request" || error == "player_not_found")
                SetStatus("EL SERVIDOR NO PUDO VALIDAR AL JUGADOR O EL ENCUENTRO.");
            else if (encounterMode == "mission" || encounterMode == "boss")
                SetStatus("COMBATE V7 NO DISPONIBLE · EL SERVIDOR NO CONFIRMÓ EL ENCUENTRO; NO SE SIMULÓ LOCALMENTE.");
            else
                SetStatus("V7 NO ESTÁ DISPONIBLE EN EL SERVIDOR · NO SE SIMULÓ LOCALMENTE.");
            if (replayButton != null)
                replayButton.GetComponentInChildren<Text>().text = "REINTENTAR CON EL SERVIDOR";
        }

        private void ShowMessage(string value)
        {
            if (canvas == null) Build();
            SetStatus(value);
            canvas.gameObject.SetActive(true);
        }

        private void SetStatus(string value)
        {
            if (status != null) status.text = value ?? string.Empty;
        }

        private static string PreferenceKey(string playerId, string suffix)
        {
            return PreferencePrefix + VexforgeTier1IdentityScope.For(playerId) + "." + suffix;
        }

        private static string GetOrCreateKey(string preferenceName)
        {
            var value = PlayerPrefs.GetString(preferenceName, string.Empty);
            if (!string.IsNullOrWhiteSpace(value)) return value;
            var appId = Application.identifier ?? string.Empty;
            if (appId.Length > 40) appId = appId.Substring(0, 40);
            value = appId + ":v7:" + DateTime.UtcNow.Ticks;
            PlayerPrefs.SetString(preferenceName, value);
            PlayerPrefs.Save();
            return value;
        }
    }
}
