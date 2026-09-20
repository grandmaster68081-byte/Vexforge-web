using System.Collections.Generic;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    /// <summary>
    /// World-space virtualized catalog. The complete catalog remains data-accessible,
    /// while only the visible/preload window consumes pooled CardView instances.
    /// </summary>
    public sealed class VexforgeVirtualizedCardGallery : MonoBehaviour
    {
        private readonly Dictionary<int, VexforgeCardView> visible =
            new Dictionary<int, VexforgeCardView>();
        private readonly Dictionary<string, PlayerCardRecord> ownership =
            new Dictionary<string, PlayerCardRecord>(System.StringComparer.Ordinal);
        private readonly Vector3[] viewportCorners = new Vector3[4];

        private VexforgeCardPool pool;
        private VexforgeCardArtResolver resolver;
        private VexforgeDiegeticInputRouter inputRouter;
        private CardRecord[] catalog = new CardRecord[0];
        private Camera targetCamera;
        private bool initialized;
        private bool shown;
        private float scrollRows;
        private bool pointerTracking;
        private bool pointerMoved;
        private Vector2 pointerPrevious;
        private readonly RaycastHit[] selectionHits = new RaycastHit[24];

        [SerializeField] private int columns = 4;
        [SerializeField] private int viewportRows = 3;
        [SerializeField] private int preloadRows = 1;
        [SerializeField] private float rowSpacing = 2.82f;
        [SerializeField] private float columnSpacing = 1.82f;
        [SerializeField] private float pixelsPerRow = 300f;
        [SerializeField] private Vector2 viewportWorldSize = new Vector2(7.8f, 9.0f);

        public int CatalogCount { get { return catalog == null ? 0 : catalog.Length; } }
        public int ActiveCardCount { get { return visible.Count; } }
        public bool IsShown { get { return shown; } }
        public event System.Action<CardRecord> CardSelected;

        public void Initialize(
            Camera camera,
            VexforgeCardPool cardPool,
            VexforgeCardArtResolver artResolver,
            VexforgeDiegeticInputRouter presentationInput)
        {
            targetCamera = camera;
            pool = cardPool;
            resolver = artResolver;
            inputRouter = presentationInput;

            if (pool == null)
                Debug.LogError("VEXFORGE Archive gallery requires a CardPool.", this);
            if (inputRouter == null)
                Debug.LogError("VEXFORGE Archive gallery requires the shared DiegeticInputRouter.", this);

            if (inputRouter != null)
            {
                inputRouter.PointerPressed += OnPointerPressed;
                inputRouter.PointerDragged += OnPointerDragged;
                inputRouter.PointerReleased += OnPointerReleased;
                inputRouter.PointerScrolled += OnPointerScrolled;
            }

            initialized = true;
            shown = false;
            gameObject.SetActive(false);
        }

        public void SetData(CardRecord[] records, PlayerCardRecord[] playerCollection)
        {
            if (!initialized) return;

            // Dataset changes (sorting, filtering, sync) must never reuse a view at the
            // same numeric index without rebinding it.
            ReturnVisible();
            catalog = records ?? new CardRecord[0];
            scrollRows = 0f;

            ownership.Clear();
            if (playerCollection != null)
            {
                for (var i = 0; i < playerCollection.Length; i++)
                {
                    var item = playerCollection[i];
                    if (item == null || string.IsNullOrWhiteSpace(item.card_id)) continue;
                    ownership[item.card_id] = item;
                }
            }

            if (shown) RefreshVisible();
        }

        public void Show()
        {
            if (!initialized) return;

            shown = true;
            gameObject.SetActive(true);
            RefreshVisible();
        }

        public void Hide()
        {
            shown = false;
            pointerTracking = false;
            ReturnVisible();
            gameObject.SetActive(false);
        }

        public void ScrollByRows(float deltaRows)
        {
            if (!shown || catalog.Length == 0) return;

            var maxScroll = Mathf.Max(0f, TotalRows - EffectiveViewportRows);
            var next = Mathf.Clamp(scrollRows + deltaRows, 0f, maxScroll);
            if (Mathf.Abs(next - scrollRows) < 0.0001f) return;

            scrollRows = next;
            RefreshVisible();
        }

        public void SetNormalizedScroll(float normalized)
        {
            if (!shown) return;

            var maxScroll = Mathf.Max(0f, TotalRows - EffectiveViewportRows);
            scrollRows = Mathf.Clamp01(normalized) * maxScroll;
            RefreshVisible();
        }

        private int EffectiveViewportRows
        {
            get { return Mathf.Max(1, viewportRows); }
        }

        private int TotalRows
        {
            get
            {
                return Mathf.CeilToInt(
                    (catalog == null ? 0 : catalog.Length) /
                    (float)Mathf.Max(1, columns));
            }
        }

        private int EffectivePreloadRows
        {
            get
            {
                if (pool == null) return 0;

                var requested = Mathf.Max(0, preloadRows);
                var neededRows = EffectiveViewportRows + requested * 2;
                var maxRows = pool.MaxActiveInstances / Mathf.Max(1, columns);

                if (maxRows <= 0) return 0;
                return Mathf.Max(
                    0,
                    Mathf.Min(requested, (maxRows - EffectiveViewportRows) / 2));
            }
        }

        private void OnPointerPressed(Vector2 screenPosition)
        {
            if (!shown || !InsideViewport(screenPosition)) return;

            pointerTracking = true;
            pointerMoved = false;
            pointerPrevious = screenPosition;
        }

        private void OnPointerDragged(Vector2 screenPosition, Vector2 delta)
        {
            if (!shown || !pointerTracking) return;

            if (delta.sqrMagnitude > 25f)
                pointerMoved = true;
            ScrollByRows(-delta.y / Mathf.Max(1f, pixelsPerRow));
            pointerPrevious = screenPosition;
        }

        private void OnPointerReleased(Vector2 screenPosition)
        {
            if (shown && pointerTracking && !pointerMoved)
                TrySelectCard(screenPosition);
            pointerTracking = false;
        }

        private void TrySelectCard(Vector2 screenPosition)
        {
            if (targetCamera == null) return;
            var ray = targetCamera.ScreenPointToRay(screenPosition);
            var count = Physics.RaycastNonAlloc(
                ray,
                selectionHits,
                250f,
                Physics.DefaultRaycastLayers,
                QueryTriggerInteraction.Ignore);
            var bestDistance = float.PositiveInfinity;
            CardRecord selected = null;
            for (var i = 0; i < count; i++)
            {
                var collider = selectionHits[i].collider;
                var view = collider == null ? null : collider.GetComponentInParent<VexforgeCardView>();
                if (view == null || view.BoundCard == null) continue;
                if (selectionHits[i].distance < bestDistance)
                {
                    bestDistance = selectionHits[i].distance;
                    selected = view.BoundCard;
                }
            }
            if (selected != null)
                CardSelected?.Invoke(selected);
        }

        private void OnPointerScrolled(Vector2 screenPosition, float delta)
        {
            if (!shown || !InsideViewport(screenPosition)) return;
            ScrollByRows(-delta / 120f);
        }

        private void RefreshVisible()
        {
            if (!shown || pool == null) return;

            var total = catalog.Length;
            if (total == 0)
            {
                ReturnVisible();
                return;
            }

            var preload = EffectivePreloadRows;
            var centerRow = Mathf.FloorToInt(scrollRows);
            var startRow = Mathf.Max(0, centerRow - preload);
            var endRow = Mathf.Min(
                TotalRows - 1,
                startRow + EffectiveViewportRows + preload * 2 - 1);

            var firstIndex = startRow * Mathf.Max(1, columns);
            var lastIndex = Mathf.Min(
                total - 1,
                ((endRow + 1) * Mathf.Max(1, columns)) - 1);

            var toReturn = TemporaryList<int>.Get();

            foreach (var pair in visible)
            {
                if (pair.Key < firstIndex || pair.Key > lastIndex)
                    toReturn.Add(pair.Key);
            }

            for (var i = 0; i < toReturn.Count; i++)
                ReturnIndex(toReturn[i]);

            TemporaryList<int>.Release(toReturn);

            for (var index = firstIndex; index <= lastIndex; index++)
            {
                VexforgeCardView existing;
                if (visible.TryGetValue(index, out existing))
                {
                    Position(index, existing.transform);
                    continue;
                }

                var card = catalog[index];
                if (card == null) continue;

                PlayerCardRecord playerCard;
                ownership.TryGetValue(card.id, out playerCard);

                var view = pool.Rent(
                    card,
                    playerCard,
                    false,
                    false,
                    playerCard != null && playerCard.locked,
                    resolver,
                    CardArtMode.FullCardArtwork);

                if (view == null) continue;

                Position(index, view.transform);
                visible[index] = view;
            }
        }

        private void Position(int index, Transform card)
        {
            var row = index / Mathf.Max(1, columns);
            var column = index % Mathf.Max(1, columns);

            var x = (column - (columns - 1) * 0.5f) * columnSpacing;
            var y = -(row - scrollRows) * rowSpacing;
            card.localPosition = new Vector3(x, y, 0f);
            card.localRotation = Quaternion.identity;
        }

        private void ReturnVisible()
        {
            if (pool == null || visible.Count == 0) return;

            var indices = TemporaryList<int>.Get();
            foreach (var pair in visible) indices.Add(pair.Key);

            for (var i = 0; i < indices.Count; i++)
                ReturnIndex(indices[i]);

            TemporaryList<int>.Release(indices);
        }

        private void ReturnIndex(int index)
        {
            VexforgeCardView view;
            if (!visible.TryGetValue(index, out view)) return;

            visible.Remove(index);
            pool.Return(view);
        }

        private bool InsideViewport(Vector2 screenPosition)
        {
            if (targetCamera == null) return false;

            var half = viewportWorldSize * 0.5f;
            viewportCorners[0] = transform.TransformPoint(new Vector3(-half.x, -half.y, 0f));
            viewportCorners[1] = transform.TransformPoint(new Vector3(-half.x,  half.y, 0f));
            viewportCorners[2] = transform.TransformPoint(new Vector3( half.x, -half.y, 0f));
            viewportCorners[3] = transform.TransformPoint(new Vector3( half.x,  half.y, 0f));

            var min = new Vector2(float.MaxValue, float.MaxValue);
            var max = new Vector2(float.MinValue, float.MinValue);

            for (var i = 0; i < viewportCorners.Length; i++)
            {
                var screen = targetCamera.WorldToScreenPoint(viewportCorners[i]);
                min = Vector2.Min(min, screen);
                max = Vector2.Max(max, screen);
            }

            return screenPosition.x >= min.x &&
                   screenPosition.x <= max.x &&
                   screenPosition.y >= min.y &&
                   screenPosition.y <= max.y;
        }

        private void OnDestroy()
        {
            if (inputRouter != null)
            {
                inputRouter.PointerPressed -= OnPointerPressed;
                inputRouter.PointerDragged -= OnPointerDragged;
                inputRouter.PointerReleased -= OnPointerReleased;
                inputRouter.PointerScrolled -= OnPointerScrolled;
            }

            ReturnVisible();
        }

        private static class TemporaryList<T>
        {
            private static readonly Stack<List<T>> cache = new Stack<List<T>>();

            public static List<T> Get()
            {
                return cache.Count == 0 ? new List<T>() : cache.Pop();
            }

            public static void Release(List<T> value)
            {
                value.Clear();
                cache.Push(value);
            }
        }
    }
}
