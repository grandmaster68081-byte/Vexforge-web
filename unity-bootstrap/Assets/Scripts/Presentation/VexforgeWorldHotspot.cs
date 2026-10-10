using System;
using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    [RequireComponent(typeof(BoxCollider))]
    public sealed class VexforgeWorldHotspot : MonoBehaviour
    {
        [SerializeField] private float focusScale = 1.06f;
        [SerializeField] private float focusLerpSpeed = 12f;

        private Vector3 baseScale;
        private bool focused;

        public event Action<GameRoute> RouteRequested;
        public GameRoute Route { get; private set; }

        public void Configure(GameRoute route, Color accent)
        {
            Route = route;
            baseScale = transform.localScale == Vector3.zero
                ? Vector3.one
                : transform.localScale;

            var layer = LayerMask.NameToLayer("VexforgeHotspot");
            if (layer >= 0) gameObject.layer = layer;

            var collider = GetComponent<BoxCollider>();
            collider.enabled = true;
            collider.isTrigger = false;

            SetFocused(false);
        }

        // Compatibility signature retained for the R4 Nexus builder.
        public void Configure(GameRoute route, Transform visualTarget)
        {
            Configure(route, Color.white);

            if (visualTarget != null)
            {
                baseScale = visualTarget.localScale == Vector3.zero
                    ? Vector3.one
                    : visualTarget.localScale;
                transform.localScale = baseScale;
            }
        }

        public void Configure(GameRoute route, Transform visualTarget, Color accent)
        {
            Configure(route, visualTarget);
        }

        public void SetFocused(bool value)
        {
            focused = value;
        }

        private void Update()
        {
            var target = focused
                ? baseScale * focusScale
                : baseScale;

            transform.localScale = Vector3.Lerp(
                transform.localScale,
                target,
                1f - Mathf.Exp(-focusLerpSpeed * Time.unscaledDeltaTime));
        }

        internal void RaiseRouteRequested()
        {
            RouteRequested?.Invoke(Route);
        }
    }
}
