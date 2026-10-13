using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    public sealed class VexforgeCardArtDiagnostic
    {
        public string CardId { get; private set; }
        public string Stage { get; private set; }
        public string Status { get; private set; }
        public string ErrorType { get; private set; }
        public long HttpStatusCode { get; private set; }

        public VexforgeCardArtDiagnostic(
            string cardId,
            string stage,
            string status,
            string errorType,
            long httpStatusCode)
        {
            CardId = cardId ?? string.Empty;
            Stage = stage ?? string.Empty;
            Status = status ?? string.Empty;
            ErrorType = errorType ?? string.Empty;
            HttpStatusCode = httpStatusCode;
        }
    }

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
        private readonly Dictionary<string, Task<LoadOutcome>> inFlight =
            new Dictionary<string, Task<LoadOutcome>>(StringComparer.Ordinal);
        private readonly object inFlightGate = new object();
        private readonly int timeoutSeconds;
        private readonly long maxDownloadBytes;
        private readonly int maxDimension;
        private bool disposed;

        public event Action<VexforgeCardArtDiagnostic> Diagnostic;
        public bool IsDisposed { get { return disposed; } }

        private sealed class LoadOutcome
        {
            public readonly Texture2D Texture;
            public readonly string Stage;
            public readonly string Status;
            public readonly long HttpStatusCode;

            public LoadOutcome(Texture2D texture, string stage, string status, long httpStatusCode)
            {
                Texture = texture;
                Stage = stage;
                Status = status;
                HttpStatusCode = httpStatusCode;
            }

            public bool Succeeded { get { return Texture != null && Status == "decoded"; } }
        }

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
            var cardId = card == null ? string.Empty : card.id;
            if (disposed)
            {
                ReportDiagnostic(cardId, "load", "resolver_disposed", "resolver_disposed", 0L, false);
                return null;
            }

            if (card == null)
            {
                ReportDiagnostic(cardId, "load", "card_missing", "card_missing", 0L, false);
                return null;
            }

            if (string.IsNullOrWhiteSpace(card.image_url))
            {
                ReportDiagnostic(cardId, "url", "image_url_missing", "image_url_missing", 0L, false);
                return null;
            }

            string cacheKey;
            var normalizedUrl = card.image_url.Trim();
            if (!TryValidateOfficialCardUrl(normalizedUrl, out cacheKey))
            {
                ReportDiagnostic(cardId, "url", "official_url_rejected", "official_url_rejected", 0L, false);
                return null;
            }

            if (cancellationToken.IsCancellationRequested)
            {
                ReportDiagnostic(cardId, "load", "cancelled", "cancelled", 0L, false);
                return null;
            }

            var cached = cache.TryAcquire(cacheKey);
            if (cached != null)
            {
                ReportDiagnostic(cardId, "load", "cache_hit", string.Empty, 0L, true);
                return cached;
            }

            Task<LoadOutcome> shared;
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
                        if (completed != shared)
                        {
                            ReportDiagnostic(cardId, "load", "cancelled", "cancelled", 0L, false);
                            return null;
                        }
                    }
                }

                var outcome = await shared;
                if (outcome == null)
                {
                    ReportDiagnostic(cardId, "load", "empty_load_result", "empty_load_result", 0L, false);
                    return null;
                }

                if (!outcome.Succeeded)
                {
                    ReportDiagnostic(
                        cardId,
                        outcome.Stage,
                        outcome.Status,
                        outcome.Status,
                        outcome.HttpStatusCode,
                        false);
                    return null;
                }
            }
            catch
            {
                ReportDiagnostic(cardId, "load", "unexpected_load_failure", "unexpected_load_failure", 0L, false);
                return null;
            }

            if (disposed || cancellationToken.IsCancellationRequested)
            {
                ReportDiagnostic(cardId, "load", "cancelled", "cancelled", 0L, false);
                return null;
            }

            var lease = cache.TryAcquire(cacheKey);
            if (lease == null)
            {
                ReportDiagnostic(cardId, "cache", "cache_entry_unavailable", "cache_entry_unavailable", 0L, false);
                return null;
            }

            ReportDiagnostic(cardId, "decode", "decoded", string.Empty, 0L, true);
            return lease;
        }

        public void ReportAssignment(CardRecord card, bool assigned, string errorType = null)
        {
            var cardId = card == null ? string.Empty : card.id;
            var status = assigned ? "assigned" : "assignment_failed";
            var failure = assigned ? string.Empty : string.IsNullOrWhiteSpace(errorType)
                ? "assignment_failed"
                : errorType;

            ReportDiagnostic(cardId, "assignment", status, failure, 0L, assigned);
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

        private async Task ObserveCompletionAsync(string cacheKey, Task<LoadOutcome> shared)
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
                    Task<LoadOutcome> current;
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

        private async Task<LoadOutcome> LoadAndCacheAsync(string cacheKey, string requestUrl)
        {
            await concurrency.WaitAsync();
            try
            {
                if (disposed) return new LoadOutcome(null, "load", "resolver_disposed", 0L);

                using (var request = UnityWebRequestTexture.GetTexture(requestUrl, true))
                {
                    request.timeout = timeoutSeconds;
                    request.SetRequestHeader("Accept", "image/*");

                    var operation = request.SendWebRequest();
                    while (!operation.isDone)
                    {
                        if (request.downloadedBytes > (ulong)maxDownloadBytes)
                        {
                            request.Abort();
                            return new LoadOutcome(null, "load", "download_too_large", request.responseCode);
                        }

                        await Task.Yield();
                    }

                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        var status = request.responseCode >= 400L ? "http_error" : "transport_error";
                        return new LoadOutcome(null, "load", status, request.responseCode);
                    }

                    if (request.downloadedBytes > (ulong)maxDownloadBytes)
                    {
                        return new LoadOutcome(null, "load", "download_too_large", request.responseCode);
                    }

                    var responseLength = request.GetResponseHeader("Content-Length");
                    if (!string.IsNullOrWhiteSpace(responseLength))
                    {
                        long declaredLength;
                        if (long.TryParse(responseLength, out declaredLength) &&
                            declaredLength > maxDownloadBytes)
                        {
                            return new LoadOutcome(null, "load", "declared_download_too_large", request.responseCode);
                        }
                    }

                    var contentType = request.GetResponseHeader("Content-Type");
                    if (string.IsNullOrWhiteSpace(contentType) ||
                        !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    {
                        return new LoadOutcome(null, "load", "invalid_content_type", request.responseCode);
                    }

                    Texture2D texture;
                    try
                    {
                        texture = DownloadHandlerTexture.GetContent(request);
                    }
                    catch
                    {
                        return new LoadOutcome(null, "decode", "decode_failed", request.responseCode);
                    }

                    if (texture == null)
                    {
                        return new LoadOutcome(null, "decode", "decode_failed", request.responseCode);
                    }

                    if (texture.width <= 0 ||
                        texture.height <= 0 ||
                        texture.width > maxDimension ||
                        texture.height > maxDimension)
                    {
                        UnityEngine.Object.Destroy(texture);
                        return new LoadOutcome(null, "decode", "dimensions_rejected", request.responseCode);
                    }

                    texture.wrapMode = TextureWrapMode.Clamp;
                    texture.filterMode = FilterMode.Bilinear;
                    texture.anisoLevel = 1;

                    if (!cache.Store(cacheKey, texture))
                    {
                        UnityEngine.Object.Destroy(texture);
                        return new LoadOutcome(null, "cache", "cache_store_rejected", request.responseCode);
                    }

                    return new LoadOutcome(texture, "decode", "decoded", request.responseCode);
                }
            }
            finally
            {
                concurrency.Release();
            }
        }

        private void ReportDiagnostic(
            string cardId,
            string stage,
            string status,
            string errorType,
            long httpStatusCode,
            bool succeeded)
        {
            var diagnostic = new VexforgeCardArtDiagnostic(
                cardId,
                stage,
                status,
                errorType,
                httpStatusCode);
            var handlers = Diagnostic;

            if (handlers != null)
            {
                foreach (var callback in handlers.GetInvocationList())
                {
                    try
                    {
                        var handler = (Action<VexforgeCardArtDiagnostic>)callback;
                        handler(diagnostic);
                    }
                    catch
                    {
                        Debug.LogWarning("VEXFORGE card-art diagnostic listener failed.");
                    }
                }
            }

            if (!succeeded)
            {
                Debug.LogWarning(
                    "VEXFORGE card-art diagnostic: card_id=" + diagnostic.CardId +
                    " stage=" + diagnostic.Stage +
                    " status=" + diagnostic.Status +
                    " error_type=" + diagnostic.ErrorType +
                    " http_status=" + diagnostic.HttpStatusCode);
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
