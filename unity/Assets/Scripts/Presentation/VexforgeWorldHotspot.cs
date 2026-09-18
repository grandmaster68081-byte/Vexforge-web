using System;
using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    [RequireComponent(typeof(BoxCollider))]
    public sealed class VexforgeWorldHotspot : MonoBehaviour
    {
        private readonly MaterialPropertyBlock propertyBlock = new MaterialPropertyBlock();
        private Color baseColor = Color.white;
        private bool focused;

        public event Action<GameRoute> RouteRequested;

        public GameRoute Route { get; private set; }

        public void Configure(GameRoute route, Color color)
        {
            Route = route;
            baseColor = color;
            var collider = GetComponent<BoxCollider>();
            collider.enabled = true;
            collider.isTrigger = false;
            SetFocused(false);
        }

        public void SetFocused(bool value)
        {
            if (focused == value && Application.isPlaying) return;
            focused = value;
            var renderers = GetComponentsInChildren<Renderer>(true);
            for (var i = 0; i < renderers.Length; i++)
            {
                renderers[i].GetPropertyBlock(propertyBlock);
                propertyBlock.SetColor("_Color", focused ? Color.Lerp(baseColor, Color.white, 0.35f) : baseColor);
                renderers[i].SetPropertyBlock(propertyBlock);
            }
        }

        internal void RaiseRouteRequested()
        {
            RouteRequested?.Invoke(Route);
        }
    }
}