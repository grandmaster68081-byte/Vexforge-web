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
        private Text title;
        private Text body;
        private Button close;
        private bool initialized;

        public void Initialize(VexforgeApp host)
        {
            if (initialized) return;
            initialized = true;
            app = host;
            if (app != null && app.Navigation != null) app.Navigation.RouteChanged += HandleRouteChanged;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1BattleResult", 76, 4.1f);
            var veil = VexforgeTier1Ui.Panel(canvas.transform, "Veil", new Color(0.003f, 0.004f, 0.007f, 0.78f));
            VexforgeTier1Ui.Full(veil.rectTransform);
            var plaque = VexforgeTier1Ui.Panel(canvas.transform, "ResultPlaque", VexforgeTier1Ui.BlackGlass);
            VexforgeTier1Ui.Anchor(plaque.rectTransform, .09f, .32f, .91f, .70f);
            var outline = plaque.gameObject.AddComponent<Outline>();
            outline.effectColor = new Color(VexforgeTier1Ui.Gold.r, VexforgeTier1Ui.Gold.g, VexforgeTier1Ui.Gold.b, .33f);
            outline.effectDistance = new Vector2(2f, 2f);
            title = VexforgeTier1Ui.Label(plaque.transform, "Title", "RESULTADO", 34, VexforgeTier1Ui.Gold, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform, .06f, .72f, .94f, .92f);
            body = VexforgeTier1Ui.Label(plaque.transform, "Body", string.Empty, 17, VexforgeTier1Ui.Text, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(body.rectTransform, .08f, .30f, .92f, .70f);
            close = VexforgeTier1Ui.Button(plaque.transform, "Close", "VOLVER AL NEXUS", CloseResult, new Color(.07f,.065f,.055f,.96f), 15);
            VexforgeTier1Ui.Anchor(close.GetComponent<RectTransform>(), .20f, .08f, .80f, .22f);
            Hide();
        }

        public void Show(BattleResult result)
        {
            if (!initialized) return;
            var win = result != null && result.you_won;
            title.text = win ? "VICTORIA" : "DERROTA";
            body.text = result == null
                ? "EL SERVIDOR NO REPORTÓ UN RESULTADO VÁLIDO."
                : ((result.total_turns > 0 ? result.total_turns + " RONDAS" : "PARTIDA CONFIRMADA") +
                   "\n\n" + (string.IsNullOrWhiteSpace(result.match_id) ? "ID DE PARTIDA NO REPORTADO" : result.match_id));
            canvas.gameObject.SetActive(true);
        }

        public void Hide() { if (canvas != null) canvas.gameObject.SetActive(false); }
        private void HandleRouteChanged(GameRoute route) { if (route != GameRoute.Battle) Hide(); }
        private void CloseResult() { Hide(); if (app != null) app.Navigation.Navigate(GameRoute.Nexus); }
        private void OnDestroy() { if (app != null && app.Navigation != null) app.Navigation.RouteChanged -= HandleRouteChanged; }
    }
}
