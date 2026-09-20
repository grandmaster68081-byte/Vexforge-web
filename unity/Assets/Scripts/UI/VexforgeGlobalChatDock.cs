using UnityEngine;
using UnityEngine.UI;

namespace Vexforge.UI
{
    /// <summary>
    /// Compact world communication control. It is deliberately small so chat never becomes a dashboard.
    /// </summary>
    public sealed class VexforgeGlobalChatDock : MonoBehaviour
    {
        private VexforgeSocialHub socialHub;
        private Canvas canvas;
        private GameObject buttonObject;

        public void Initialize(Canvas targetCanvas, VexforgeSocialHub hub)
        {
            canvas = targetCanvas;
            socialHub = hub;
            Build();
        }

        private void Build()
        {
            if (buttonObject != null || canvas == null) return;
            buttonObject = UiFactory.Button(canvas.transform, "WORLD CHAT", Open);
            UiFactory.Anchor(buttonObject.GetComponent<RectTransform>(), new Vector2(0.68f, 0.035f), new Vector2(0.96f, 0.09f), Vector2.zero, Vector2.zero);
        }

        private void Open()
        {
            if (socialHub != null) socialHub.OpenGlobal();
        }

        public void SetVisible(bool visible)
        {
            if (buttonObject != null) buttonObject.SetActive(visible);
        }

        private void OnDestroy()
        {
            buttonObject = null;
            socialHub = null;
            canvas = null;
        }
    }
}
