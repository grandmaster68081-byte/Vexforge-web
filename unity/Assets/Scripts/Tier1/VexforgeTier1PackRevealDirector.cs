using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Core;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1PackRevealDirector : MonoBehaviour
    {
        private enum ViewState
        {
            Catalog,
            Opening,
            Reveal,
            Complete
        }

        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private VexforgeCardArtResolver artResolver;
        private VexforgeTextureLruCache.TextureLease cardArtLease;
        private VexforgeTier1PackRevealView view;
        private PackRecord[] packs = new PackRecord[0];
        private PackOrderRecord[] pendingOrders = new PackOrderRecord[0];
        private OpenedCard[] openedCards = new OpenedCard[0];
        private string pendingOrderId;
        private string pendingLoadWarning;
        private int packPage;
        private int pendingOrderIndex;
        private int revealIndex = -1;
        private int sessionGeneration;
        private bool visible;
        private bool busy;
        private bool mutationInFlight;
        private ViewState viewState;
        private Coroutine revealRoutine;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            if (view != null) return;
            app = host;
            assets = registry;
            view = gameObject.AddComponent<VexforgeTier1PackRevealView>();
            view.Initialize(assets, Close);
        }

        public void BindArtResolver(VexforgeCardArtResolver resolver)
        {
            artResolver = resolver;
        }

        public void ShowCatalog()
        {
            if (view == null || app == null || app.GameState == null) return;
            visible = true;
            view.Show();
            if (busy)
            {
                view.ShowLoading("ESPERA A QUE TERMINE LA OPERACIÓN ACTUAL.");
                view.SetCloseEnabled(!mutationInFlight);
                return;
            }

            viewState = ViewState.Catalog;
            LoadCatalogAsync();
        }

        public void Hide()
        {
            visible = false;
            if (revealRoutine != null)
            {
                StopCoroutine(revealRoutine);
                revealRoutine = null;
            }
            ReleaseCardArt();
            if (view != null) view.Hide();
        }

        public void ResetSessionState()
        {
            sessionGeneration++;
            pendingOrderId = null;
            packs = new PackRecord[0];
            pendingOrders = new PackOrderRecord[0];
            openedCards = new OpenedCard[0];
            pendingLoadWarning = string.Empty;
            packPage = 0;
            pendingOrderIndex = 0;
            revealIndex = -1;
            Hide();
        }

        private async void LoadCatalogAsync()
        {
            if (busy || !visible) return;
            var generation = sessionGeneration;
            busy = true;
            var loadWarning = string.Empty;
            view.ShowLoading("CONSULTANDO EL CATÁLOGO AUTORIZADO…");
            view.SetCloseEnabled(true);

            PackRecord[] loadedPacks;
            try
            {
                loadedPacks = await app.GameState.GetPackCatalogAsync();
            }
            catch (System.Exception)
            {
                loadedPacks = new PackRecord[0];
                loadWarning = "No se pudo cargar el catálogo.";
            }

            PackOrderRecord[] loadedOrders;
            try
            {
                loadedOrders = await app.GameState.GetPendingPackOrdersAsync();
            }
            catch (System.Exception)
            {
                loadedOrders = new PackOrderRecord[0];
                loadWarning = string.IsNullOrEmpty(loadWarning)
                    ? "No se pudieron consultar las órdenes pendientes."
                    : loadWarning + " Las órdenes pendientes tampoco se pudieron consultar.";
            }

            busy = false;
            if (!IsCurrentSession(generation))
            {
                if (visible && app != null && app.Session != null && app.Session.IsAuthenticated)
                    LoadCatalogAsync();
                return;
            }

            packs = loadedPacks ?? new PackRecord[0];
            pendingOrders = loadedOrders ?? new PackOrderRecord[0];
            pendingLoadWarning = loadWarning;
            packPage = Mathf.Clamp(packPage, 0, Mathf.Max(0, (packs.Length - 1) / 3));
            pendingOrderIndex = Mathf.Clamp(pendingOrderIndex, 0, Mathf.Max(0, pendingOrders.Length - 1));
            if (!visible || viewState != ViewState.Catalog) return;
            RenderCatalog(pendingLoadWarning);
        }

        private void RenderCatalog(string message)
        {
            viewState = ViewState.Catalog;
            view.ShowCatalog(
                packs,
                pendingOrders,
                packPage,
                pendingOrderIndex,
                pendingOrderId,
                message,
                PurchasePack,
                OpenPendingOrder,
                RetryPendingOrder,
                ChangePackPage,
                ChangePendingOrder);
            view.SetCloseEnabled(!mutationInFlight);
        }

        private async void PurchasePack(PackRecord pack)
        {
            if (busy || !visible || pack == null) return;
            var generation = sessionGeneration;
            busy = true;
            mutationInFlight = true;
            view.SetCloseEnabled(false);
            view.ShowLoading("PROCESANDO LA COMPRA DEL PAQUETE…");
            try
            {
                var purchase = await app.GameState.BuyPackAsync(pack.pack_key);
                if (!IsCurrentSession(generation)) return;
                if (purchase == null || !purchase.ok || string.IsNullOrWhiteSpace(purchase.order_id))
                    throw new System.InvalidOperationException("La compra no fue confirmada.");

                pendingOrderId = purchase.order_id;
                await OpenPendingOrderAsync(pendingOrderId, generation);
            }
            catch (System.Exception)
            {
                busy = false;
                if (!IsCurrentSession(generation)) return;
                if (visible)
                    RenderCatalog(string.IsNullOrWhiteSpace(pendingOrderId)
                        ? "LA COMPRA NO FUE CONFIRMADA."
                        : "LA ORDEN SIGUE PENDIENTE; PUEDES REINTENTAR LA APERTURA.");
            }
            finally
            {
                busy = false;
                mutationInFlight = false;
                if (visible && viewState == ViewState.Catalog)
                    view.SetCloseEnabled(true);
            }
        }

        private void RetryPendingOrder()
        {
            if (string.IsNullOrWhiteSpace(pendingOrderId)) return;
            OpenPendingOrder(pendingOrderId);
        }

        private async void OpenPendingOrder(string orderId)
        {
            if (busy || string.IsNullOrWhiteSpace(orderId)) return;
            var generation = sessionGeneration;
            pendingOrderId = orderId;
            busy = true;
            mutationInFlight = true;
            view.SetCloseEnabled(false);
            view.ShowLoading("CONFIRMANDO EL PAQUETE…");
            try
            {
                await OpenPendingOrderAsync(orderId, generation);
            }
            catch (System.Exception)
            {
                busy = false;
                if (!IsCurrentSession(generation)) return;
                if (visible)
                    RenderCatalog("LA ORDEN NO SE ABRIÓ. PUEDES REINTENTAR SIN COMPRAR OTRA VEZ.");
            }
            finally
            {
                busy = false;
                mutationInFlight = false;
                if (visible && viewState == ViewState.Catalog)
                    view.SetCloseEnabled(true);
            }
        }

        private async System.Threading.Tasks.Task OpenPendingOrderAsync(string orderId, int generation)
        {
            var result = await app.GameState.OpenPackAsync(orderId);
            if (!IsCurrentSession(generation)) return;
            if (result == null || !result.ok || result.cards == null)
                throw new System.InvalidOperationException("La apertura no fue confirmada.");

            openedCards = result.cards;
            pendingOrderId = null;
            revealIndex = -1;
            if (!visible) return;

            viewState = ViewState.Opening;
            view.SetCloseEnabled(false);
            view.ShowOpening("ORDEN CONFIRMADA · INICIANDO CEREMONIA");
            if (revealRoutine != null) StopCoroutine(revealRoutine);
            revealRoutine = StartCoroutine(RevealRoutine());
        }

        private IEnumerator RevealRoutine()
        {
            viewState = ViewState.Opening;
            view.SetOpeningStatus("ACTIVANDO EL SELLO…");
            yield return new WaitForSecondsRealtime(.45f);
            view.SetOpeningStatus("CARGANDO ENERGÍA…");
            yield return new WaitForSecondsRealtime(.65f);
            view.SetOpeningStatus("RUPTURA DEL SELLO…");
            yield return new WaitForSecondsRealtime(.35f);
            revealRoutine = null;

            if (openedCards == null || openedCards.Length == 0)
            {
                RenderComplete("LA APERTURA SE CONFIRMÓ, PERO NO HAY CARTAS PARA MOSTRAR.");
                yield break;
            }

            viewState = ViewState.Reveal;
            ShowNextCard();
        }

        private void ShowNextCard()
        {
            if (!visible || viewState != ViewState.Reveal) return;
            revealIndex++;
            if (openedCards == null || revealIndex >= openedCards.Length)
            {
                RenderComplete("APERTURA COMPLETADA · " + (openedCards == null ? 0 : openedCards.Length) + " CARTAS CONFIRMADAS.");
                return;
            }

            ReleaseCardArt();
            var card = openedCards[revealIndex];
            view.ShowCard(
                card,
                revealIndex,
                openedCards.Length,
                null,
                app.GameState.PackSyncWarning,
                ShowNextCard);
            LoadCardArtAsync(card, revealIndex);
        }

        private async void LoadCardArtAsync(OpenedCard opened, int expectedIndex)
        {
            if (artResolver == null || opened == null) return;
            var card = FindOwnedCard(opened);
            if (card == null) return;

            var lease = await artResolver.AcquireAsync(card);
            if (lease == null) return;
            if (!visible || viewState != ViewState.Reveal || revealIndex != expectedIndex)
            {
                lease.Dispose();
                return;
            }

            ReleaseCardArt();
            cardArtLease = lease;
            view.SetCardTexture(lease.Texture);
        }

        private CardRecord FindOwnedCard(OpenedCard opened)
        {
            if (opened == null || app == null || app.GameState == null) return null;
            var collection = app.GameState.Collection;
            if (collection == null) return null;
            var requestedId = !string.IsNullOrWhiteSpace(opened.card_id) ? opened.card_id : opened.id;
            for (var i = 0; i < collection.Length; i++)
            {
                var row = collection[i];
                if (row == null || row.card == null) continue;
                if ((!string.IsNullOrWhiteSpace(requestedId) && row.card.id == requestedId) ||
                    (!string.IsNullOrWhiteSpace(opened.code) && row.card.code == opened.code))
                    return row.card;
            }
            return null;
        }

        private void RenderComplete(string message)
        {
            viewState = ViewState.Complete;
            ReleaseCardArt();
            view.ShowComplete(message, app.GameState.PackSyncWarning, Close);
            view.SetCloseEnabled(true);
        }

        private void ChangePackPage(int delta)
        {
            var pageCount = (packs.Length + 2) / 3;
            if (pageCount <= 1) return;
            packPage = (packPage + delta + pageCount) % pageCount;
            RenderCatalog(pendingLoadWarning);
        }

        private void ChangePendingOrder(int delta)
        {
            if (pendingOrders.Length <= 1) return;
            pendingOrderIndex = (pendingOrderIndex + delta + pendingOrders.Length) % pendingOrders.Length;
            RenderCatalog(pendingLoadWarning);
        }

        private void Close()
        {
            if (busy) return;
            Hide();
        }

        private bool IsCurrentSession(int generation)
        {
            return generation == sessionGeneration &&
                   app != null &&
                   app.Session != null &&
                   app.Session.IsAuthenticated;
        }

        private void ReleaseCardArt()
        {
            if (cardArtLease == null) return;
            cardArtLease.Dispose();
            cardArtLease = null;
        }

        private void OnDestroy()
        {
            if (revealRoutine != null) StopCoroutine(revealRoutine);
            ReleaseCardArt();
        }
    }
}
