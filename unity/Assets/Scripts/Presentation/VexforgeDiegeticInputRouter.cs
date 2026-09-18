using System;
using UnityEngine;
using UnityEngine.InputSystem;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Single presentation input seam. No legacy Input Manager calls are allowed here.
    /// It centralizes pointer/touch state, hotspot focus/activation and presentation gestures.
    /// </summary>
    public sealed class VexforgeDiegeticInputRouter : MonoBehaviour
    {
        private const string HotspotLayerName = "VexforgeHotspot";
        private const int FallbackHitCapacity = 32;

        [SerializeField] private float movementThreshold = 24f;
        [SerializeField] private float debounceSeconds = 0.18f;
        [SerializeField] private float rayDistance = 250f;
        [SerializeField] private LayerMask hotspotLayers;

        private readonly RaycastHit[] fallbackHits = new RaycastHit[FallbackHitCapacity];
        private Camera targetCamera;
        private VexforgeWorldHotspot focused;
        private VexforgeWorldHotspot pressed;
        private Vector2 pressPosition;
        private Vector2 lastPointerPosition;
        private float nextAcceptedTime;
        private bool usingFallbackLayers;

        public event Action<Vector2> PointerPressed;
        public event Action<Vector2, Vector2> PointerDragged;
        public event Action<Vector2> PointerReleased;
        public event Action<Vector2, float> PointerScrolled;

        public void Initialize(Camera camera)
        {
            targetCamera = camera;

            var layer = LayerMask.NameToLayer(HotspotLayerName);
            if (layer >= 0)
            {
                hotspotLayers = 1 << layer;
                usingFallbackLayers = false;
            }
            else
            {
                hotspotLayers = Physics.DefaultRaycastLayers;
                usingFallbackLayers = true;
                Debug.LogWarning(
                    "VEXFORGE: Project layer 'VexforgeHotspot' is not configured; "
                    + "raycast results are filtered by VexforgeWorldHotspot until Editor setup.",
                    this);
            }
        }

        private void Update()
        {
            if (targetCamera == null) targetCamera = Camera.main;
            if (targetCamera == null) return;

            var touch = Touchscreen.current;
            if (touch != null &&
                (touch.primaryTouch.press.isPressed ||
                 touch.primaryTouch.press.wasPressedThisFrame ||
                 touch.primaryTouch.press.wasReleasedThisFrame))
            {
                ProcessTouch(touch.primaryTouch);
                return;
            }

            ProcessMouse();
        }

        private void ProcessTouch(UnityEngine.InputSystem.Controls.TouchControl touch)
        {
            var position = touch.position.ReadValue();

            if (touch.press.wasPressedThisFrame)
            {
                BeginPointer(position);
            }

            if (touch.press.isPressed)
            {
                EmitDrag(position);
            }

            if (touch.press.wasReleasedThisFrame)
            {
                EndPointer(position);
            }
        }

        private void ProcessMouse()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;

            var position = mouse.position.ReadValue();
            UpdateFocus(position);

            if (mouse.leftButton.wasPressedThisFrame)
            {
                BeginPointer(position);
            }

            if (mouse.leftButton.isPressed)
            {
                EmitDrag(position);
            }

            if (mouse.leftButton.wasReleasedThisFrame)
            {
                EndPointer(position);
            }

            var scroll = mouse.scroll.ReadValue().y;
            if (Mathf.Abs(scroll) > 0.01f)
            {
                PointerScrolled?.Invoke(position, scroll);
            }
        }

        private void BeginPointer(Vector2 position)
        {
            UpdateFocus(position);
            pressed = focused;
            pressPosition = position;
            lastPointerPosition = position;
            PointerPressed?.Invoke(position);
        }

        private void EmitDrag(Vector2 position)
        {
            var delta = position - lastPointerPosition;
            if (delta.sqrMagnitude <= Mathf.Epsilon) return;

            lastPointerPosition = position;
            PointerDragged?.Invoke(position, delta);
            UpdateFocus(position);
        }

        private void EndPointer(Vector2 position)
        {
            PointerReleased?.Invoke(position);

            var target = pressed;
            pressed = null;

            if (target == null) return;
            if (target != Raycast(position)) return;
            if (Time.unscaledTime < nextAcceptedTime) return;
            if ((position - pressPosition).sqrMagnitude >
                movementThreshold * movementThreshold)
            {
                return;
            }

            nextAcceptedTime = Time.unscaledTime + debounceSeconds;
            target.RaiseRouteRequested();
        }

        private void UpdateFocus(Vector2 screenPosition)
        {
            var next = Raycast(screenPosition);
            if (ReferenceEquals(focused, next)) return;

            if (focused != null) focused.SetFocused(false);
            focused = next;
            if (focused != null) focused.SetFocused(true);
        }

        private VexforgeWorldHotspot Raycast(Vector2 screenPosition)
        {
            var ray = targetCamera.ScreenPointToRay(screenPosition);

            if (!usingFallbackLayers)
            {
                RaycastHit hit;
                if (!Physics.Raycast(
                        ray,
                        out hit,
                        rayDistance,
                        hotspotLayers,
                        QueryTriggerInteraction.Ignore))
                {
                    return null;
                }

                return hit.collider == null
                    ? null
                    : hit.collider.GetComponentInParent<VexforgeWorldHotspot>();
            }

            var count = Physics.RaycastNonAlloc(
                ray,
                fallbackHits,
                rayDistance,
                hotspotLayers,
                QueryTriggerInteraction.Ignore);

            VexforgeWorldHotspot best = null;
            var bestDistance = float.PositiveInfinity;

            for (var i = 0; i < count; i++)
            {
                var collider = fallbackHits[i].collider;
                if (collider == null) continue;

                var candidate = collider.GetComponentInParent<VexforgeWorldHotspot>();
                if (candidate == null) continue;

                if (fallbackHits[i].distance < bestDistance)
                {
                    best = candidate;
                    bestDistance = fallbackHits[i].distance;
                }
            }

            return best;
        }

        private void OnDisable()
        {
            if (focused != null) focused.SetFocused(false);
            focused = null;
            pressed = null;
        }
    }
}
