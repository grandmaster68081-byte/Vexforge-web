using System.Globalization;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1PackRevealView : MonoBehaviour
    {
        private VexforgeTier1AssetRegistry assets;
        private Canvas canvas;
        private Image background;
        private Sprite vaultSprite;
        private RectTransform content;
        private RectTransform relicRect;
        private RawImage relic;
        private RawImage cardArt;
        private Text status;
        private Text detail;
        private Button closeButton;
        private bool animating;
        private float clock;

        public void Initialize(VexforgeTier1AssetRegistry registry, UnityEngine.Events.UnityAction onClose)
        {
            if (canvas != null) return;
            assets = registry;
            Build(onClose);
        }

        public void Show()
        {
            if (canvas != null) canvas.gameObject.SetActive(true);
        }

        public void Hide()
        {
            animating = false;
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        public void SetCloseEnabled(bool enabled)
        {
            if (closeButton != null) closeButton.interactable = enabled;
        }

        public void ShowLoading(string message)
        {
            animating = false;
            ClearContent();
            relic.gameObject.SetActive(false);
            cardArt.gameObject.SetActive(false);
            detail.gameObject.SetActive(false);
            SetStatus(message);
        }

        public void ShowCatalog(
            PackRecord[] packs,
            PackOrderRecord[] pendingOrders,
            int packPage,
            int pendingOrderIndex,
            string pendingOrderId,
            string message,
            System.Action<PackRecord> onPurchase,
            System.Action<string> onOpenPending,
            UnityEngine.Events.UnityAction onRetry,
            System.Action<int> onChangePackPage,
            System.Action<int> onChangePendingOrder)
        {
            animating = false;
            ClearContent();
            relic.gameObject.SetActive(false);
            cardArt.gameObject.SetActive(false);
            detail.gameObject.SetActive(false);
            SetStatus(message);

            packs = packs ?? new PackRecord[0];
            pendingOrders = pendingOrders ?? new PackOrderRecord[0];
            if (!string.IsNullOrWhiteSpace(pendingOrderId))
            {
                AddButton(
                    "RetryPending",
                    "REINTENTAR APERTURA PENDIENTE",
                    onRetry,
                    .08f,
                    .77f,
                    .92f,
                    .85f,
                    13,
                    new Color(.16f, .10f, .045f, .96f));
            }
            else if (pendingOrders.Length > 0)
            {
                var index = Mathf.Clamp(pendingOrderIndex, 0, pendingOrders.Length - 1);
                var selected = pendingOrders[index];
                AddButton(
                    "OpenPending",
                    "ABRIR ORDEN PENDIENTE · " + Safe(selected.pack_key, "PACK"),
                    () => onOpenPending(selected.id),
                    .08f,
                    .77f,
                    .92f,
                    .85f,
                    12,
                    new Color(.16f, .10f, .045f, .96f));

                if (pendingOrders.Length > 1)
                {
                    AddButton(
                        "PreviousPending",
                        "‹",
                        () => onChangePendingOrder(-1),
                        .08f,
                        .77f,
                        .20f,
                        .85f,
                        16,
                        new Color(.055f, .050f, .046f, .96f));
                    AddButton(
                        "NextPending",
                        "›",
                        () => onChangePendingOrder(1),
                        .80f,
                        .77f,
                        .92f,
                        .85f,
                        16,
                        new Color(.055f, .050f, .046f, .96f));
                    AddLabel(
                        "PendingPage",
                        (index + 1) + " / " + pendingOrders.Length,
                        .21f,
                        .77f,
                        .79f,
                        .85f,
                        11,
                        VexforgeTier1Ui.Muted,
                        TextAnchor.MiddleCenter);
                }
            }

            var start = Mathf.Clamp(packPage * 3, 0, Mathf.Max(0, packs.Length - 1));
            var count = Mathf.Min(3, Mathf.Max(0, packs.Length - start));
            for (var i = 0; i < count; i++)
            {
                var pack = packs[start + i];
                var top = .70f - i * .19f;
                var label = Safe(pack.pack_name, Safe(pack.pack_key, "PACK")) +
                            "\n" + pack.card_count + " CARTAS  ·  " +
                            pack.price_vex.ToString("0.##", CultureInfo.InvariantCulture) + " VEX";
                AddButton(
                    "BuyPack_" + i,
                    label,
                    () => onPurchase(pack),
                    .08f,
                    top - .15f,
                    .92f,
                    top,
                    12,
                    new Color(.055f, .050f, .046f, .96f));
            }

            if (packs.Length == 0)
            {
                AddLabel(
                    "EmptyCatalog",
                    "NO HAY PAQUETES ACTIVOS REPORTADOS.",
                    .10f,
                    .42f,
                    .90f,
                    .56f,
                    14,
                    VexforgeTier1Ui.Muted,
                    TextAnchor.MiddleCenter);
            }

            if (packs.Length > 3)
            {
                var pageCount = (packs.Length + 2) / 3;
                AddButton(
                    "PreviousPackPage",
                    "‹",
                    () => onChangePackPage(-1),
                    .08f,
                    .025f,
                    .22f,
                    .09f,
                    16,
                    new Color(.055f, .050f, .046f, .96f));
                AddLabel(
                    "PackPage",
                    (packPage + 1) + " / " + pageCount,
                    .35f,
                    .025f,
                    .65f,
                    .09f,
                    11,
                    VexforgeTier1Ui.Muted,
                    TextAnchor.MiddleCenter);
                AddButton(
                    "NextPackPage",
                    "›",
                    () => onChangePackPage(1),
                    .78f,
                    .025f,
                    .92f,
                    .09f,
                    16,
                    new Color(.055f, .050f, .046f, .96f));
            }
        }

        public void ShowOpening(string message)
        {
            animating = true;
            clock = 0f;
            ClearContent();
            relic.gameObject.SetActive(true);
            cardArt.gameObject.SetActive(false);
            detail.gameObject.SetActive(true);
            detail.text = "EL CONTENIDO SE MOSTRARÁ DESPUÉS DE CONFIRMAR LA APERTURA.";
            SetStatus(message);
        }

        public void SetOpeningStatus(string message)
        {
            SetStatus(message);
        }

        public void ShowCard(
            OpenedCard card,
            int index,
            int count,
            Texture texture,
            string warning,
            UnityEngine.Events.UnityAction onNext)
        {
            animating = false;
            ClearContent();
            relic.gameObject.SetActive(false);
            cardArt.texture = texture == null && assets != null
                ? assets.LoadTexture("VF_CARD_BACK_CORE")
                : texture;
            cardArt.gameObject.SetActive(cardArt.texture != null);
            detail.gameObject.SetActive(true);
            detail.text = Safe(card == null ? null : card.name, "CARTA RECIBIDA").ToUpperInvariant() +
                          "\n" + Safe(card == null ? null : card.rarity, "RAREZA NO REPORTADA").ToUpperInvariant() +
                          "\n" + Safe(card == null ? null : card.faction, "FACCIÓN NO REPORTADA").ToUpperInvariant();
            VexforgeTier1Ui.Anchor(detail.rectTransform, .08f, .22f, .92f, .36f);
            SetStatus("CARTA " + (index + 1) + " / " + count + " · TOCA PARA CONTINUAR");

            if (!string.IsNullOrWhiteSpace(warning))
                AddLabel(
                    "SyncWarning",
                    warning,
                    .08f,
                    .17f,
                    .92f,
                    .21f,
                    10,
                    VexforgeTier1Ui.GoldSoft,
                    TextAnchor.MiddleCenter);
            AddButton(
                "RevealNext",
                index + 1 < count ? "REVELAR SIGUIENTE" : "FINALIZAR",
                onNext,
                .08f,
                .055f,
                .92f,
                .12f,
                13,
                new Color(.16f, .10f, .045f, .96f));
        }

        public void SetCardTexture(Texture texture)
        {
            if (cardArt == null || !cardArt.gameObject.activeSelf || texture == null) return;
            cardArt.texture = texture;
        }

        public void ShowComplete(string message, string warning, UnityEngine.Events.UnityAction onClose)
        {
            animating = false;
            ClearContent();
            relic.gameObject.SetActive(false);
            cardArt.gameObject.SetActive(false);
            detail.gameObject.SetActive(true);
            detail.text = message;
            SetStatus(warning);
            AddButton(
                "Finish",
                "CERRAR",
                onClose,
                .08f,
                .055f,
                .92f,
                .12f,
                13,
                new Color(.16f, .10f, .045f, .96f));
        }

        private void Build(UnityEngine.Events.UnityAction onClose)
        {
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1PackReveal", 84, 3.4f);
            var veil = VexforgeTier1Ui.Panel(
                canvas.transform,
                "Veil",
                new Color(.002f, .002f, .006f, .82f));
            VexforgeTier1Ui.Full(veil.rectTransform);

            background = VexforgeTier1Ui.Panel(
                canvas.transform,
                "Vault",
                new Color(.006f, .008f, .013f, 1f));
            VexforgeTier1Ui.Anchor(background.rectTransform, .04f, .07f, .96f, .93f);

            var hero = assets == null
                ? null
                : assets.LoadTexture("VF_PACK_VAULT_HERO", "VF_NEXUS_CITADEL_HERO");
            if (hero != null)
            {
                background.color = Color.white;
                vaultSprite = Sprite.Create(
                    hero,
                    new Rect(0, 0, hero.width, hero.height),
                    new Vector2(.5f, .5f),
                    100f);
                background.sprite = vaultSprite;
                background.preserveAspect = false;
            }

            var shade = VexforgeTier1Ui.Panel(
                background.transform,
                "Shade",
                new Color(.002f, .003f, .007f, .68f));
            VexforgeTier1Ui.Full(shade.rectTransform);

            var title = VexforgeTier1Ui.Label(
                background.transform,
                "Title",
                "PACK VAULT",
                28,
                VexforgeTier1Ui.Gold,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform, .06f, .88f, .78f, .97f);

            closeButton = VexforgeTier1Ui.Button(
                background.transform,
                "Close",
                "CERRAR",
                onClose,
                new Color(.055f, .050f, .046f, .96f),
                11);
            VexforgeTier1Ui.Anchor(closeButton.GetComponent<RectTransform>(), .80f, .89f, .96f, .96f);

            status = VexforgeTier1Ui.Label(
                background.transform,
                "Status",
                string.Empty,
                12,
                VexforgeTier1Ui.Muted,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(status.rectTransform, .08f, .115f, .92f, .17f);

            content = new GameObject("PackContent", typeof(RectTransform)).GetComponent<RectTransform>();
            content.SetParent(background.transform, false);
            VexforgeTier1Ui.Full(content);

            var relicObject = new GameObject("Relic", typeof(RectTransform), typeof(RawImage));
            relicObject.transform.SetParent(background.transform, false);
            relicRect = relicObject.GetComponent<RectTransform>();
            VexforgeTier1Ui.Anchor(relicRect, .22f, .32f, .78f, .74f);
            relic = relicObject.GetComponent<RawImage>();
            relic.texture = assets == null ? null : assets.LoadTexture("VF_PACK_RELIC");
            relic.color = Color.white;
            relic.raycastTarget = false;
            relicObject.SetActive(false);

            var cardObject = new GameObject("OpenedCardArt", typeof(RectTransform), typeof(RawImage));
            cardObject.transform.SetParent(background.transform, false);
            var cardRect = cardObject.GetComponent<RectTransform>();
            VexforgeTier1Ui.Anchor(cardRect, .20f, .38f, .80f, .76f);
            cardArt = cardObject.GetComponent<RawImage>();
            cardArt.color = Color.white;
            cardArt.raycastTarget = false;
            cardObject.SetActive(false);

            detail = VexforgeTier1Ui.Label(
                background.transform,
                "CardDetails",
                string.Empty,
                14,
                VexforgeTier1Ui.Text,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(detail.rectTransform, .08f, .19f, .92f, .36f);
            detail.gameObject.SetActive(false);
            canvas.gameObject.SetActive(false);
        }

        private void AddButton(
            string name,
            string label,
            UnityEngine.Events.UnityAction action,
            float x1,
            float y1,
            float x2,
            float y2,
            int size,
            Color fill)
        {
            var button = VexforgeTier1Ui.Button(content, name, label, action, fill, size);
            VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), x1, y1, x2, y2);
        }

        private void AddLabel(
            string name,
            string value,
            float x1,
            float y1,
            float x2,
            float y2,
            int size,
            Color color,
            TextAnchor alignment)
        {
            var label = VexforgeTier1Ui.Label(content, name, value, size, color, alignment);
            VexforgeTier1Ui.Anchor(label.rectTransform, x1, y1, x2, y2);
        }

        private void ClearContent()
        {
            if (content == null) return;
            for (var i = content.childCount - 1; i >= 0; i--)
                Destroy(content.GetChild(i).gameObject);
        }

        private void SetStatus(string value)
        {
            if (status != null) status.text = value ?? string.Empty;
        }

        private static string Safe(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private void Update()
        {
            if (!animating || canvas == null || !canvas.gameObject.activeSelf || relicRect == null)
                return;
            clock += Time.unscaledDeltaTime;
            relicRect.localEulerAngles = new Vector3(0f, 0f, Mathf.Sin(clock * 1.4f) * 3.2f);
            var scale = 1f + Mathf.Sin(clock * 2.4f) * .035f;
            relicRect.localScale = Vector3.one * scale;
        }

        private void OnDestroy()
        {
            if (vaultSprite != null) Destroy(vaultSprite);
        }
    }
}
