using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    public sealed class VexforgeCardArtResolver : IDisposable
    {
        private readonly VexforgeTextureLruCache cache;
        private bool disposed;

        public VexforgeCardArtResolver(VexforgeTextureLruCache cache)
        {
            this.cache = cache;
        }

        public async Task<VexforgeTextureLruCache.TextureLease> AcquireAsync(CardRecord card)
        {
            if (disposed || card == null || string.IsNullOrWhiteSpace(card.image_url)) return null;
            var url = card.image_url.Trim();
            Uri parsed;
            if (!Uri.TryCreate(url, UriKind.Absolute, out parsed)) return null;
            if (parsed.Scheme != Uri.UriSchemeHttps && parsed.Scheme != Uri.UriSchemeHttp) return null;

            var cached = cache.TryAcquire(url);
            if (cached != null) return cached;

            using (var request = UnityWebRequestTexture.GetTexture(url, true))
            {
                var sent = await UnityWebRequestAsync.Send(request);
                if (sent.result != UnityWebRequest.Result.Success) return null;
                var texture = DownloadHandlerTexture.GetContent(sent);
                return cache.Add(url, texture);
            }
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            cache.Dispose();
        }
    }
}