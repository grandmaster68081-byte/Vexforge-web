using System;
using System.Collections.Generic;
using UnityEngine;

namespace Vexforge.Presentation
{
    public sealed class VexforgeTextureLruCache : IDisposable
    {
        private sealed class Entry
        {
            public string key;
            public Texture2D texture;
            public int bytes;
            public int leases;
            public LinkedListNode<string> node;
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
                if (owner == null) return;
                owner.Release(key);
                owner = null;
                Texture = null;
            }
        }

        private readonly Dictionary<string, Entry> entries = new Dictionary<string, Entry>();
        private readonly LinkedList<string> lru = new LinkedList<string>();
        private bool disposed;

        public VexforgeTextureLruCache(int budgetBytes)
        {
            if (budgetBytes <= 0) throw new ArgumentOutOfRangeException("budgetBytes");
            BudgetBytes = budgetBytes;
            Application.lowMemory += HandleLowMemory;
        }

        public int BudgetBytes { get; private set; }
        public int ResidentBytes { get; private set; }

        public TextureLease TryAcquire(string key)
        {
            if (disposed || string.IsNullOrWhiteSpace(key)) return null;
            Entry entry;
            if (!entries.TryGetValue(key, out entry)) return null;
            entry.leases++;
            Touch(entry);
            return new TextureLease(this, key, entry.texture);
        }

        public TextureLease Add(string key, Texture2D texture)
        {
            if (disposed || texture == null || string.IsNullOrWhiteSpace(key))
            {
                DestroyTexture(texture);
                return null;
            }

            var existing = TryAcquire(key);
            if (existing != null)
            {
                DestroyTexture(texture);
                return existing;
            }

            var bytes = EstimateBytes(texture);
            if (bytes > BudgetBytes || !EvictUntilFits(bytes))
            {
                DestroyTexture(texture);
                return null;
            }

            var node = lru.AddLast(key);
            var entry = new Entry
            {
                key = key,
                texture = texture,
                bytes = bytes,
                leases = 1,
                node = node
            };
            entries.Add(key, entry);
            ResidentBytes += bytes;
            return new TextureLease(this, key, texture);
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            Application.lowMemory -= HandleLowMemory;

            var snapshot = new List<Entry>(entries.Values);
            for (var i = 0; i < snapshot.Count; i++)
            {
                if (snapshot[i].leases == 0) DestroyEntry(snapshot[i]);
            }
        }

        private void Release(string key)
        {
            Entry entry;
            if (!entries.TryGetValue(key, out entry)) return;
            entry.leases = Mathf.Max(0, entry.leases - 1);
            if (disposed && entry.leases == 0) DestroyEntry(entry);
        }

        private bool EvictUntilFits(int incomingBytes)
        {
            while (ResidentBytes + incomingBytes > BudgetBytes)
            {
                var node = lru.First;
                while (node != null)
                {
                    Entry candidate;
                    if (entries.TryGetValue(node.Value, out candidate) && candidate.leases == 0)
                    {
                        DestroyEntry(candidate);
                        break;
                    }
                    node = node.Next;
                }

                if (node == null && ResidentBytes + incomingBytes > BudgetBytes) return false;
            }
            return true;
        }

        private void HandleLowMemory()
        {
            var target = BudgetBytes / 2;
            var node = lru.First;
            while (node != null && ResidentBytes > target)
            {
                var next = node.Next;
                Entry entry;
                if (entries.TryGetValue(node.Value, out entry) && entry.leases == 0)
                {
                    DestroyEntry(entry);
                }
                node = next;
            }
        }

        private void Touch(Entry entry)
        {
            if (entry.node.List != null) lru.Remove(entry.node);
            entry.node = lru.AddLast(entry.key);
        }

        private void DestroyEntry(Entry entry)
        {
            entries.Remove(entry.key);
            if (entry.node.List != null) lru.Remove(entry.node);
            ResidentBytes = Mathf.Max(0, ResidentBytes - entry.bytes);
            DestroyTexture(entry.texture);
        }

        private static int EstimateBytes(Texture2D texture)
        {
            return Mathf.Max(1, texture.width) * Mathf.Max(1, texture.height) * 4;
        }

        private static void DestroyTexture(Texture2D texture)
        {
            if (texture == null) return;
            if (Application.isPlaying) UnityEngine.Object.Destroy(texture);
            else UnityEngine.Object.DestroyImmediate(texture);
        }
    }
}