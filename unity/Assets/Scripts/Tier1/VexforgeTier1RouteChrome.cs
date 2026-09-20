using System;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;
using Vexforge.UI;

namespace Vexforge.Tier1
{
    /// <summary>Minimal contextual controls for routes whose legacy Alpha HUD is suppressed.</summary>
    public sealed class VexforgeTier1RouteChrome : MonoBehaviour
    {
        private VexforgeApp app;
        private Canvas canvas;
        private Text status;
        private bool initialized;
        private GameRoute route;
        private int requestVersion;
        private bool requestInFlight;

        public void Initialize(VexforgeApp host)
        {
            if (initialized) return;
            initialized = true;
            app = host;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1RouteChrome", 54, 4.3f);
            Render(GameRoute.Nexus);
        }

        public void Render(GameRoute nextRoute)
        {
            if (!initialized) return;
            route = nextRoute;
            Clear();
            var show = route == GameRoute.Collection || route == GameRoute.Deck || route == GameRoute.Profile;
            canvas.gameObject.SetActive(show);
            if (!show) return;
            var panel = VexforgeTier1Ui.Panel(canvas.transform, "RuneBar", new Color(.008f,.010f,.014f,.72f));
            VexforgeTier1Ui.Anchor(panel.rectTransform, .055f,.035f,.945f,.12f);
            var back = VexforgeTier1Ui.Button(panel.transform, "Nexus", "NEXUS", () => app.Navigation.Navigate(GameRoute.Nexus), new Color(.045f,.043f,.039f,.94f), 12);
            VexforgeTier1Ui.Anchor(back.GetComponent<RectTransform>(), .03f,.18f,.22f,.82f);
            var label = VexforgeTier1Ui.Label(panel.transform, "Route", route == GameRoute.Collection ? "ARCHIVE" : route == GameRoute.Deck ? "FORGE" : "HALL", 13, VexforgeTier1Ui.Gold, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(label.rectTransform, .24f,.18f,.58f,.82f);
            if (route == GameRoute.Deck)
            {
                var validate = VexforgeTier1Ui.Button(panel.transform, "Validate", "VALIDAR", ValidateDeck, new Color(.045f,.052f,.060f,.95f), 12);
                VexforgeTier1Ui.Anchor(validate.GetComponent<RectTransform>(), .60f,.18f,.78f,.82f);
                var save = VexforgeTier1Ui.Button(panel.transform, "Save", "SELLAR", SaveDeck, new Color(.075f,.055f,.040f,.95f), 12);
                VexforgeTier1Ui.Anchor(save.GetComponent<RectTransform>(), .80f,.18f,.97f,.82f);
            }
            if (route == GameRoute.Profile)
            {
                var social = VexforgeTier1Ui.Button(panel.transform, "Social", "ALIADOS", OpenSocial, new Color(.045f,.052f,.060f,.95f), 12);
                VexforgeTier1Ui.Anchor(social.GetComponent<RectTransform>(), .68f,.18f,.97f,.82f);
            }
            status = VexforgeTier1Ui.Label(canvas.transform, "Status", string.Empty, 11, VexforgeTier1Ui.Muted, TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(status.rectTransform, .10f,.13f,.90f,.16f);
        }

        private void Clear()
        {
            for (var i = canvas.transform.childCount - 1; i >= 0; i--) Destroy(canvas.transform.GetChild(i).gameObject);
            status = null;
        }

        private async void ValidateDeck()
        {
            if (requestInFlight || app == null) return;
            requestInFlight = true;
            var version = ++requestVersion;
            try
            {
                var result = await app.Repository.ValidateDeckAsync(ResolveIds());
                if (version != requestVersion || route != GameRoute.Deck) return;
                SetStatus(result == null ? "VALIDACIÓN NO REPORTADA" : result.valid ? "DECK VALIDADO POR SUPABASE" : string.Join("\n", result.errors ?? new string[0]));
            }
            catch (Exception ex) { SetStatus("VALIDACIÓN INTERRUMPIDA · " + ex.GetType().Name); }
            finally { requestInFlight = false; }
        }

        private async void SaveDeck()
        {
            if (requestInFlight || app == null) return;
            requestInFlight = true;
            var version = ++requestVersion;
            try
            {
                var result = await app.Repository.SaveDeckAsync(ResolveIds());
                if (version != requestVersion || route != GameRoute.Deck) return;
                SetStatus(result == null ? "SELLADO NO REPORTADO" : result.ok ? "DECK SELLADO" : (result.reason ?? "OPERACIÓN NO CONFIRMADA"));
                await app.GameState.RefreshAsync();
            }
            catch (Exception ex) { SetStatus("SELLADO INTERRUMPIDO · " + ex.GetType().Name); }
            finally { requestInFlight = false; }
        }

        private string[] ResolveIds()
        {
            var slots = app.GameState.Deck;
            if (slots == null) return new string[0];
            var ids = new string[slots.Length];
            for (var i = 0; i < slots.Length; i++) ids[i] = slots[i] == null ? string.Empty : slots[i].card_id;
            return ids;
        }

        private void OpenSocial()
        {
            var go = GameObject.Find("VexforgeCanvas");
            var hub = go == null ? null : go.GetComponent<VexforgeSocialHub>();
            if (hub != null) hub.OpenFriends(); else SetStatus("HALL DE ALIADOS NO DISPONIBLE EN LA SESIÓN ACTUAL");
        }
        private void SetStatus(string value) { if (status != null) status.text = value ?? string.Empty; }
    }
}
