using System;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;

namespace Vexforge.UI
{
    public static class CardRenderer
    {
        public static GameObject CreateCard(
            Transform parent,
            CardRecord card,
            PlayerCardRecord ownership = null,
            bool selected = false,
            bool active = false,
            bool locked = false)
        {
            var root = UiFactory.PanelObject(parent, "Card_" + SafeName(card == null ? "unreported" : card.id),
                selected ? UiFactory.CardSelected : UiFactory.Card);
            var rect = root.GetComponent<RectTransform>();
            var outline = root.AddComponent<Outline>();
            outline.effectColor = active ? UiFactory.Arcane : UiFactory.GoldDim;
            outline.effectDistance = new Vector2(active ? 3f : 1f, active ? 3f : 1f);

            var art = UiFactory.PanelObject(root.transform, "Art", card == null ? UiFactory.CardArtUnknown : RarityColor(card.rarity));
            UiFactory.Anchor(art.GetComponent<RectTransform>(), new Vector2(0.08f, 0.48f), new Vector2(0.92f, 0.94f), Vector2.zero, Vector2.zero);
            var artLabel = UiFactory.Label(art.transform, HasValue(card == null ? null : card.image_url) ? "ARTE DISPONIBLE" : "ARTE NO REPORTADO", 12,
                UiFactory.Text, TextAnchor.MiddleCenter);
            UiFactory.Stretch(artLabel.rectTransform, 4f, 4f, 4f, 4f);

            var name = UiFactory.Label(root.transform, ValueOr(card == null ? null : card.name, "NOMBRE NO REPORTADO"), 17, UiFactory.Text);
            UiFactory.Anchor(name.rectTransform, new Vector2(0.08f, 0.36f), new Vector2(0.92f, 0.47f), Vector2.zero, Vector2.zero);
            var identity = UiFactory.Label(root.transform,
                ValueOr(card == null ? null : card.faction, "FACCION NO REPORTADA") + "  ·  " +
                ValueOr(card == null ? null : card.rarity, "RAREZA NO REPORTADA"), 11, UiFactory.Gold);
            UiFactory.Anchor(identity.rectTransform, new Vector2(0.08f, 0.27f), new Vector2(0.92f, 0.36f), Vector2.zero, Vector2.zero);
            var stats = UiFactory.Label(root.transform, StatsText(card), 11, UiFactory.Muted);
            UiFactory.Anchor(stats.rectTransform, new Vector2(0.08f, 0.11f), new Vector2(0.92f, 0.27f), Vector2.zero, Vector2.zero);

            var state = UiFactory.Label(root.transform, StateText(ownership, selected, active, locked), 10,
                locked ? UiFactory.Crimson : UiFactory.Arcane, TextAnchor.MiddleCenter);
            UiFactory.Anchor(state.rectTransform, new Vector2(0.08f, 0.02f), new Vector2(0.92f, 0.1f), Vector2.zero, Vector2.zero);
            return root;
        }

        public static string ValueOr(string value, string fallback)
        {
            return HasValue(value) ? value : fallback;
        }

        private static string StatsText(CardRecord card)
        {
            if (card == null) return "ESTADISTICAS NO REPORTADAS";
            return "PODER " + card.power + "  ·  AFINIDAD " + card.affinity +
                "\nPRESTIGIO " + card.prestige + "  ·  CARGA " + card.charge;
        }

        private static string StateText(PlayerCardRecord ownership, bool selected, bool active, bool locked)
        {
            if (locked || (ownership != null && ownership.locked)) return "BLOQUEADA";
            if (active) return "ACTIVA EN BATALLA";
            if (selected) return "SELECCIONADA";
            if (ownership == null) return "CATALOGO";
            return "POSESION " + ownership.quantity;
        }

        private static Color RarityColor(string rarity)
        {
            if (!HasValue(rarity)) return UiFactory.CardArtUnknown;
            var normalized = rarity.ToLowerInvariant();
            if (normalized.Contains("myth")) return new Color(0.28f, 0.08f, 0.32f, 1f);
            if (normalized.Contains("legend")) return new Color(0.38f, 0.22f, 0.06f, 1f);
            if (normalized.Contains("epic")) return new Color(0.2f, 0.09f, 0.28f, 1f);
            if (normalized.Contains("rare")) return new Color(0.07f, 0.18f, 0.24f, 1f);
            return new Color(0.12f, 0.1f, 0.09f, 1f);
        }

        private static bool HasValue(string value)
        {
            return !string.IsNullOrWhiteSpace(value);
        }

        private static string SafeName(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "unknown";
            return value.Replace("/", "_").Replace(" ", "_");
        }
    }
}