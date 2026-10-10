using System;
using System.Globalization;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Session;
using Vexforge.UI;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Native client surface for the existing server-authoritative economy contracts.
    /// This component never computes prices, fees, balances, eligibility, or settlement.
    /// </summary>
    public sealed class VexforgeTier1EconomyHub : MonoBehaviour
    {
        private enum EconomyTab
        {
            Wallet,
            Market,
            Deposit,
            Withdraw
        }

        private VexforgeApp app;
        private VexforgeRepository repository;
        private Canvas canvas;
        private RectTransform modal;
        private RectTransform viewport;
        private RectTransform pageContent;
        private Text statusLabel;
        private RectTransform confirmationShade;
        private Text confirmationText;
        private Button confirmationButton;
        private Action pendingConfirmation;

        private EconomyTab activeTab;
        private InputField priceInput;
        private InputField amountInput;
        private InputField chainInput;
        private InputField tokenInput;
        private InputField transactionHashInput;
        private InputField payerWalletInput;
        private string statusMessage;
        private bool statusIsError;
        private bool open;
        private bool actionInFlight;
        private int lifecycleGeneration;

        private WalletRecord wallet;
        private EconomyStatsRecord economyStats;
        private MarketListingRecord[] listings = new MarketListingRecord[0];
        private PlayerCardRecord[] ownedCards = new PlayerCardRecord[0];
        private TreasuryWalletRecord[] treasuryWallets = new TreasuryWalletRecord[0];
        private EconomyDepositRecord[] deposits = new EconomyDepositRecord[0];
        private WithdrawalRequestRecord[] withdrawals = new WithdrawalRequestRecord[0];

        public void Initialize(VexforgeApp host)
        {
            if (app != null) return;
            app = host;
            repository = app == null ? null : app.Repository;
            if (app == null || repository == null) return;

            Build();
            if (app.Session != null)
                app.Session.StateChanged += HandleSessionChanged;
        }

        public void OpenWallet()
        {
            Open(EconomyTab.Wallet);
        }

        public void Hide()
        {
            lifecycleGeneration++;
            open = false;
            actionInFlight = false;
            pendingConfirmation = null;
            ClearSnapshot();
            if (confirmationShade != null) confirmationShade.gameObject.SetActive(false);
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        private void Open(EconomyTab tab)
        {
            if (app == null || repository == null || app.Session == null || !app.Session.IsAuthenticated)
                return;

            activeTab = tab;
            open = true;
            lifecycleGeneration++;
            statusMessage = "SINCRONIZANDO LA TESORERÍA…";
            statusIsError = false;
            ClearSnapshot();
            if (canvas != null) canvas.gameObject.SetActive(true);
            RenderActiveTab();
            _ = LoadSnapshotAsync(lifecycleGeneration, false);
        }

        private void SwitchTab(EconomyTab tab)
        {
            if (!open) return;
            activeTab = tab;
            lifecycleGeneration++;
            statusMessage = "SINCRONIZANDO LA TESORERÍA…";
            statusIsError = false;
            RenderActiveTab();
            _ = LoadSnapshotAsync(lifecycleGeneration, false);
        }

        private void Build()
        {
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1EconomyHub", 88, 3.2f);
            var shade = VexforgeTier1Ui.Panel(canvas.transform, "EconomyBackdrop", new Color(0f, 0f, 0f, .78f));
            VexforgeTier1Ui.Full(shade.rectTransform);

            var panel = VexforgeTier1Ui.Panel(canvas.transform, "EconomyPanel", VexforgeTier1Ui.BlackGlass);
            modal = panel.rectTransform;
            VexforgeTier1Ui.Anchor(modal, .025f, .025f, .975f, .975f);

            var title = VexforgeTier1Ui.Label(modal, "Title", "BÓVEDA DEL NÚCLEO", 25, VexforgeTier1Ui.Gold, TextAnchor.MiddleLeft);
            VexforgeTier1Ui.Anchor(title.rectTransform, .035f, .925f, .68f, .99f);

            var refresh = VexforgeTier1Ui.Button(modal, "Refresh", "RECARGAR", () => _ = ReloadAsync(), VexforgeTier1Ui.BlackGlass, 11);
            VexforgeTier1Ui.Anchor(refresh.GetComponent<RectTransform>(), .70f, .925f, .84f, .99f);

            var close = VexforgeTier1Ui.Button(modal, "Close", "CERRAR", Hide, VexforgeTier1Ui.BlackGlass, 11);
            VexforgeTier1Ui.Anchor(close.GetComponent<RectTransform>(), .86f, .925f, .97f, .99f);

            var tabs = new[] { EconomyTab.Wallet, EconomyTab.Market, EconomyTab.Deposit, EconomyTab.Withdraw };
            var labels = new[] { "WALLET", "MERCADO", "DEPÓSITOS", "RETIROS" };
            for (var i = 0; i < tabs.Length; i++)
            {
                var tab = tabs[i];
                var x = .035f + i * .235f;
                var button = VexforgeTier1Ui.Button(modal, "Tab_" + labels[i], labels[i], () => SwitchTab(tab), VexforgeTier1Ui.BlackGlass, 10);
                VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), x, .855f, x + .225f, .91f);
            }

            var status = VexforgeTier1Ui.Label(modal, "Status", string.Empty, 11, VexforgeTier1Ui.Muted, TextAnchor.MiddleCenter);
            statusLabel = status;
            VexforgeTier1Ui.Anchor(status.rectTransform, .035f, .105f, .965f, .15f);

            var viewportObject = new GameObject(
                "EconomyViewport",
                typeof(RectTransform),
                typeof(Image),
                typeof(Mask),
                typeof(ScrollRect));
            viewportObject.transform.SetParent(modal, false);
            viewport = viewportObject.GetComponent<RectTransform>();
            VexforgeTier1Ui.Anchor(viewport, .035f, .17f, .965f, .84f);
            viewportObject.GetComponent<Image>().color = new Color(.006f, .008f, .012f, .34f);
            viewportObject.GetComponent<Mask>().showMaskGraphic = true;
            var scroll = viewportObject.GetComponent<ScrollRect>();
            scroll.viewport = viewport;
            scroll.horizontal = false;
            scroll.vertical = true;
            scroll.movementType = ScrollRect.MovementType.Elastic;

            var shadeConfirmation = VexforgeTier1Ui.Panel(canvas.transform, "ConfirmationShade", new Color(0f, 0f, 0f, .82f));
            confirmationShade = shadeConfirmation.rectTransform;
            VexforgeTier1Ui.Full(confirmationShade);
            var confirmationPanel = VexforgeTier1Ui.Panel(confirmationShade, "ConfirmationPanel", VexforgeTier1Ui.BlackGlass);
            VexforgeTier1Ui.Anchor(confirmationPanel.rectTransform, .09f, .34f, .91f, .66f);
            confirmationText = VexforgeTier1Ui.Label(
                confirmationPanel.transform,
                "ConfirmationText",
                string.Empty,
                14,
                VexforgeTier1Ui.Text,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(confirmationText.rectTransform, .06f, .34f, .94f, .95f);

            var cancel = VexforgeTier1Ui.Button(
                confirmationPanel.transform,
                "Cancel",
                "CANCELAR",
                CancelConfirmation,
                new Color(.07f, .06f, .055f, 1f),
                12);
            VexforgeTier1Ui.Anchor(cancel.GetComponent<RectTransform>(), .06f, .06f, .47f, .28f);

            confirmationButton = VexforgeTier1Ui.Button(
                confirmationPanel.transform,
                "Confirm",
                "CONFIRMAR",
                ConfirmPendingAction,
                VexforgeTier1Ui.Crimson,
                12);
            VexforgeTier1Ui.Anchor(confirmationButton.GetComponent<RectTransform>(), .53f, .06f, .94f, .28f);
            confirmationShade.gameObject.SetActive(false);
            canvas.gameObject.SetActive(false);
        }

        private void RenderActiveTab()
        {
            if (!open || viewport == null) return;
            priceInput = null;
            amountInput = null;
            chainInput = null;
            tokenInput = null;
            transactionHashInput = null;
            payerWalletInput = null;

            for (var i = viewport.childCount - 1; i >= 0; i--)
                Destroy(viewport.GetChild(i).gameObject);

            pageContent = new GameObject(
                "EconomyContent",
                typeof(RectTransform),
                typeof(VerticalLayoutGroup),
                typeof(ContentSizeFitter)).GetComponent<RectTransform>();
            pageContent.SetParent(viewport, false);
            pageContent.anchorMin = new Vector2(0f, 1f);
            pageContent.anchorMax = new Vector2(1f, 1f);
            pageContent.pivot = new Vector2(.5f, 1f);
            pageContent.anchoredPosition = Vector2.zero;
            pageContent.sizeDelta = Vector2.zero;

            var layout = pageContent.GetComponent<VerticalLayoutGroup>();
            layout.spacing = 6f;
            layout.padding = new RectOffset(8, 8, 8, 8);
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            pageContent.GetComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            viewport.GetComponent<ScrollRect>().content = pageContent;

            switch (activeTab)
            {
                case EconomyTab.Wallet:
                    BuildWalletTab();
                    break;
                case EconomyTab.Market:
                    BuildMarketTab();
                    break;
                case EconomyTab.Deposit:
                    BuildDepositTab();
                    break;
                case EconomyTab.Withdraw:
                    BuildWithdrawTab();
                    break;
            }

            SetStatus(statusMessage, statusIsError);
        }

        private void BuildWalletTab()
        {
            AddSection("SALDOS DE TU CUENTA");
            if (wallet == null)
            {
                AddMessage("La cartera todavía no está disponible para esta sesión.");
            }
            else
            {
                AddMessage(
                    "VEX IN-GAME  " + FormatAmount(wallet.vex_ingame) +
                    "\nVEX TRADEABLE  " + FormatAmount(wallet.vex_tradeable) +
                    "\nRESERVADO IN-GAME  " + FormatAmount(wallet.reserved_ingame) +
                    "\nRESERVADO TRADEABLE  " + FormatAmount(wallet.reserved_tradeable),
                    118f);
            }

            AddSection("RESUMEN DE MOVIMIENTOS");
            if (economyStats == null || !economyStats.ok)
            {
                AddMessage("El historial agregado no está disponible.");
            }
            else
            {
                AddMessage(
                    "MOVIMIENTOS  " + economyStats.entry_count +
                    "\nCRÉDITOS  " + FormatAmount(economyStats.total_credited) +
                    "  ·  DÉBITOS  " + FormatAmount(economyStats.total_debited) +
                    "\nNETO IN-GAME  " + FormatAmount(economyStats.net_ingame) +
                    "\nNETO TRADEABLE  " + FormatAmount(economyStats.net_tradeable) +
                    "\nMAYOR CRÉDITO  " + FormatAmount(economyStats.largest_credit),
                    150f);
            }

            AddSection("ACTIVIDAD POR TIPO");
            if (economyStats == null || economyStats.by_type == null || economyStats.by_type.Length == 0)
            {
                AddMessage("No hay movimientos agrupados disponibles.");
            }
            else
            {
                for (var i = 0; i < economyStats.by_type.Length; i++)
                {
                    var entry = economyStats.by_type[i];
                    if (entry == null) continue;
                    AddMessage(
                        ValueOr(entry.entry_type, "MOVIMIENTO").ToUpperInvariant() +
                        " · " + ValueOr(entry.currency, "MONEDA").ToUpperInvariant() +
                        "\nREGISTROS  " + entry.count +
                        "  ·  TOTAL  " + FormatAmount(entry.total_amount),
                        58f);
                }
            }

            AddMessage(
                "Los precios, cargos, disponibilidad y liquidación se confirman antes de procesar cada operación.",
                72f);
        }

        private void BuildMarketTab()
        {
            AddSection("OFERTAS ACTIVAS");
            if (listings == null || listings.Length == 0)
            {
                AddMessage("No hay ofertas activas disponibles.");
            }
            else
            {
                for (var i = 0; i < listings.Length; i++)
                {
                    var listing = listings[i];
                    if (listing == null) continue;
                    AddMarketListing(listing);
                }
            }

            AddSection("LISTAR UNA CARTA");
            AddMessage(
                "Indica el precio solicitado en VEX in-game. El cargo final y la disponibilidad se confirman antes de listar.",
                60f);
            priceInput = AddInput("Precio solicitado · VEX", string.Empty, true);

            if (ownedCards == null || ownedCards.Length == 0)
            {
                AddMessage("No hay cartas de la colección disponibles.");
            }
            else
            {
                var count = Math.Min(ownedCards.Length, 8);
                for (var i = 0; i < count; i++)
                {
                    var card = ownedCards[i];
                    if (card == null) continue;
                    AddOwnedCard(card);
                }
            }
        }

        private void BuildDepositTab()
        {
            AddSection("REGISTRAR UN DEPÓSITO EXTERNO");
            AddMessage(
                "Usa tu wallet externa para enviar los fondos. Este formulario registra el hash para revisión; no inicia una transferencia ni acredita saldo.",
                78f);

            if (treasuryWallets != null)
            {
                for (var i = 0; i < treasuryWallets.Length; i++)
                {
                    var treasury = treasuryWallets[i];
                    if (treasury != null) AddTreasuryWallet(treasury);
                }
            }
            if (treasuryWallets == null || treasuryWallets.Length == 0)
                AddMessage("No hay una dirección de tesorería activa disponible.");

            AddInput("Monto · USDT", string.Empty, true, value => amountInput = value);
            AddInput("Red · por ejemplo BEP20", "BEP20", false, value => chainInput = value);
            AddInput("Token · por ejemplo USDT", "USDT", false, value => tokenInput = value);
            AddInput("Hash de transacción", string.Empty, false, value => transactionHashInput = value);
            AddInput("Wallet pagadora", string.Empty, false, value => payerWalletInput = value);
            AddButton("REGISTRAR PARA REVISIÓN", () => _ = SubmitDepositAsync(), !actionInFlight);

            AddSection("HISTORIAL DE DEPÓSITOS");
            if (deposits == null || deposits.Length == 0)
                AddMessage("No hay depósitos registrados.");
            else
                for (var i = 0; i < deposits.Length; i++)
                {
                    var deposit = deposits[i];
                    if (deposit != null) AddDepositHistory(deposit);
                }
        }

        private void BuildWithdrawTab()
        {
            AddSection("SOLICITAR RETIRO");
            AddMessage(
                "Solo se solicita VEX tradeable. La revisión confirma si procede, los cargos y el monto neto. La solicitud no equivale a un pago procesado.",
                90f);
            AddMessage(
                "VEX TRADEABLE DISPONIBLE  " +
                (wallet == null ? "NO REPORTADO" : FormatAmount(wallet.vex_tradeable)),
                54f);
            AddInput("Cantidad · VEX tradeable", string.Empty, true, value => amountInput = value);
            AddButton("SOLICITAR RETIRO", () => ConfirmWithdrawal(), !actionInFlight);

            AddSection("SOLICITUDES");
            if (withdrawals == null || withdrawals.Length == 0)
                AddMessage("No hay solicitudes de retiro registradas.");
            else
                for (var i = 0; i < withdrawals.Length; i++)
                {
                    var withdrawal = withdrawals[i];
                    if (withdrawal != null) AddWithdrawalHistory(withdrawal);
                }
        }

        private void AddMarketListing(MarketListingRecord listing)
        {
            var cardName = "Carta " + ShortId(listing.player_card_id);
            var rarity = "NO VERIFICADA";
            if (listing.player_cards != null)
            {
                if (!string.IsNullOrWhiteSpace(listing.player_cards.card_id))
                    cardName = "Carta " + ShortId(listing.player_cards.card_id);
                if (listing.player_cards.cards != null)
                {
                    cardName = ValueOr(listing.player_cards.cards.name, cardName);
                    rarity = ValueOr(listing.player_cards.cards.rarity, rarity).ToUpperInvariant();
                }
            }

            var row = CreateRow(76f);
            var text = UiFactory.Label(
                row.transform,
                cardName + "\n" + rarity + "  ·  " + FormatAmount(listing.price) + " VEX",
                11,
                VexforgeTier1Ui.Text,
                TextAnchor.MiddleLeft);
            VexforgeTier1Ui.Anchor(text.rectTransform, .03f, .08f, .69f, .92f);
            var button = VexforgeTier1Ui.Button(
                row.transform,
                "Buy_" + ShortId(listing.id),
                "COMPRAR",
                () => ConfirmBuy(listing, cardName),
                new Color(.045f, .12f, .09f, .98f),
                10);
            VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), .72f, .15f, .97f, .85f);
            button.interactable = !actionInFlight &&
                                  app != null &&
                                  app.GameState != null &&
                                  listing.player_id != app.GameState.PlayerId;
        }

        private void AddOwnedCard(PlayerCardRecord card)
        {
            var name = card.card == null ? ("Carta " + ShortId(card.card_id)) : ValueOr(card.card.name, "Carta " + ShortId(card.card_id));
            var rarity = card.card == null ? "NO VERIFICADA" : ValueOr(card.card.rarity, "NO VERIFICADA");
            var state = card.listed ? "YA LISTADA" : (card.locked ? "RESERVADA" : ("QTY " + card.quantity));
            var row = CreateRow(72f);
            var text = UiFactory.Label(
                row.transform,
                name + "\n" + rarity.ToUpperInvariant() + "  ·  " + state,
                10,
                VexforgeTier1Ui.Text,
                TextAnchor.MiddleLeft);
            VexforgeTier1Ui.Anchor(text.rectTransform, .03f, .08f, .67f, .92f);
            var button = VexforgeTier1Ui.Button(
                row.transform,
                "List_" + ShortId(card.id),
                "LISTAR",
                () => ConfirmCreateListing(card, name),
                new Color(.15f, .11f, .055f, .98f),
                10);
            VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), .71f, .15f, .97f, .85f);
            button.interactable = !actionInFlight && !card.locked && !card.listed;
        }

        private void AddTreasuryWallet(TreasuryWalletRecord treasury)
        {
            var row = CreateRow(82f);
            var label = UiFactory.Label(
                row.transform,
                ValueOr(treasury.chain, "RED") + " · " + ValueOr(treasury.token_symbol, "TOKEN") +
                "\n" + ValueOr(treasury.wallet_address, "DIRECCIÓN NO REPORTADA") +
                (string.IsNullOrWhiteSpace(treasury.token_standard) ? string.Empty : "\n" + treasury.token_standard),
                9,
                VexforgeTier1Ui.Text,
                TextAnchor.MiddleLeft);
            VexforgeTier1Ui.Anchor(label.rectTransform, .03f, .05f, .76f, .95f);
            var address = treasury.wallet_address;
            var copy = VexforgeTier1Ui.Button(
                row.transform,
                "CopyTreasury_" + ShortId(address),
                "COPIAR",
                () =>
                {
                    if (string.IsNullOrWhiteSpace(address)) return;
                    GUIUtility.systemCopyBuffer = address;
                    SetStatus("DIRECCIÓN COPIADA. VERIFICA RED Y TOKEN ANTES DE ENVIAR.", false);
                },
                VexforgeTier1Ui.BlackGlass,
                9);
            VexforgeTier1Ui.Anchor(copy.GetComponent<RectTransform>(), .79f, .19f, .97f, .81f);
        }

        private void AddDepositHistory(EconomyDepositRecord deposit)
        {
            AddMessage(
                FormatAmount(deposit.amount_usdt) + " USDT  ·  VEX ACREDITADOS  " +
                FormatAmount(deposit.vex_credited) +
                "\n" + ValueOr(deposit.chain, "RED") + " / " + ValueOr(deposit.token_symbol, "TOKEN") +
                "\nESTADO  " + ValueOr(deposit.status, "NO REPORTADO").ToUpperInvariant() +
                "\nEl estado pendiente no equivale a un saldo acreditado.",
                74f);
        }

        private void AddWithdrawalHistory(WithdrawalRequestRecord withdrawal)
        {
            AddMessage(
                FormatAmount(withdrawal.tradeable_amount) + " VEX  →  " +
                FormatAmount(withdrawal.usdt_net) + " USDT netos" +
                "\nESTADO  " + ValueOr(withdrawal.status, "NO REPORTADO").ToUpperInvariant() +
                "  ·  FEE  " + FormatAmount(withdrawal.fee_usdt),
                70f);
        }

        private void AddSection(string value)
        {
            var label = VexforgeTier1Ui.Label(pageContent, "Section", value, 12, VexforgeTier1Ui.GoldSoft, TextAnchor.MiddleLeft);
            var element = label.gameObject.AddComponent<LayoutElement>();
            element.preferredHeight = 38f;
            element.minHeight = 38f;
            UiFactory.Stretch(label.rectTransform, 8f, 3f, 8f, 3f);
        }

        private void AddMessage(string value, float height = 56f)
        {
            var panel = UiFactory.PanelObject(pageContent, "EconomyMessage", new Color(.028f, .03f, .038f, .82f));
            var element = panel.AddComponent<LayoutElement>();
            element.preferredHeight = height;
            element.minHeight = height;
            var label = UiFactory.Label(panel.transform, value, 10, UiFactory.Text, TextAnchor.MiddleLeft);
            UiFactory.Stretch(label.rectTransform, 12f, 7f, 12f, 7f);
        }

        private InputField AddInput(string placeholder, string initialValue, bool decimalNumber)
        {
            return AddInput(pageContent, placeholder, initialValue, decimalNumber, null);
        }

        private InputField AddInput(string placeholder, string initialValue, bool decimalNumber, Action<InputField> assign)
        {
            return AddInput(pageContent, placeholder, initialValue, decimalNumber, assign);
        }

        private InputField AddInput(Transform parent, string placeholder, string initialValue, bool decimalNumber, Action<InputField> assign)
        {
            var input = UiFactory.Input(parent, placeholder, false);
            input.text = initialValue ?? string.Empty;
            input.contentType = decimalNumber ? InputField.ContentType.DecimalNumber : InputField.ContentType.Standard;
            input.characterLimit = decimalNumber ? 24 : 256;
            var element = input.gameObject.AddComponent<LayoutElement>();
            element.preferredHeight = 54f;
            element.minHeight = 54f;
            if (assign != null) assign(input);
            return input;
        }

        private void AddButton(string label, UnityEngine.Events.UnityAction action, bool enabled)
        {
            var button = VexforgeTier1Ui.Button(
                pageContent,
                "Action_" + label,
                label,
                action,
                new Color(.10f, .075f, .045f, .98f),
                11);
            var element = button.gameObject.AddComponent<LayoutElement>();
            element.preferredHeight = 54f;
            element.minHeight = 54f;
            button.interactable = enabled;
        }

        private GameObject CreateRow(float height)
        {
            var row = UiFactory.PanelObject(pageContent, "EconomyRow", new Color(.028f, .03f, .038f, .82f));
            var element = row.AddComponent<LayoutElement>();
            element.preferredHeight = height;
            element.minHeight = height;
            return row;
        }

        private void ConfirmBuy(MarketListingRecord listing, string cardName)
        {
            if (listing == null) return;
            AskConfirmation(
                "¿Comprar " + cardName + " por " + FormatAmount(listing.price) + " VEX in-game?\n\nEl resultado se confirmará al completar la compra.",
                () => _ = BuyListingAsync(listing));
        }

        private void ConfirmCreateListing(PlayerCardRecord card, string cardName)
        {
            if (card == null || priceInput == null) return;
            if (!TryReadAmount(priceInput.text, out var price) || price <= 0m)
            {
                SetStatus("INDICA UN PRECIO MAYOR QUE CERO.", true);
                return;
            }
            AskConfirmation(
                "¿Listar " + cardName + " por " + FormatAmount(price) + " VEX in-game?\n\nLa publicación queda sujeta a las reglas del juego.",
                () => _ = CreateListingAsync(card, price));
        }

        private void ConfirmWithdrawal()
        {
            if (amountInput == null || !TryReadAmount(amountInput.text, out var amount) || amount <= 0m)
            {
                SetStatus("INDICA UNA CANTIDAD MAYOR QUE CERO.", true);
                return;
            }
            AskConfirmation(
                "¿Enviar una solicitud por " + FormatAmount(amount) + " VEX tradeable?\n\nNo es un pago procesado. La revisión confirma si procede, el cargo y el monto neto.",
                () => _ = RequestWithdrawalAsync(amount));
        }

        private void AskConfirmation(string message, Action action)
        {
            if (confirmationShade == null || actionInFlight) return;
            pendingConfirmation = action;
            confirmationText.text = message;
            if (confirmationButton != null) confirmationButton.interactable = true;
            confirmationShade.gameObject.SetActive(true);
        }

        private void CancelConfirmation()
        {
            pendingConfirmation = null;
            if (confirmationShade != null) confirmationShade.gameObject.SetActive(false);
        }

        private void ConfirmPendingAction()
        {
            var action = pendingConfirmation;
            CancelConfirmation();
            if (action != null) action();
        }

        private async Task SubmitDepositAsync()
        {
            if (actionInFlight) return;
            if (amountInput == null ||
                !TryReadAmount(amountInput.text, out var amount) ||
                amount <= 0m ||
                chainInput == null ||
                string.IsNullOrWhiteSpace(chainInput.text) ||
                tokenInput == null ||
                string.IsNullOrWhiteSpace(tokenInput.text) ||
                transactionHashInput == null ||
                string.IsNullOrWhiteSpace(transactionHashInput.text) ||
                payerWalletInput == null ||
                string.IsNullOrWhiteSpace(payerWalletInput.text))
            {
                SetStatus("COMPLETA EL MONTO, LA RED, EL TOKEN, EL HASH Y LA WALLET PAGADORA.", true);
                return;
            }

            actionInFlight = true;
            var rerenderAfterAction = false;
            SetStatus("REGISTRANDO EL DEPÓSITO…", false);
            var generation = lifecycleGeneration;
            try
            {
                var result = await repository.SubmitDepositAsync(
                    amount,
                    chainInput.text,
                    tokenInput.text,
                    transactionHashInput.text,
                    payerWalletInput.text);
                if (!IsCurrent(generation)) return;
                if (result == null || !result.ok)
                {
                    SetStatus(DepositRejection(result == null ? null : result.reason), true);
                    return;
                }

                statusMessage = "DEPÓSITO REGISTRADO · " + ValueOr(result.status, "PENDIENTE").ToUpperInvariant() +
                                ". LA ACREDITACIÓN SE CONFIRMA POR SEPARADO.";
                statusIsError = false;
                rerenderAfterAction = true;
                await LoadSnapshotAsync(generation, true);
            }
            catch (Exception)
            {
                if (IsCurrent(generation))
                {
                    statusMessage = "NO SE PUDO CONFIRMAR EL REGISTRO. REVISA EL HISTORIAL ANTES DE REINTENTAR.";
                    statusIsError = true;
                    rerenderAfterAction = true;
                    await LoadSnapshotAsync(generation, true);
                }
            }
            finally
            {
                actionInFlight = false;
                if (IsCurrent(generation) && rerenderAfterAction) RenderActiveTab();
            }
        }

        private async Task BuyListingAsync(MarketListingRecord listing)
        {
            if (actionInFlight || listing == null || app == null || app.GameState == null) return;
            actionInFlight = true;
            var rerenderAfterAction = false;
            SetStatus("SOLICITANDO CONFIRMACIÓN DE COMPRA…", false);
            var generation = lifecycleGeneration;
            try
            {
                var result = await repository.BuyMarketListingAsync(app.GameState.PlayerId, listing.id);
                if (!IsCurrent(generation)) return;
                if (result == null || !result.ok)
                {
                    SetStatus("NO SE PUDO CONFIRMAR LA COMPRA. RECARGA EL MERCADO.", true);
                    return;
                }

                statusMessage = "COMPRA CONFIRMADA · " +
                                FormatAmount(result.price) + " VEX.";
                statusIsError = false;
                rerenderAfterAction = true;
                await LoadSnapshotAsync(generation, true);
            }
            catch (Exception)
            {
                if (IsCurrent(generation))
                {
                    statusMessage = "NO SE PUDO CONFIRMAR EL RESULTADO. RECARGA EL MERCADO Y LA CARTERA ANTES DE REINTENTAR.";
                    statusIsError = true;
                    rerenderAfterAction = true;
                    await LoadSnapshotAsync(generation, true);
                }
            }
            finally
            {
                actionInFlight = false;
                if (IsCurrent(generation) && rerenderAfterAction) RenderActiveTab();
            }
        }

        private async Task CreateListingAsync(PlayerCardRecord card, decimal price)
        {
            if (actionInFlight || card == null || app == null || app.GameState == null) return;
            actionInFlight = true;
            var rerenderAfterAction = false;
            SetStatus("CREANDO PUBLICACIÓN…", false);
            var generation = lifecycleGeneration;
            try
            {
                await repository.CreateMarketListingAsync(app.GameState.PlayerId, card.id, price);
                if (!IsCurrent(generation)) return;
                statusMessage = "PUBLICACIÓN CREADA.";
                statusIsError = false;
                rerenderAfterAction = true;
                await LoadSnapshotAsync(generation, true);
            }
            catch (Exception)
            {
                if (IsCurrent(generation))
                {
                    statusMessage = "NO SE PUDO CONFIRMAR EL LISTADO. RECARGA LA COLECCIÓN ANTES DE REINTENTAR.";
                    statusIsError = true;
                    rerenderAfterAction = true;
                    await LoadSnapshotAsync(generation, true);
                }
            }
            finally
            {
                actionInFlight = false;
                if (IsCurrent(generation) && rerenderAfterAction) RenderActiveTab();
            }
        }

        private async Task RequestWithdrawalAsync(decimal amount)
        {
            if (actionInFlight || app == null || app.GameState == null) return;
            actionInFlight = true;
            var rerenderAfterAction = false;
            SetStatus("ENVIANDO SOLICITUD DE RETIRO…", false);
            var generation = lifecycleGeneration;
            try
            {
                var result = await repository.RequestWithdrawalAsync(app.GameState.PlayerId, amount);
                if (!IsCurrent(generation)) return;
                if (result == null || !result.ok)
                {
                    SetStatus("NO SE PUDO ENVIAR LA SOLICITUD DE RETIRO.", true);
                    return;
                }

                statusMessage = "SOLICITUD ENVIADA · " + ValueOr(result.status, "PENDIENTE DE REVISIÓN").ToUpperInvariant();
                if (result.usdt_net > 0m)
                    statusMessage += " · MONTO NETO SOLICITADO: " + FormatAmount(result.usdt_net) + " USDT.";
                statusIsError = false;
                rerenderAfterAction = true;
                await LoadSnapshotAsync(generation, true);
            }
            catch (Exception)
            {
                if (IsCurrent(generation))
                {
                    statusMessage = "NO SE PUDO CONFIRMAR LA SOLICITUD. REVISA EL HISTORIAL ANTES DE VOLVER A SOLICITAR.";
                    statusIsError = true;
                    rerenderAfterAction = true;
                    await LoadSnapshotAsync(generation, true);
                }
            }
            finally
            {
                actionInFlight = false;
                if (IsCurrent(generation) && rerenderAfterAction) RenderActiveTab();
            }
        }

        private async Task ReloadAsync()
        {
            if (!open) return;
            lifecycleGeneration++;
            statusMessage = "SINCRONIZANDO LA TESORERÍA…";
            statusIsError = false;
            RenderActiveTab();
            await LoadSnapshotAsync(lifecycleGeneration, false);
        }

        private async Task LoadSnapshotAsync(int generation, bool preserveStatus)
        {
            if (!IsCurrent(generation) || repository == null || app.GameState == null) return;
            ClearSnapshot();
            RenderActiveTab();
            try
            {
                var playerId = app.GameState.PlayerId;
                if (string.IsNullOrWhiteSpace(playerId))
                    throw new InvalidOperationException();

                var walletTask = repository.GetWalletAsync(playerId);
                var statsTask = repository.GetEconomyStatsAsync();
                var marketTask = repository.GetMarketListingsAsync();
                var ownedTask = repository.GetCollectionAsync(playerId);
                var treasuryTask = repository.GetTreasuryWalletsAsync();
                var depositsTask = repository.GetMyDepositsAsync();
                var withdrawalsTask = repository.GetWithdrawalRequestsAsync(playerId);
                await Task.WhenAll(new Task[]
                {
                    walletTask,
                    statsTask,
                    marketTask,
                    ownedTask,
                    treasuryTask,
                    depositsTask,
                    withdrawalsTask
                });

                if (!IsCurrent(generation)) return;
                wallet = walletTask.Result;
                economyStats = statsTask.Result;
                listings = marketTask.Result ?? new MarketListingRecord[0];
                ownedCards = ownedTask.Result ?? new PlayerCardRecord[0];
                treasuryWallets = treasuryTask.Result ?? new TreasuryWalletRecord[0];
                deposits = depositsTask.Result ?? new EconomyDepositRecord[0];
                withdrawals = withdrawalsTask.Result ?? new WithdrawalRequestRecord[0];
                if (!preserveStatus) statusMessage = string.Empty;
                if (!preserveStatus) statusIsError = false;
            }
            catch (Exception)
            {
                if (!IsCurrent(generation)) return;
                ClearSnapshot();
                if (preserveStatus)
                    statusMessage = ValueOr(statusMessage, "OPERACIÓN RECIBIDA") +
                                    " · NO SE PUDO ACTUALIZAR LA VISTA. RECARGA ANTES DE REINTENTAR.";
                else
                    statusMessage = "LA TESORERÍA NO ESTÁ DISPONIBLE. COMPRUEBA LA CONEXIÓN E INTÉNTALO DE NUEVO.";
                statusIsError = true;
            }
            finally
            {
                if (IsCurrent(generation))
                    RenderActiveTab();
            }
        }

        private void ClearSnapshot()
        {
            wallet = null;
            economyStats = null;
            listings = new MarketListingRecord[0];
            ownedCards = new PlayerCardRecord[0];
            treasuryWallets = new TreasuryWalletRecord[0];
            deposits = new EconomyDepositRecord[0];
            withdrawals = new WithdrawalRequestRecord[0];
        }

        private void SetStatus(string value, bool isError)
        {
            statusMessage = value ?? string.Empty;
            statusIsError = isError;
            if (statusLabel == null) return;
            statusLabel.text = statusMessage;
            statusLabel.color = isError ? new Color(.88f, .34f, .34f, 1f) : VexforgeTier1Ui.Muted;
        }

        private void HandleSessionChanged(AuthState state)
        {
            if (state != AuthState.Authenticated) Hide();
        }

        private bool IsCurrent(int generation)
        {
            return open &&
                   generation == lifecycleGeneration &&
                   app != null &&
                   app.Session != null &&
                   app.Session.IsAuthenticated;
        }

        private static bool TryReadAmount(string value, out decimal amount)
        {
            return decimal.TryParse(
                (value ?? string.Empty).Trim(),
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out amount);
        }

        private static string FormatAmount(decimal value)
        {
            return value.ToString("0.########", CultureInfo.InvariantCulture);
        }

        private static string DepositRejection(string reason)
        {
            if (!string.IsNullOrWhiteSpace(reason))
            {
                var normalized = reason.ToLowerInvariant();
                if (normalized.Contains("mínimo") || normalized.Contains("minimo") || normalized.Contains("minimum"))
                    return "EL MONTO ESTÁ POR DEBAJO DEL MÍNIMO PERMITIDO.";
                if (normalized.Contains("hash") && (normalized.Contains("registrado") || normalized.Contains("already")))
                    return "ESE HASH DE TRANSACCIÓN YA ESTÁ REGISTRADO.";
            }
            return "NO SE PUDO REGISTRAR EL DEPÓSITO. REVISA LOS DATOS E INTÉNTALO DE NUEVO.";
        }

        private static string ValueOr(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private static string ShortId(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "—";
            return value.Length <= 10 ? value : value.Substring(0, 8);
        }

        private void OnDestroy()
        {
            lifecycleGeneration++;
            if (app != null && app.Session != null)
                app.Session.StateChanged -= HandleSessionChanged;
            if (canvas != null) Destroy(canvas.gameObject);
        }
    }
}
