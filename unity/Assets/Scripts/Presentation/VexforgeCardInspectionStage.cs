using System;
using System.Collections;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Featured-card inspection stage. It turns the existing card view into an interactive world object.
    /// </summary>
    public sealed class VexforgeCardInspectionStage : MonoBehaviour
    {
        private VexforgeDiegeticInputRouter inputRouter;
        private VexforgeCardArtResolver artResolver;
        private VexforgeCardView view;
        private Camera targetCamera;
        private Vector2 pressPosition;
        private bool tracking;
        private readonly RaycastHit[] hitBuffer = new RaycastHit[16];
        private bool visible;
        private float idleTime;
        private float baseScale = 1f;
        private Vector3 basePosition;
        private Quaternion baseRotation;

        public bool IsVisible { get { return visible; } }
        public event Action Closed;

        public void Initialize(
            Camera camera,
            VexforgeDiegeticInputRouter router,
            VexforgeCardArtResolver resolver)
        {
            targetCamera = camera;
            inputRouter = router;
            artResolver = resolver;

            if (inputRouter != null)
            {
                inputRouter.PointerPressed += HandlePressed;
                inputRouter.PointerDragged += HandleDragged;
                inputRouter.PointerReleased += HandleReleased;
            }

            gameObject.SetActive(false);
        }

        public void Show(CardRecord card, PlayerCardRecord ownership)
        {
            if (card == null || artResolver == null)
                return;

            StopAllCoroutines();
            if (view != null)
            {
                Destroy(view.gameObject);
                view = null;
            }

            gameObject.SetActive(true);
            visible = true;
            idleTime = 0f;

            view = VexforgeCardView.CreateRuntime(transform);
            view.Bind(card, ownership, false, false, ownership != null && ownership.locked, artResolver, CardArtMode.FullCardArtwork);

            basePosition = new Vector3(0f, 2.15f, 3.05f);
            baseRotation = Quaternion.identity;
            view.transform.position = basePosition + Vector3.down * 1.9f;
            view.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
            view.transform.localScale = Vector3.one * 0.42f;
            baseScale = 1f;

            StartCoroutine(Reveal());
        }

        public void Hide(bool notify = true)
        {
            if (!visible)
                return;

            StopAllCoroutines();
            visible = false;
            tracking = false;
            if (view != null)
            {
                Destroy(view.gameObject);
                view = null;
            }
            gameObject.SetActive(false);
            if (notify)
                Closed?.Invoke();
        }

        private IEnumerator Reveal()
        {
            var start = basePosition + Vector3.down * 1.9f;
            var startScale = 0.42f;
            var duration = 0.56f;
            var t = 0f;

            while (t < 1f && view != null)
            {
                t += Time.unscaledDeltaTime / duration;
                var n = EaseOutCubic(Mathf.Clamp01(t));
                view.transform.position = Vector3.Lerp(start, basePosition, n);
                var scale = Mathf.Lerp(startScale, 1f, n);
                view.transform.localScale = Vector3.one * scale;
                view.transform.rotation = Quaternion.Euler(0f, Mathf.Sin(n * Mathf.PI) * 8f, 0f);
                yield return null;
            }

            if (view != null)
            {
                view.transform.position = basePosition;
                view.transform.rotation = baseRotation;
            }
        }

        private void Update()
        {
            if (!visible || view == null || tracking)
                return;

            idleTime += Time.unscaledDeltaTime;
            var bob = Mathf.Sin(idleTime * 1.15f) * 0.035f;
            view.transform.position = basePosition + Vector3.up * bob;
            view.transform.rotation = Quaternion.Euler(
                Mathf.Sin(idleTime * 0.85f) * 1.8f,
                Mathf.Sin(idleTime * 0.55f) * 3.0f,
                Mathf.Sin(idleTime * 0.72f) * 1.2f);
        }

        private void HandlePressed(Vector2 position)
        {
            if (!visible || view == null || targetCamera == null)
                return;

            if (!HitCard(position))
                return;

            tracking = true;
            pressPosition = position;
        }

        private void HandleDragged(Vector2 position, Vector2 delta)
        {
            if (!visible || view == null || !tracking)
                return;

            var yaw = Mathf.Clamp(delta.x * 0.55f, -12f, 12f);
            var pitch = Mathf.Clamp(-delta.y * 0.45f, -12f, 12f);
            var target = Quaternion.Euler(pitch, yaw, 0f);
            view.transform.position = basePosition;
            view.transform.rotation = Quaternion.Slerp(view.transform.rotation, target, 0.30f);
        }

        private void HandleReleased(Vector2 position)
        {
            if (!visible || view == null || !tracking)
                return;

            tracking = false;
            if ((position - pressPosition).sqrMagnitude < 16f)
            {
                // A tap toggles the featured card out of the way, returning to the gallery/world.
                Hide();
                return;
            }

            StopAllCoroutines();
            StartCoroutine(ReturnToRest());
        }

        private IEnumerator ReturnToRest()
        {
            var startPosition = view == null ? basePosition : view.transform.position;
            var startRotation = view == null ? baseRotation : view.transform.rotation;
            var t = 0f;
            while (t < 1f && view != null)
            {
                t += Time.unscaledDeltaTime / 0.20f;
                var n = Mathf.Clamp01(t);
                view.transform.position = Vector3.Lerp(startPosition, basePosition, n);
                view.transform.rotation = Quaternion.Slerp(startRotation, baseRotation, n);
                yield return null;
            }
        }

        private bool HitCard(Vector2 screenPosition)
        {
            var ray = targetCamera.ScreenPointToRay(screenPosition);
            var count = Physics.RaycastNonAlloc(ray, hitBuffer, 100f, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Ignore);
            var nearest = float.PositiveInfinity;
            for (var i = 0; i < count; i++)
            {
                var collider = hitBuffer[i].collider;
                var cardView = collider == null ? null : collider.GetComponentInParent<VexforgeCardView>();
                if (cardView != view) continue;
                if (hitBuffer[i].distance < nearest)
                    nearest = hitBuffer[i].distance;
            }
            return nearest < float.PositiveInfinity;
        }

        private static float EaseOutCubic(float value)
        {
            var oneMinus = 1f - value;
            return 1f - oneMinus * oneMinus * oneMinus;
        }

        private void OnDestroy()
        {
            if (inputRouter != null)
            {
                inputRouter.PointerPressed -= HandlePressed;
                inputRouter.PointerDragged -= HandleDragged;
                inputRouter.PointerReleased -= HandleReleased;
            }
        }
    }
}
