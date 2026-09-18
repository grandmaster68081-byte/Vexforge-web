using System;
using System.Collections.Generic;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    public sealed class VexforgeCardPool : IDisposable
    {
        private readonly Transform parent;
        private readonly Func<VexforgeCardView> factory;
        private readonly Queue<VexforgeCardView> inactive = new Queue<VexforgeCardView>();
        private readonly List<VexforgeCardView> active = new List<VexforgeCardView>();
        private bool disposed;

        public VexforgeCardPool(
            Transform parent,
            Func<VexforgeCardView> factory,
            int maxActiveInstances,
            int maxInactiveInstances)
        {
            if (maxActiveInstances <= 0) throw new ArgumentOutOfRangeException("maxActiveInstances");
            if (maxInactiveInstances < 0) throw new ArgumentOutOfRangeException("maxInactiveInstances");
            this.parent = parent;
            this.factory = factory;
            MaxActiveInstances = maxActiveInstances;
            MaxInactiveInstances = maxInactiveInstances;
        }

        public int MaxActiveInstances { get; private set; }
        public int MaxInactiveInstances { get; private set; }
        public int ActiveCount { get { return active.Count; } }

        public VexforgeCardView Rent(
            CardRecord card,
            PlayerCardRecord ownership,
            bool selected,
            bool activeInBattle,
            bool locked,
            VexforgeCardArtResolver resolver)
        {
            var view = Rent();
            if (view == null) return null;
            view.Bind(card, ownership, selected, activeInBattle, locked, resolver);
            return view;
        }

        public VexforgeCardView Rent()
        {
            if (disposed || active.Count >= MaxActiveInstances) return null;
            var view = inactive.Count > 0 ? inactive.Dequeue() : factory();
            if (view == null) return null;
            view.transform.SetParent(parent, false);
            view.gameObject.SetActive(true);
            active.Add(view);
            return view;
        }

        public void Return(VexforgeCardView view)
        {
            if (view == null || !active.Remove(view)) return;
            view.ResetForPool();
            if (disposed || inactive.Count >= MaxInactiveInstances)
            {
                UnityEngine.Object.Destroy(view.gameObject);
                return;
            }
            inactive.Enqueue(view);
        }

        public void ReturnAll()
        {
            for (var i = active.Count - 1; i >= 0; i--) Return(active[i]);
        }

        public void Dispose()
        {
            if (disposed) return;
            ReturnAll();
            disposed = true;
            while (inactive.Count > 0)
            {
                var view = inactive.Dequeue();
                if (view != null) UnityEngine.Object.Destroy(view.gameObject);
            }
        }
    }
}