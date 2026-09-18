using System;
using System.Collections.Generic;
using UnityEngine;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Byte-bounded LRU cache for runtime card textures. An active lease pins an entry.
    /// The cache owns texture lifetime and never destroys a leased texture.
    /// </summary>
    public sealed class VexforgeTextureLruCache : IDisposable
    {
        private sealed class Entry
        {
            public string Key;
            public Texture2D Texture;
            public long Bytes;
            public int Leases;
            public LinkedListNode<string> Node;
        }

        public sealed class TextureLease : IDisposable
        {
            private VexforgeTextureLruCache owner;
            private readonly string key;

            internal TextureLease(VexforgeTextureLruCache owner, string key, Texture2D texture)
            {
                this.owner = owner;
                this.key = key;
                Texture = texture;
            }

            public Texture2D Texture { get; private set; }

            public void Dispose()
            {
                var currentOwner = owner;
                if (currentOwner == null) return;
                owner = null;
                Texture = null;
                currentOwner.ReleaseLease(key);
            }
        }

        private readonly Dictionary<string, Entry> entries = new Dictionary<string, Entry>(StringComparer.Ordinal);
        private readonly LinkedList<string> lru = new LinkedList<string>();
        private readonly object gate = new object();
        private long budgetBytes;
        private long residentBytes;
        private bool disposed;

        public VexforgeTextureLruCache(long budgetBytes)
        {
            if (budgetBytes <= 0L) throw new ArgumentOutOfRangeException(nameof(budgetBytes));
            this.budgetBytes = budgetBytes;
            Application.lowMemory += OnLowMemory;
        }

        public long BudgetBytes
        {
            get { lock (gate) return budgetBytes; }
        }

        public long ResidentBytes
        {
            get { lock (gate) return residentBytes; }
        }

        public int Count
        {
            get { lock (gate) return entries.Count; }
        }

        public TextureLease TryAcquire(string key)
        {
            if (string.IsNullOrWhiteSpace(key)) return null;
            lock (gate)
            {
                if (disposed) return null;

                Entry entry;
                if (!entries.TryGetValue(key, out entry) || entry.Texture == null)
                {
                    return null;
                }

                entry.Leases++;
                TouchUnsafe(entry);
                return new TextureLease(this, key, entry.Texture);
            }
        }

        public bool Store(string key, Texture2D texture)
        {
            if (string.IsNullOrWhiteSpace(key) || texture == null) return false;

            var bytes = EstimateBytes(texture);
            lock (gate)
            {
                if (disposed) return false;
                if (bytes <= 0L) bytes = 1L;
                if (bytes > budgetBytes) return false;

                Entry existing;
                if (entries.TryGetValue(key, out existing))
                {
                    if (ReferenceEquals(existing.Texture, texture))
                    {
                        TouchUnsafe(existing);
                        return true;
                    }

                    // Never replace a leased entry. A shared in-flight request must not
                    // destroy content that another presentation instance is using.
                    if (existing.Leases > 0) return false;

                    entries.Remove(key);
                    if (existing.Node != null) lru.Remove(existing.Node);
                    residentBytes -= existing.Bytes;
                    DestroyTexture(existing.Texture);
                }

                while (residentBytes + bytes > budgetBytes)
                {
                    if (!EvictOldestUnleasedUnsafe()) break;
                }

                if (residentBytes + bytes > budgetBytes) return false;

                var node = lru.AddFirst(key);
                entries[key] = new Entry
                {
                    Key = key,
                    Texture = texture,
                    Bytes = bytes,
                    Leases = 0,
                    Node = node
                };
                residentBytes += bytes;
                return true;
            }
        }

        public void SetBudget(long newBudgetBytes)
        {
            if (newBudgetBytes <= 0L) throw new ArgumentOutOfRangeException(nameof(newBudgetBytes));
            lock (gate)
            {
                budgetBytes = newBudgetBytes;
                TrimUnsafe();
            }
        }

        public void Clear(bool preserveLeasedEntries)
        {
            lock (gate)
            {
                var node = lru.Last;
                while (node != null)
                {
                    var previous = node.Previous;
                    Entry entry;
                    if (entries.TryGetValue(node.Value, out entry) &&
                        (!preserveLeasedEntries || entry.Leases == 0))
                    {
                        RemoveEntryUnsafe(entry);
                    }
                    node = previous;
                }
            }
        }

        public void Dispose()
        {
            lock (gate)
            {
                if (disposed) return;
                disposed = true;
                Application.lowMemory -= OnLowMemory;

                var node = lru.First;
                while (node != null)
                {
                    var next = node.Next;
                    Entry entry;
                    if (entries.TryGetValue(node.Value, out entry))
                    {
                        // At shutdown there should be no consumers. Destroying here is
                        // intentional; runtime CardView releases its leases before disposal.
                        DestroyTexture(entry.Texture);
                    }
                    node = next;
                }

                entries.Clear();
                lru.Clear();
                residentBytes = 0L;
            }
        }

        private void ReleaseLease(string key)
        {
            lock (gate)
            {
                if (disposed) return;

                Entry entry;
                if (!entries.TryGetValue(key, out entry)) return;

                if (entry.Leases > 0) entry.Leases--;
                TouchUnsafe(entry);
                TrimUnsafe();
            }
        }

        private void TrimUnsafe()
        {
            while (residentBytes > budgetBytes)
            {
                if (!EvictOldestUnleasedUnsafe()) break;
            }
        }

        private bool EvictOldestUnleasedUnsafe()
        {
            var node = lru.Last;
            while (node != null)
            {
                Entry entry;
                if (entries.TryGetValue(node.Value, out entry))
                {
                    if (entry.Leases == 0)
                    {
                        RemoveEntryUnsafe(entry);
                        return true;
                    }
                }
                node = node.Previous;
            }
            return false;
        }

        private void TouchUnsafe(Entry entry)
        {
            if (entry.Node == null) return;
            lru.Remove(entry.Node);
            entry.Node = lru.AddFirst(entry.Key);
        }

        private void RemoveEntryUnsafe(Entry entry)
        {
            entries.Remove(entry.Key);
            if (entry.Node != null) lru.Remove(entry.Node);
            residentBytes -= entry.Bytes;
            DestroyTexture(entry.Texture);
        }

        private void OnLowMemory()
        {
            Clear(true);
        }

        private static long EstimateBytes(Texture2D texture)
        {
            if (texture == null) return 0L;
            // Conservative runtime accounting for Android presentation. The Unity
            // runtime texture memory footprint can exceed this estimate depending
            // on format/mipmap allocation, therefore the budget is deliberately bounded.
            var mipCount = Mathf.Max(1, texture.mipmapCount);
            var baseBytes = (long)texture.width * texture.height * 4L;
            return baseBytes + (baseBytes / 3L) * Mathf.Max(0, mipCount - 1);
        }

        private static void DestroyTexture(Texture2D texture)
        {
            if (texture != null) UnityEngine.Object.Destroy(texture);
        }
    }
}
