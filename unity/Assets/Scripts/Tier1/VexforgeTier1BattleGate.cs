using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    [Serializable]
    internal sealed class Tier1PvpOpponentRecord
    {
        public string id;
        public string player_id;
        public string display_name;
        public int mmr;
        public int deck_size;
    }

    public sealed class VexforgeTier1BattleGate : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private BattlePresentationDirector canonicalBattle;
        private VexforgeTier1BattleResultHud resultHud;
        private VexforgeTier1OperationJournal journal;
        private Canvas canvas;
        private Image hero;
        private RectTransform list;
        private Text status;
        private Text strategy;
        private Button confirmButton;
        private Button changeOpponentButton;
        private bool shown;
        private bool busy;
        private bool completionSubscribed;
        private BattleResult pendingResult;
        private string pendingOperation;
        private string selectedOpponentId;
        private string selectedOpponentName;
        private bool completionReported;
        private readonly VexforgeTier1StrategyDirector strategyDirector = new VexforgeTier1StrategyDirector();

        public event Action<BattleResult> BattleCompleted;
        public bool IsBattleActive => busy || pendingResult != null || (canonicalBattle != null && canonicalBattle.State == PresentationState.Playing);
        public bool IsNavigationLocked => IsBattleActive;

        public void HandleSignedOut()
        {
            shown=false;
            busy=false;
            pendingResult=null;
            pendingOperation=null;
            selectedOpponentId=null;
            selectedOpponentName=null;
            completionReported=false;
            if(canvas!=null)canvas.gameObject.SetActive(false);
            if(resultHud!=null)resultHud.Hide();
        }

        public void Initialize(VexforgeApp host, BattlePresentationDirector director, VexforgeTier1AssetRegistry registry)
        {
            app = host;
            canonicalBattle = director;
            assets = registry;
            journal = new VexforgeTier1OperationJournal();
            resultHud = gameObject.GetComponent<VexforgeTier1BattleResultHud>();
            if (resultHud == null) resultHud = gameObject.AddComponent<VexforgeTier1BattleResultHud>();
            resultHud.Initialize(app);
            Build();
            SubscribeCompletion();
        }

        public void BindCanonicalBattle(BattlePresentationDirector director)
        {
            UnsubscribeCompletion();
            canonicalBattle = director;
            SubscribeCompletion();
        }

        public void Show()
        {
            if (canvas == null) Build();
            shown = true;
            resultHud.Hide();
            canvas.gameObject.SetActive(true);

            if (busy)
            {
                SetStatus("OPERACIÓN DE BATALLA EN CURSO · NO SE DUPLICA LA PETICIÓN");
                return;
            }

            if (pendingResult != null)
            {
                HideGateOnly();
                return;
            }

            string pendingOp;
            string pendingOpponent;
            string pendingKey;
            if (app != null && app.GameState != null && journal.TryGetPending(app.GameState.PlayerId, out pendingOp, out pendingOpponent, out pendingKey))
            {
                pendingOperation = pendingOp;
                selectedOpponentId = pendingOpponent;
                selectedOpponentName = "RIVAL DEL NEXUS";
                busy = true;
                SetStatus("REANUDANDO DESAFÍO · REUTILIZANDO CLAVE AUTORIZADA");
                _ = ResumePendingAsync(pendingKey);
                return;
            }

            pendingOperation = null;
            selectedOpponentId = null;
            selectedOpponentName = null;
            completionReported = false;
            HideConfirmActions();
            ClearList();
            SetStatus(canonicalBattle == null || !canonicalBattle.IsInitialized ? "CAMPO DE BATALLA EN PREPARACIÓN" : "ELIGE TU RIVAL");
            _ = DiscoverAsync();
        }

        public void Hide()
        {
            shown = false;
            if (!IsBattleActive) busy = false;
            if (canvas != null) canvas.gameObject.SetActive(false);
            if (resultHud != null && pendingResult == null) resultHud.Hide();
        }

        private void Build()
        {
            if (canvas != null) return;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1BattleGate", 62, 4.4f);
            var bg = new GameObject("BattleBackdrop", typeof(RectTransform), typeof(Image));
            bg.transform.SetParent(canvas.transform, false);
            VexforgeTier1Ui.Full(bg.GetComponent<RectTransform>());
            hero = bg.GetComponent<Image>();
            hero.color = new Color(.006f,.008f,.013f,1f);
            var tex = assets == null ? null : assets.LoadTexture("VF_BATTLE_ARENA_CITADEL_A", "VF_NEXUS_CITADEL_HERO");
            if (tex != null)
            {
                hero.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(.5f, .5f), 100f);
                hero.type = Image.Type.Simple;
                hero.preserveAspect = false;
            }
            hero.raycastTarget = false;

            var veil = VexforgeTier1Ui.Panel(canvas.transform, "BattleVeil", new Color(.004f,.005f,.009f,.56f));
            VexforgeTier1Ui.Full(veil.rectTransform); veil.raycastTarget = false;
            var plaque = VexforgeTier1Ui.Panel(canvas.transform, "GatePlaque", new Color(.012f,.014f,.020f,.90f));
            VexforgeTier1Ui.Anchor(plaque.rectTransform, .05f,.10f,.95f,.88f);
            var title = VexforgeTier1Ui.Label(plaque.transform, "Title", "BATTLE GATE", 31, VexforgeTier1Ui.Gold, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform, .07f,.88f,.93f,.96f);
            status = VexforgeTier1Ui.Label(plaque.transform, "Status", string.Empty, 12, VexforgeTier1Ui.Muted, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(status.rectTransform, .07f,.82f,.93f,.88f);
            strategy = VexforgeTier1Ui.Label(plaque.transform, "Strategy", "SELECCIONA UN RIVAL PARA LEER TU FORMACIÓN.", 13, VexforgeTier1Ui.Text, TextAnchor.UpperLeft);
            VexforgeTier1Ui.Anchor(strategy.rectTransform, .08f,.65f,.92f,.79f);
            list = new GameObject("OpponentSeals", typeof(RectTransform)).GetComponent<RectTransform>();
            list.SetParent(plaque.transform, false);
            VexforgeTier1Ui.Anchor(list, .07f,.23f,.93f,.63f);

            confirmButton = VexforgeTier1Ui.Button(plaque.transform, "Confirm", "SELLAR DESAFÍO", ConfirmSelectedOpponent, new Color(.075f,.055f,.040f,.97f), 13);
            VexforgeTier1Ui.Anchor(confirmButton.GetComponent<RectTransform>(), .09f,.075f,.56f,.145f);
            changeOpponentButton = VexforgeTier1Ui.Button(plaque.transform, "Change", "CAMBIAR RIVAL", CancelSelection, new Color(.045f,.050f,.056f,.97f), 13);
            VexforgeTier1Ui.Anchor(changeOpponentButton.GetComponent<RectTransform>(), .60f,.075f,.91f,.145f);
            HideConfirmActions();
            canvas.gameObject.SetActive(false);
        }

        private void SubscribeCompletion()
        {
            if (completionSubscribed || canonicalBattle == null) return;
            canonicalBattle.PresentationCompleted += HandlePresentationCompleted;
            completionSubscribed = true;
        }

        private void UnsubscribeCompletion()
        {
            if (!completionSubscribed || canonicalBattle == null) return;
            canonicalBattle.PresentationCompleted -= HandlePresentationCompleted;
            completionSubscribed = false;
        }

        private async Task DiscoverAsync()
        {
            if (!shown || app == null || app.Session == null || !app.Session.IsAuthenticated) { SetStatus("AUTENTICACIÓN REQUERIDA"); return; }
            if (canonicalBattle == null || !canonicalBattle.IsInitialized) { SetStatus("CAMPO DE BATALLA AÚN NO LISTO"); return; }
            try
            {
                var client = app.Services.Resolve<SupabaseClient>();
                if (client == null) { SetStatus("AUTORIDAD SUPABASE NO DISPONIBLE"); return; }
                var response = await client.RpcAsync("get_pvp_opponents", "{\"p_limit\":8}");
                if (!shown) return;
                if (response == null || !response.Ok) { SetStatus("LA ARENA NO DEVOLVIÓ RIVALES"); return; }
                var rows = JsonArrayUtility.FromJson<Tier1PvpOpponentRecord>(response.Body);
                if (rows == null || rows.Length == 0) { SetStatus("NO HAY RIVALES REPORTADOS POR EL SERVIDOR"); return; }
                Render(rows);
            }
            catch (Exception ex)
            {
                SetStatus("CONEXIÓN NO CONFIRMADA · NO SE USA RESULTADO LOCAL");
                Debug.LogWarning("VEXFORGE Tier1 opponent discovery: " + ex.Message);
            }
        }

        private void Render(Tier1PvpOpponentRecord[] rows)
        {
            ClearList();
            SetStatus("ELIGE UN RIVAL · DESPUÉS CONFIRMA EL DESAFÍO");
            var slots = app.GameState.Deck ?? new DeckSlot[0];
            var usedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var rendered = 0;
            for (var i = 0; i < rows.Length && rendered < 4; i++)
            {
                var row = rows[i];
                if (row == null) continue;
                var id = string.IsNullOrWhiteSpace(row.player_id) ? row.id : row.player_id;
                if (string.IsNullOrWhiteSpace(id)) continue;
                if (string.Equals(id, app.GameState.PlayerId, StringComparison.OrdinalIgnoreCase)) continue;
                if (!usedIds.Add(id)) continue;
                var name = string.IsNullOrWhiteSpace(row.display_name) ? "RIVAL DEL NEXUS" : row.display_name;
                var mmr = row.mmr > 0 ? row.mmr.ToString() : "REPORTADO";
                var deckSize = row.deck_size > 0 ? row.deck_size.ToString() : "REPORTADO";
                var index = rendered++;
                var button = VexforgeTier1Ui.Button(list, "Opponent_" + index,
                    name.ToUpperInvariant() + "\nMMR " + mmr + " · DECK " + deckSize,
                    () => SelectOpponent(id, name, row.mmr, row.deck_size),
                    new Color(.045f,.043f,.040f,.96f), 14);
                VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), .02f, .76f - index*.18f, .98f, .90f - index*.18f);
            }
            strategy.text = strategyDirector.BuildPreMatchReadout(app.GameState.Catalog, slots, "RIVAL DEL NEXUS", 0, 0);
        }

        private void SelectOpponent(string opponentId, string name, int mmr, int deckSize)
        {
            if (busy || string.IsNullOrWhiteSpace(opponentId)) return;
            selectedOpponentId = opponentId;
            selectedOpponentName = name;
            strategy.text = strategyDirector.BuildPreMatchReadout(app.GameState.Catalog, app.GameState.Deck, name, mmr, deckSize);
            confirmButton.gameObject.SetActive(true);
            changeOpponentButton.gameObject.SetActive(true);
            SetStatus("RIVAL MARCADO · REVISA TU FORMACIÓN ANTES DE SELLAR");
        }

        private void ConfirmSelectedOpponent()
        {
            if (busy || string.IsNullOrWhiteSpace(selectedOpponentId)) return;
            HideConfirmActions();
            _ = BeginBattleAsync(selectedOpponentId, string.IsNullOrWhiteSpace(selectedOpponentName) ? "RIVAL DEL NEXUS" : selectedOpponentName, null);
        }

        private void CancelSelection()
        {
            if (busy) return;
            selectedOpponentId = null;
            selectedOpponentName = null;
            HideConfirmActions();
            strategy.text = strategyDirector.BuildPreMatchReadout(app.GameState.Catalog, app.GameState.Deck, "RIVAL DEL NEXUS", 0, 0);
            SetStatus("ELIGE TU RIVAL");
        }

        private async Task ResumePendingAsync(string existingKey)
        {
            await BeginBattleAsync(selectedOpponentId, selectedOpponentName, existingKey);
        }

        private async Task BeginBattleAsync(string opponentId, string opponentName, string existingKey)
        {
            if (busy && string.IsNullOrWhiteSpace(existingKey)) return;
            if (app == null || app.Session == null || !app.Session.IsAuthenticated || canonicalBattle == null || !canonicalBattle.IsInitialized) return;
            busy = true;
            ClearList();
            SetStatus("SELLANDO " + opponentName.ToUpperInvariant() + " · ESPERANDO AUTORIDAD DEL SERVIDOR");
            pendingOperation = "pvp_" + opponentId;
            var key = string.IsNullOrWhiteSpace(existingKey)
                ? journal.GetOrCreate(app.GameState.PlayerId, pendingOperation, opponentId)
                : existingKey;
            try
            {
                var result = await app.Repository.ResolveBattleAsync(app.GameState.PlayerId, opponentId, key);
                if (result == null)
                {
                    SetStatus("RESULTADO NO REPORTADO · CLAVE PRESERVADA · REINTENTA SIN DUPLICAR");
                    busy = false;
                    return;
                }
                if (!result.ok)
                {
                    journal.Clear(app.GameState.PlayerId, pendingOperation);
                    pendingOperation = null;
                    busy = false;
                    SetStatus(string.IsNullOrWhiteSpace(result.error) ? "BATALLA RECHAZADA POR EL SERVIDOR" : result.error);
                    return;
                }
                pendingResult = result;
                completionReported = false;
                canonicalBattle.SetLocalPlayerId(app.GameState.PlayerId);
                HideGateOnly();
                canonicalBattle.Play(result.events ?? new BattleEvent[0]);
            }
            catch (Exception ex)
            {
                SetStatus("BATALLA INTERRUMPIDA · CLAVE PRESERVADA PARA REINTENTO SEGURO");
                Debug.LogWarning("VEXFORGE Tier1 battle: " + ex.Message);
                busy = false;
            }
        }

        private void HideGateOnly()
        {
            if (canvas != null) canvas.gameObject.SetActive(false);
            shown = false;
        }

        private async void HandlePresentationCompleted()
        {
            if (pendingResult == null || completionReported) return;
            completionReported = true;
            var result = pendingResult;
            pendingResult = null;
            try { if (app != null) await app.GameState.RefreshAsync(); }
            catch (Exception ex) { Debug.LogWarning("VEXFORGE post-battle refresh: " + ex.Message); }
            if (!string.IsNullOrWhiteSpace(pendingOperation) && app != null && app.GameState != null)
                journal.Clear(app.GameState.PlayerId, pendingOperation);
            pendingOperation = null;
            busy = false;
            // Show the result while still on the Battle route; subscribers such as the tutorial
            // may navigate synchronously, in which case the result HUD's route guard will hide it.
            if (resultHud != null && app != null && app.Navigation != null && app.Navigation.CurrentRoute == GameRoute.Battle)
                resultHud.Show(result);
            BattleCompleted?.Invoke(result);
        }

        private void SetStatus(string value) { if (status != null) status.text = value ?? string.Empty; }
        private void ClearList() { if (list == null) return; for (var i = list.childCount - 1; i >= 0; i--) Destroy(list.GetChild(i).gameObject); }
        private void HideConfirmActions()
        {
            if (confirmButton != null) confirmButton.gameObject.SetActive(false);
            if (changeOpponentButton != null) changeOpponentButton.gameObject.SetActive(false);
        }
        private void OnDestroy() { UnsubscribeCompletion(); }
    }
}
