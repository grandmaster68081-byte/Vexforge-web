using System;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1BattleResultHud : MonoBehaviour
    {
        private VexforgeApp app;
        private Canvas canvas;
        private Image veil;
        private GameObject resultPlaque;
        private GameObject playbackPanel;
        private Text title;
        private Text body;
        private Button close;
        private Button replay;
        private Button skip;
        private Text playbackLabel;
        private BattleResult currentResult;
        private bool initialized;

        public event Action<BattleResult> ReplayRequested;
        public event Action SkipRequested;

        public void Initialize(VexforgeApp host)
        {
            if (initialized) return;
            initialized = true;
            app = host;
            if (app != null && app.Navigation != null) app.Navigation.RouteChanged += HandleRouteChanged;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1BattleResult", 76, 4.1f);
            veil = VexforgeTier1Ui.Panel(canvas.transform, "Veil", new Color(0.003f, 0.004f, 0.007f, 0.78f));
            VexforgeTier1Ui.Full(veil.rectTransform);
            var plaque = VexforgeTier1Ui.Panel(canvas.transform, "ResultPlaque", VexforgeTier1Ui.BlackGlass);
            resultPlaque = plaque.gameObject;
            VexforgeTier1Ui.Anchor(plaque.rectTransform, .09f, .32f, .91f, .70f);
            var outline = plaque.gameObject.AddComponent<Outline>();
            outline.effectColor = new Color(VexforgeTier1Ui.Gold.r, VexforgeTier1Ui.Gold.g, VexforgeTier1Ui.Gold.b, .33f);
            outline.effectDistance = new Vector2(2f, 2f);
            title = VexforgeTier1Ui.Label(plaque.transform, "Title", "RESULTADO", 34, VexforgeTier1Ui.Gold, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform, .06f, .72f, .94f, .92f);
            body = VexforgeTier1Ui.Label(plaque.transform, "Body", string.Empty, 17, VexforgeTier1Ui.Text, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(body.rectTransform, .08f, .30f, .92f, .70f);
            replay = VexforgeTier1Ui.Button(plaque.transform, "Replay", "VER OTRA VEZ", ReplayBattle, new Color(.045f,.070f,.085f,.96f), 15);
            VexforgeTier1Ui.Anchor(replay.GetComponent<RectTransform>(), .08f, .08f, .48f, .22f);
            close = VexforgeTier1Ui.Button(plaque.transform, "Close", "VOLVER AL NEXUS", CloseResult, new Color(.07f,.065f,.055f,.96f), 15);
            VexforgeTier1Ui.Anchor(close.GetComponent<RectTransform>(), .52f, .08f, .92f, .22f);
            var playback = VexforgeTier1Ui.Panel(canvas.transform, "PlaybackPanel", new Color(.004f,.008f,.012f,.88f));
            playbackPanel = playback.gameObject;
            VexforgeTier1Ui.Anchor(playback.rectTransform, .55f, .88f, .98f, .97f);
            playbackLabel = VexforgeTier1Ui.Label(playback.transform, "PlaybackPosition", "BATALLA · 0/0", 12, VexforgeTier1Ui.Text, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(playbackLabel.rectTransform, .02f, .04f, .57f, .96f);
            skip = VexforgeTier1Ui.Button(playback.transform, "Skip", "OMITIR", SkipPresentation, new Color(.07f,.065f,.055f,.96f), 12);
            VexforgeTier1Ui.Anchor(skip.GetComponent<RectTransform>(), .60f, .08f, .98f, .92f);
            Hide();
        }

        public void Show(BattleResult result)
        {
            if (!initialized) return;
            currentResult = result;
            var win = result != null && result.you_won;
            title.text = win ? "VICTORIA" : "DERROTA";
            body.text = result == null
                ? "NO SE PUDO MOSTRAR EL RESULTADO."
                : (result.total_turns > 0 ? result.total_turns + " RONDAS" : "BATALLA TERMINADA");
            replay.gameObject.SetActive(result != null && result.events != null && result.events.Length > 0);
            resultPlaque.SetActive(true);
            playbackPanel.SetActive(false);
            veil.color = new Color(0.003f, 0.004f, 0.007f, 0.78f);
            canvas.gameObject.SetActive(true);
        }

        public void ShowPlayback(int eventCount)
        {
            if (!initialized) return;
            currentResult = null;
            resultPlaque.SetActive(false);
            playbackPanel.SetActive(true);
            veil.color = new Color(0.003f, 0.004f, 0.007f, 0.08f);
            UpdatePlaybackPosition(0, eventCount, false);
            canvas.gameObject.SetActive(true);
        }

        public void UpdatePlaybackPosition(int currentIndex, int total, bool canSkip)
        {
            if (playbackLabel == null) return;
            var displayedIndex = total <= 0 ? 0 : Mathf.Clamp(currentIndex + 1, 1, total);
            playbackLabel.text = "BATALLA · " + displayedIndex + "/" + Mathf.Max(0, total);
            if (skip != null) skip.interactable = canSkip;
        }

        public void Hide()
        {
            currentResult = null;
            if (resultPlaque != null) resultPlaque.SetActive(false);
            if (playbackPanel != null) playbackPanel.SetActive(false);
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        private void HandleRouteChanged(GameRoute route) { if (route != GameRoute.Battle) Hide(); }
        private void CloseResult() { Hide(); if (app != null) app.Navigation.Navigate(GameRoute.Nexus); }
        private void ReplayBattle()
        {
            if (currentResult != null)
                ReplayRequested?.Invoke(currentResult);
        }
        private void SkipPresentation() { SkipRequested?.Invoke(); }
        private void OnDestroy() { if (app != null && app.Navigation != null) app.Navigation.RouteChanged -= HandleRouteChanged; }
    }
}
