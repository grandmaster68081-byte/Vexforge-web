using UnityEngine;
using UnityEngine.UI;

namespace Vexforge.UI
{
    public static class UiFactory
    {
        public static readonly Color Background = new Color(0.025f, 0.017f, 0.016f, 1f);
        public static readonly Color Panel = new Color(0.09f, 0.06f, 0.055f, 0.97f);
        public static readonly Color PanelLight = new Color(0.16f, 0.105f, 0.08f, 0.98f);
        public static readonly Color PanelGlass = new Color(0.035f, 0.027f, 0.025f, 0.88f);
        public static readonly Color Card = new Color(0.075f, 0.055f, 0.05f, 0.98f);
        public static readonly Color CardSelected = new Color(0.14f, 0.085f, 0.045f, 0.99f);
        public static readonly Color CardArtUnknown = new Color(0.035f, 0.04f, 0.05f, 1f);
        public static readonly Color Gold = new Color(0.79f, 0.57f, 0.14f, 1f);
        public static readonly Color GoldDim = new Color(0.36f, 0.25f, 0.09f, 1f);
        public static readonly Color Crimson = new Color(0.42f, 0.055f, 0.07f, 1f);
        public static readonly Color Arcane = new Color(0.12f, 0.48f, 0.7f, 1f);
        public static readonly Color Text = new Color(0.9f, 0.84f, 0.72f, 1f);
        public static readonly Color Muted = new Color(0.58f, 0.52f, 0.45f, 1f);

        private static Font font;

        public static Font Font
        {
            get
            {
                if (font == null) font = Resources.GetBuiltinResource<Font>("Arial.ttf");
                return font;
            }
        }

        public static GameObject PanelObject(Transform parent, string name, Color color)
        {
            var objectRoot = new GameObject(name, typeof(RectTransform), typeof(Image));
            objectRoot.transform.SetParent(parent, false);
            objectRoot.GetComponent<Image>().color = color;
            return objectRoot;
        }

        public static Text Label(Transform parent, string text, int size, Color color, TextAnchor anchor = TextAnchor.MiddleLeft)
        {
            var objectRoot = new GameObject("Label", typeof(RectTransform), typeof(Text));
            objectRoot.transform.SetParent(parent, false);
            var label = objectRoot.GetComponent<Text>();
            label.font = Font;
            label.text = text ?? string.Empty;
            label.fontSize = size;
            label.color = color;
            label.alignment = anchor;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            label.verticalOverflow = VerticalWrapMode.Truncate;
            return label;
        }

        public static Button Button(Transform parent, string text, UnityEngine.Events.UnityAction onClick)
        {
            var objectRoot = PanelObject(parent, "Action_" + text, PanelLight);
            var button = objectRoot.AddComponent<Button>();
            var label = Label(objectRoot.transform, text, 18, Text, TextAnchor.MiddleCenter);
            Stretch(label.rectTransform, 12, 6, 12, 6);
            button.onClick.AddListener(onClick);
            return button;
        }

        public static InputField Input(Transform parent, string placeholder, bool password)
        {
            var objectRoot = PanelObject(parent, "Input_" + placeholder, new Color(0.04f, 0.03f, 0.025f, 1f));
            var input = objectRoot.AddComponent<InputField>();
            var value = Label(objectRoot.transform, string.Empty, 18, Text);
            Stretch(value.rectTransform, 14, 4, 14, 4);
            input.textComponent = value;
            input.contentType = password ? InputField.ContentType.Password : InputField.ContentType.Standard;
            var hint = Label(objectRoot.transform, placeholder, 17, Muted);
            Stretch(hint.rectTransform, 14, 4, 14, 4);
            input.placeholder = hint;
            return input;
        }

        public static void Stretch(RectTransform rect, float left, float bottom, float right, float top)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(left, bottom);
            rect.offsetMax = new Vector2(-right, -top);
        }

        public static void Anchor(RectTransform rect, Vector2 min, Vector2 max, Vector2 position, Vector2 size)
        {
            rect.anchorMin = min;
            rect.anchorMax = max;
            rect.anchoredPosition = position;
            rect.sizeDelta = size;
        }
    }
}