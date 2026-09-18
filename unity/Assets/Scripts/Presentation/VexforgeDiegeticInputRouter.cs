using UnityEngine;

namespace Vexforge.Presentation
{
    public sealed class VexforgeDiegeticInputRouter : MonoBehaviour
    {
        [SerializeField] private float movementThreshold = 24f;
        [SerializeField] private float debounceSeconds = 0.18f;
        [SerializeField] private float rayDistance = 250f;
        [SerializeField] private LayerMask hotspotLayers = ~0;

        private Camera targetCamera;
        private VexforgeWorldHotspot focused;
        private VexforgeWorldHotspot pressed;
        private Vector2 pressPosition;
        private float nextAcceptedTime;

        public void Initialize(Camera camera)
        {
            targetCamera = camera;
        }

        private void Update()
        {
            if (targetCamera == null) targetCamera = Camera.main;
            if (targetCamera == null) return;

            if (Input.touchCount > 0)
            {
                ProcessTouch(Input.GetTouch(0));
                return;
            }

            ProcessMouse();
        }

        private void ProcessMouse()
        {
            var position = (Vector2)Input.mousePosition;
            UpdateFocus(position);

            if (Input.GetMouseButtonDown(0))
            {
                pressed = focused;
                pressPosition = position;
            }

            if (Input.GetMouseButtonUp(0))
            {
                CommitRelease(position);
            }
        }

        private void ProcessTouch(Touch touch)
        {
            UpdateFocus(touch.position);
            if (touch.phase == TouchPhase.Began)
            {
                pressed = focused;
                pressPosition = touch.position;
            }
            else if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
            {
                CommitRelease(touch.position);
            }
        }

        private void UpdateFocus(Vector2 screenPosition)
        {
            var next = Raycast(screenPosition);
            if (focused == next) return;
            if (focused != null) focused.SetFocused(false);
            focused = next;
            if (focused != null) focused.SetFocused(true);
        }

        private void CommitRelease(Vector2 screenPosition)
        {
            var target = pressed;
            pressed = null;
            if (target == null || target != Raycast(screenPosition)) return;
            if (Time.unscaledTime < nextAcceptedTime) return;
            if ((screenPosition - pressPosition).sqrMagnitude > movementThreshold * movementThreshold) return;

            nextAcceptedTime = Time.unscaledTime + debounceSeconds;
            target.RaiseRouteRequested();
        }

        private VexforgeWorldHotspot Raycast(Vector2 screenPosition)
        {
            var ray = targetCamera.ScreenPointToRay(screenPosition);
            RaycastHit hit;
            if (!Physics.Raycast(ray, out hit, rayDistance, hotspotLayers, QueryTriggerInteraction.Ignore)) return null;
            return hit.collider.GetComponentInParent<VexforgeWorldHotspot>();
        }
    }
}