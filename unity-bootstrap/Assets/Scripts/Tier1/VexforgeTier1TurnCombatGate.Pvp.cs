using System;
using System.Threading.Tasks;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Tier1
{
    public sealed partial class VexforgeTier1TurnCombatGate
    {
        private bool pvpMode;

        public void OpenPvp()
        {
            if (canvas == null) Build();
            if (busy)
            {
                canvas.gameObject.SetActive(true);
                return;
            }
            pvpMode = true;
            encounterMode = "pvp";
            encounterTargetId = null;
            SetEncounterChrome();
            if (app == null || app.Session == null || !app.Session.IsAuthenticated ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
            {
                ShowMessage("INICIA SESIÓN PARA ABRIR LAS SALAS PvP V7.");
                canvas.gameObject.SetActive(true);
                return;
            }

            canvas.gameObject.SetActive(true);
            current = null;
            sessionId = null;
            replayIndex = -1;
            _ = ResumeOrDiscoverPvpAsync();
        }

        private async Task ResumeOrDiscoverPvpAsync()
        {
            if (busy || app == null || app.Repository == null ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
                return;

            busy = true;
            var shouldDiscover = true;
            var playerId = app.GameState.PlayerId;
            var sessionPreference = PreferenceKey(playerId, "pvp.session");
            sessionId = PlayerPrefs.GetString(sessionPreference, string.Empty);
            SetStatus("BUSCANDO UNA SALA PvP V7…");
            try
            {
                if (!string.IsNullOrWhiteSpace(sessionId))
                {
                    var restored = await app.Repository.GetTurnCombatStateAsync(sessionId);
                    if (restored != null && restored.ok)
                    {
                        current = restored;
                        Render(restored);
                        return;
                    }
                    if (restored == null || restored.error == "session_not_found" ||
                        restored.error == "not_a_participant")
                    {
                        PlayerPrefs.DeleteKey(sessionPreference);
                        PlayerPrefs.Save();
                        sessionId = null;
                    }
                    else
                    {
                        ShowBackendError(restored.error);
                        shouldDiscover = false;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 PvP state restore failed: " + ex.Message);
                ShowBackendError(null);
                shouldDiscover = false;
            }
            finally
            {
                busy = false;
            }

            if (shouldDiscover)
                await DiscoverPvpRoomsAsync();
        }

        private async Task CreatePvpRoomAsync()
        {
            if (busy || !pvpMode || app == null || app.Repository == null ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId))
                return;

            busy = true;
            var playerId = app.GameState.PlayerId;
            var keyName = PreferenceKey(playerId, "pvp.create");
            var idempotencyKey = GetOrCreateKey(keyName);
            SetStatus("CREANDO SALA PvP · SIN RECOMPENSAS…");
            try
            {
                var result = await app.Repository.CreateTurnCombatPvpRoomAsync(idempotencyKey);
                if (result == null || !result.ok || string.IsNullOrWhiteSpace(result.session_id))
                {
                    ShowBackendError(result == null ? null : result.error);
                    return;
                }
                if (result.mode != "pvp" || result.profile != "pvp_no_rewards_v1" ||
                    result.ruleset_version != "vexforge_turn_v7_pvp_1" || result.rewards_granted)
                {
                    ShowBackendError("unsupported_profile");
                    return;
                }

                sessionId = result.session_id;
                PlayerPrefs.SetString(PreferenceKey(playerId, "pvp.session"), sessionId);
                PlayerPrefs.DeleteKey(keyName);
                PlayerPrefs.Save();
                current = result;
                retryRequired = false;
                Render(result);
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 PvP room creation failed: " + ex.Message);
                ShowBackendError(null);
            }
            finally
            {
                busy = false;
            }
        }

        private async Task DiscoverPvpRoomsAsync()
        {
            if (busy || !pvpMode || app == null || app.Repository == null) return;
            busy = true;
            SetStatus("BUSCANDO SALAS PvP DISPONIBLES…");
            board.text = "SALAS V7 SIN RECOMPENSAS\nSolo jugadores autenticados pueden descubrir y unirse.";
            eventLog.text = "La formación y el estado de combate se confirman en el servidor.";
            ClearActionList();
            AddActionButton(
                "CREAR SALA PvP · SIN RECOMPENSAS",
                () => { _ = CreatePvpRoomAsync(); },
                new Color(.075f,.055f,.040f,.97f),
                0);
            AddActionButton(
                "ACTUALIZAR SALAS",
                () => { _ = DiscoverPvpRoomsAsync(); },
                new Color(.045f,.050f,.056f,.97f),
                1);

            try
            {
                var listing = await app.Repository.DiscoverTurnCombatPvpRoomsAsync(16);
                if (listing == null || !listing.ok)
                {
                    ShowBackendError(listing == null ? null : listing.error);
                    return;
                }

                var rooms = listing.rooms ?? new VexforgeTurnCombatPvpRoom[0];
                var displayed = 0;
                for (var i = 0; i < rooms.Length; i++)
                {
                    var room = rooms[i];
                    if (room == null || string.IsNullOrWhiteSpace(room.session_id) ||
                        room.rewards_granted || room.ruleset_version != "vexforge_turn_v7_pvp_1")
                        continue;
                    var roomId = room.session_id;
                    var labelId = roomId.Length > 8 ? roomId.Substring(0, 8) : roomId;
                    AddActionButton(
                        "UNIRSE · SALA " + labelId,
                        () => { _ = JoinPvpRoomAsync(roomId); },
                        new Color(.035f,.050f,.052f,.97f),
                        2 + displayed);
                    displayed++;
                }

                if (displayed == 0)
                {
                    AddActionButton(
                        "NO HAY SALAS ABIERTAS · CREA UNA O ACTUALIZA",
                        null,
                        new Color(.035f,.040f,.048f,.96f),
                        2);
                    SetStatus("SIN SALAS PvP ABIERTAS · SIN RECOMPENSAS");
                }
                else
                {
                    SetStatus("SALAS PvP DISPONIBLES · SIN RECOMPENSAS");
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 PvP room discovery failed: " + ex.Message);
                ShowBackendError(null);
            }
            finally
            {
                busy = false;
            }
        }

        private async Task JoinPvpRoomAsync(string roomId)
        {
            if (busy || !pvpMode || app == null || app.Repository == null ||
                app.GameState == null || string.IsNullOrWhiteSpace(app.GameState.PlayerId) ||
                string.IsNullOrWhiteSpace(roomId))
                return;

            busy = true;
            var playerId = app.GameState.PlayerId;
            var keyName = PreferenceKey(playerId, "pvp.join." + roomId);
            var idempotencyKey = GetOrCreateKey(keyName);
            var refreshRooms = false;
            SetStatus("VALIDANDO FORMACIÓN Y UNIÉNDOTE A PvP…");
            try
            {
                var result = await app.Repository.JoinTurnCombatPvpRoomAsync(roomId, idempotencyKey);
                if (result == null || !result.ok)
                {
                    var error = result == null ? null : result.error;
                    ShowBackendError(error);
                    refreshRooms = error == "room_not_joinable" || error == "session_not_found";
                }
                else
                {
                    if (result.idempotent)
                    {
                        var refreshed = await app.Repository.GetTurnCombatStateAsync(roomId);
                        if (refreshed == null || !refreshed.ok)
                        {
                            ShowBackendError(refreshed == null ? null : refreshed.error);
                            result = null;
                        }
                        else
                        {
                            result = refreshed;
                        }
                    }

                    if (result != null)
                    {
                        if (result.mode != "pvp" || result.profile != "pvp_no_rewards_v1" ||
                            result.ruleset_version != "vexforge_turn_v7_pvp_1" || result.rewards_granted)
                        {
                            ShowBackendError("unsupported_profile");
                            result = null;
                        }
                    }
                    if (result != null)
                    {
                        sessionId = roomId;
                        PlayerPrefs.SetString(PreferenceKey(playerId, "pvp.session"), sessionId);
                        PlayerPrefs.DeleteKey(keyName);
                        PlayerPrefs.Save();
                        current = result;
                        retryRequired = false;
                        Render(result);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE V7 PvP room join failed: " + ex.Message);
                ShowBackendError(null);
            }
            finally
            {
                busy = false;
            }

            if (refreshRooms)
                await DiscoverPvpRoomsAsync();
        }

        private void ReturnToPvpLobby()
        {
            if (app != null && app.GameState != null &&
                !string.IsNullOrWhiteSpace(app.GameState.PlayerId))
            {
                PlayerPrefs.DeleteKey(PreferenceKey(app.GameState.PlayerId, "pvp.session"));
                PlayerPrefs.Save();
            }
            current = null;
            sessionId = null;
            replayIndex = -1;
            retryRequired = false;
            pvpMode = true;
            _ = DiscoverPvpRoomsAsync();
        }
    }
}
