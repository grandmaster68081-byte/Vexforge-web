using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Bounded loader for official VEXFORGE card art.
    /// Only the canonical Supabase host/bucket path is accepted.
    /// Requests for the same normalized object share a single network operation.
    /// </summary>
    public sealed class VexforgeCardArtResolver : IDisposable
    {
        private const string AllowedHost = "rscuzqnfccqvltkdcdny.supabase.co";
        private const string PublicCardsPrefix = "/storage/v1/object/public/vexforge-assets/cards/";
        private const string SignedCardsPrefix = "/storage/v1/object/sign/vexforge-assets/cards/";

        private readonly VexforgeTextureLruCache cache;
        private readonly SemaphoreSlim concurrency;
        private readonly Dictionary<string, Task<Texture2D>> inFlight =
            new Dictionary<string, Task<Texture2D>>(StringComparer.Ordinal);
        private readonly object inFlightGate = new object();
        private readonly int timeoutSeconds;
        private readonly long maxDownloadBytes;
        private readonly int maxDimension;
        private bool disposed;

        public VexforgeCardArtResolver(
            VexforgeTextureLruCache cache,
            int maxConcurrentRequests = 3,
            int timeoutSeconds = 20,
            long maxDownloadBytes = 8L * 1024L * 1024L,
            int maxDimension = 4096)
        {
            if (cache == null) throw new ArgumentNullException(nameof(cache));
            if (maxConcurrentRequests <= 0) throw new ArgumentOutOfRangeException(nameof(maxConcurrentRequests));
            if (timeoutSeconds <= 0) throw new ArgumentOutOfRangeException(nameof(timeoutSeconds));
            if (maxDownloadBytes <= 0L) throw new ArgumentOutOfRangeException(nameof(maxDownloadBytes));
            if (maxDimension <= 0) throw new ArgumentOutOfRangeException(nameof(maxDimension));

            this.cache = cache;
            concurrency = new SemaphoreSlim(maxConcurrentRequests, maxConcurrentRequests);
            this.timeoutSeconds = timeoutSeconds;
            this.maxDownloadBytes = maxDownloadBytes;
            this.maxDimension = maxDimension;
        }

        public async Task<VexforgeTextureLruCache.TextureLease> AcquireAsync(
            CardRecord card,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            if (disposed || card == null || string.IsNullOrWhiteSpace(card.image_url)) return null;

            string cacheKey;
            var normalizedUrl = card.image_url.Trim();
            if (!TryValidateOfficialCardUrl(normalizedUrl, out cacheKey)) return null;
            if (cancellationToken.IsCancellationRequested) return null;

            var cached = cache.TryAcquire(cacheKey);
            if (cached != null) return cached;

            Task<Texture2D> shared;
            lock (inFlightGate)
            {
                if (!inFlight.TryGetValue(cacheKey, out shared))
                {
                    shared = LoadAndCacheAsync(cacheKey, normalizedUrl);
                    inFlight.Add(cacheKey, shared);
                    _ = ObserveCompletionAsync(cacheKey, shared);
                }
            }

            try
            {
                if (cancellationToken.CanBeCanceled)
                {
                    var cancellationSource = new TaskCompletionSource<bool>();
                    using (cancellationToken.Register(() => cancellationSource.TrySetResult(true)))
                    {
                        var completed = await Task.WhenAny(shared, cancellationSource.Task);
                        if (completed != shared) return null;
                    }
                }

                await shared;
            }
            catch (Exception ex)
            {
                Debug.LogWarning("VEXFORGE card-art load failed: " + ex.Message);
                return null;
            }

            if (disposed || cancellationToken.IsCancellationRequested) return null;
            return cache.TryAcquire(cacheKey);
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;

            lock (inFlightGate)
            {
                if (inFlight.Count == 0)
                {
                    concurrency.Dispose();
                }
            }

            // Do not dispose the cache here. The owner (GameShell) controls the cache
            // lifetime and may have more than one presentation consumer.
        }

        private async Task ObserveCompletionAsync(string cacheKey, Task<Texture2D> shared)
        {
            try
            {
                await shared;
            }
            catch
            {
                // AcquireAsync reports failure to the view. Cleanup still occurs here.
            }
            finally
            {
                lock (inFlightGate)
                {
                    Task<Texture2D> current;
                    if (inFlight.TryGetValue(cacheKey, out current) && ReferenceEquals(current, shared))
                    {
                        inFlight.Remove(cacheKey);
                    }

                    if (disposed && inFlight.Count == 0)
                    {
                        concurrency.Dispose();
                    }
                }
            }
        }

        private async Task<Texture2D> LoadAndCacheAsync(string cacheKey, string requestUrl)
        {
            await concurrency.WaitAsync();
            try
            {
                if (disposed) return null;

                using (var request = UnityWebRequestTexture.GetTexture(requestUrl, true))
                {
                    request.timeout = timeoutSeconds;
                    request.SetRequestHeader("Accept", "image/*");

                    var contentLength = request.GetRequestHeader("Content-Length");
                    if (!string.IsNullOrWhiteSpace(contentLength))
                    {
                        long declaredLength;
                        if (long.TryParse(contentLength, out declaredLength) && declaredLength > maxDownloadBytes)
                        {
                            return null;
                        }
                    }

                    var operation = request.SendWebRequest();
                    while (!operation.isDone)
                    {
                        if (request.downloadedBytes > (ulong)maxDownloadBytes)
                        {
                            request.Abort();
                            return null;
                        }

                        await Task.Yield();
                    }

                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        return null;
                    }

                    if (request.downloadedBytes > (ulong)maxDownloadBytes)
                    {
                        return null;
                    }

                    var responseLength = request.GetResponseHeader("Content-Length");
                    if (!string.IsNullOrWhiteSpace(responseLength))
                    {
                        long declaredLength;
                        if (long.TryParse(responseLength, out declaredLength) &&
                            declaredLength > maxDownloadBytes)
                        {
                            return null;
                        }
                    }

                    var contentType = request.GetResponseHeader("Content-Type");
                    if (string.IsNullOrWhiteSpace(contentType) ||
                        !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }

                    var texture = DownloadHandlerTexture.GetContent(request);
                    if (texture == null ||
                        texture.width <= 0 ||
                        texture.height <= 0 ||
                        texture.width > maxDimension ||
                        texture.height > maxDimension)
                    {
                        if (texture != null) UnityEngine.Object.Destroy(texture);
                        return null;
                    }

                    texture.wrapMode = TextureWrapMode.Clamp;
                    texture.filterMode = FilterMode.Bilinear;
                    texture.anisoLevel = 1;

                    if (!cache.Store(cacheKey, texture))
                    {
                        UnityEngine.Object.Destroy(texture);
                        return null;
                    }

                    return texture;
                }
            }
            finally
            {
                concurrency.Release();
            }
        }

        private static bool TryValidateOfficialCardUrl(string url, out string cacheKey)
        {
            cacheKey = null;

            Uri parsed;
            if (!Uri.TryCreate(url, UriKind.Absolute, out parsed)) return false;
            if (!string.Equals(parsed.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)) return false;
            if (!string.Equals(parsed.Host, AllowedHost, StringComparison.OrdinalIgnoreCase)) return false;
            if (!parsed.IsDefaultPort && parsed.Port != 443) return false;
            if (!string.IsNullOrEmpty(parsed.UserInfo)) return false;
            if (!string.IsNullOrEmpty(parsed.Fragment)) return false;

            var publicMatch = parsed.AbsolutePath.StartsWith(PublicCardsPrefix, StringComparison.OrdinalIgnoreCase);
            var signedMatch = parsed.AbsolutePath.StartsWith(SignedCardsPrefix, StringComparison.OrdinalIgnoreCase);
            if (!publicMatch && !signedMatch) return false;

            var prefixLength = publicMatch ? PublicCardsPrefix.Length : SignedCardsPrefix.Length;
            var objectPath = parsed.AbsolutePath.Substring(prefixLength);
            if (string.IsNullOrWhiteSpace(objectPath)) return false;

            var decodedPath = Uri.UnescapeDataString(objectPath);
            if (ContainsTraversal(decodedPath)) return false;
            if (decodedPath.IndexOf('\0') >= 0) return false;

            // Query parameters may contain expiring signatures. They are deliberately
            // excluded from cache identity because they identify the same underlying object.
            cacheKey = "vexforge-card-art:" + decodedPath;
            return true;
        }

        private static bool ContainsTraversal(string objectPath)
        {
            var parts = objectPath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            for (var i = 0; i < parts.Length; i++)
            {
                if (parts[i] == "." || parts[i] == "..") return true;
            }

            return false;
        }
    }
}
