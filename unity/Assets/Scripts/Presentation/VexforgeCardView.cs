using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    public enum CardArtMode
    {
        FullCardArtwork,
        IllustrationOnly
    }

    /// <summary>
    /// Reusable world-space card. Presentation mode is explicit and never inferred from gameplay fields.
    /// </summary>
    public sealed class VexforgeCardView : MonoBehaviour
    {
        private Renderer bodyRenderer;
        private Renderer artRenderer;
        private Renderer frameRenderer;
        private Mesh bodyMesh;
        private Mesh artMesh;
        private Mesh frameMesh;
        private Material artMaterialInstance;
        private Texture2D unavailableArtTexture;
        private TextMesh artStatusLabel;
        private VexforgeCardArtResolver resolver;
        private VexforgeTextureLruCache.TextureLease lease;
        private CancellationTokenSource bindCancellation;
        private int bindGeneration;
        private CardArtMode artMode = CardArtMode.FullCardArtwork;
        private bool initialized;

        private static readonly Vector2 CardSize = new Vector2(1.65f, 2.30f);
        private static readonly Vector2 IllustrationSize = new Vector2(1.50f, 1.72f);
        private const float CardDepth = 0.08f;
        private const string UnavailableArtResourcesKey =
            "VexforgeTier1/Art/VF_CARD_FALLBACK_NEUTRAL";
        private static readonly Color UnavailableArtTint = new Color(0.12f, 0.34f, 0.44f, 1f);

        public static VexforgeCardView CreateRuntime(Transform parent)
        {
            var root = new GameObject("VexforgeCardView");
            root.name = "VexforgeCardView";
            root.transform.SetParent(parent, false);
            root.transform.localScale = Vector3.one;

            var bodyFilter = root.AddComponent<MeshFilter>();
            root.AddComponent<MeshRenderer>();
            var rootCollider = root.AddComponent<BoxCollider>();
            rootCollider.size = new Vector3(CardSize.x, CardSize.y, CardDepth);
            rootCollider.isTrigger = false;

            var view = root.AddComponent<VexforgeCardView>();
            view.bodyMesh = BuildCardBodyMesh();
            bodyFilter.sharedMesh = view.bodyMesh;
            view.InitializeVisuals();
            return view;
        }

        public void SetArtMode(CardArtMode mode)
        {
            artMode = mode;

            if (artRenderer != null)
            {
                var target = mode == CardArtMode.FullCardArtwork ? CardSize : IllustrationSize;
                var y = mode == CardArtMode.FullCardArtwork ? 0f : 0.18f;
                artRenderer.transform.localPosition = new Vector3(0f, y, -0.061f);
                artRenderer.transform.localScale = new Vector3(target.x, target.y, 1f);
            }

            if (frameRenderer != null)
            {
                frameRenderer.gameObject.SetActive(mode == CardArtMode.IllustrationOnly);
            }
        }

        public CardRecord BoundCard { get; private set; }

        public void Bind(
            CardRecord card,
            PlayerCardRecord ownership,
            bool selected,
            bool activeInBattle,
            bool locked,
            VexforgeCardArtResolver artResolver,
            CardArtMode presentationMode,
            CancellationToken externalCancellation = default(CancellationToken))
        {
            _ = BindAsync(
                card,
                ownership,
                selected,
                activeInBattle,
                locked,
                artResolver,
                presentationMode,
                externalCancellation);
        }

        public async Task<bool> BindAsync(
            CardRecord card,
            PlayerCardRecord ownership,
            bool selected,
            bool activeInBattle,
            bool locked,
            VexforgeCardArtResolver artResolver,
            CardArtMode presentationMode,
            CancellationToken externalCancellation = default(CancellationToken))
        {
            if (!initialized) InitializeVisuals();
            resolver = artResolver;
            BoundCard = card;
            artMode = presentationMode;
            var generation = ++bindGeneration;

            CancelBind();
            ReleaseLease();

            ApplyTexture(null);
            SetArtMode(presentationMode);
            SetArtStatus(card == null || resolver == null ? "ARTE NO DISPONIBLE" : "CARGANDO ARTE", VexforgeCardArtStatusColor);

            if (card == null || resolver == null)
            {
                return false;
            }

            return await BindArtAsync(card, generation, externalCancellation);
        }

        public void Bind(
            CardRecord card,
            PlayerCardRecord ownership,
            bool selected,
            bool activeInBattle,
            bool locked,
            VexforgeCardArtResolver artResolver,
            CancellationToken externalCancellation = default(CancellationToken))
        {
            Bind(
                card,
                ownership,
                selected,
                activeInBattle,
                locked,
                artResolver,
                CardArtMode.FullCardArtwork,
                externalCancellation);
        }

        public void ResetForPool()
        {
            bindGeneration++;
            CancelBind();
            ReleaseLease();
            resolver = null;
            BoundCard = null;
            ApplyTexture(null);
            SetArtMode(CardArtMode.FullCardArtwork);
            SetArtStatus(null, Color.white);
            gameObject.SetActive(false);
        }

        private async Task<bool> BindArtAsync(
            CardRecord card,
            int generation,
            CancellationToken externalCancellation)
        {
            VexforgeTextureLruCache.TextureLease nextLease = null;
            CancellationTokenSource localCancellation = null;

            try
            {
                localCancellation = CancellationTokenSource.CreateLinkedTokenSource(externalCancellation);
                bindCancellation = localCancellation;

                nextLease = await resolver.AcquireAsync(card, localCancellation.Token);
            }
            catch
            {
                nextLease = null;
            }
            finally
            {
                if (ReferenceEquals(bindCancellation, localCancellation))
                {
                    bindCancellation = null;
                }

                if (localCancellation != null)
                {
                    localCancellation.Dispose();
                }
            }

            if (generation != bindGeneration || !isActiveAndEnabled)
            {
                if (nextLease != null) nextLease.Dispose();
                return false;
            }

            if (nextLease == null)
            {
                SetArtStatus("ARTE NO\nDISPONIBLE", VexforgeCardArtStatusColor);
                resolver?.ReportAssignment(card, false, "texture_unavailable");
                return false;
            }

            lease = nextLease;
            if (ApplyTexture(lease.Texture))
            {
                SetArtStatus(null, Color.white);
                resolver?.ReportAssignment(card, true);
                return true;
            }

            SetArtStatus("ARTE NO\nDISPONIBLE", VexforgeCardArtStatusColor);
            resolver?.ReportAssignment(card, false, "renderer_material_unavailable");
            return false;
        }

        private void InitializeVisuals()
        {
            if (initialized) return;
            initialized = true;

            bodyRenderer = GetComponent<Renderer>();
            unavailableArtTexture = Resources.Load<Texture2D>(UnavailableArtResourcesKey);

            var artObject = new GameObject("OfficialCardArt");
            artObject.name = "OfficialCardArt";
            artObject.transform.SetParent(transform, false);
            artObject.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            var artFilter = artObject.AddComponent<MeshFilter>();
            artRenderer = artObject.AddComponent<MeshRenderer>();
            artMesh = BuildArtworkQuadMesh();
            artFilter.sharedMesh = artMesh;

            var frameObject = new GameObject("IllustrationFrame");
            frameObject.transform.SetParent(transform, false);
            frameRenderer = frameObject.AddComponent<MeshRenderer>();
            var meshFilter = frameObject.AddComponent<MeshFilter>();
            frameMesh = BuildFrameMesh();
            meshFilter.sharedMesh = frameMesh;

            var resources = VexforgePresentationResources.LoadRuntime();
            if (resources == null ||
                resources.CardBodyMaterial == null ||
                resources.CardArtMaterial == null ||
                resources.CardFrameMaterial == null)
            {
                Debug.LogError(
                    "VEXFORGE Presentation resources are missing. Run VEXFORGE/Presentation/Ensure R5 Assets.",
                    this);
                return;
            }

            bodyRenderer.sharedMaterial = resources.CardBodyMaterial;
            artMaterialInstance = new Material(resources.CardArtMaterial);
            artRenderer.sharedMaterial = artMaterialInstance;
            frameRenderer.sharedMaterial = resources.CardFrameMaterial;

            ApplyTexture(null);
            SetArtMode(artMode);
        }

        private bool ApplyTexture(Texture2D texture)
        {
            if (artMaterialInstance == null) return false;

            var displayedTexture = texture != null ? texture : unavailableArtTexture;
            var hasTextureProperty = false;
            if (artMaterialInstance.HasProperty("_BaseMap"))
            {
                artMaterialInstance.SetTexture("_BaseMap", displayedTexture);
                hasTextureProperty = true;
            }

            if (artMaterialInstance.HasProperty("_MainTex"))
            {
                artMaterialInstance.SetTexture("_MainTex", displayedTexture);
                hasTextureProperty = true;
            }

            if (artMaterialInstance.HasProperty("_BaseColor"))
            {
                artMaterialInstance.SetColor(
                    "_BaseColor",
                    displayedTexture == null ? UnavailableArtTint : Color.white);
            }
            else if (artMaterialInstance.HasProperty("_Color"))
            {
                artMaterialInstance.SetColor(
                    "_Color",
                    displayedTexture == null ? UnavailableArtTint : Color.white);
            }

            // The fallback is an explicit loading/error surface, never a successful
            // substitute for the official Supabase card image.
            return texture != null && hasTextureProperty;
        }

        private void SetArtStatus(string message, Color color)
        {
            if (string.IsNullOrEmpty(message))
            {
                if (artStatusLabel != null) artStatusLabel.gameObject.SetActive(false);
                return;
            }

            if (artStatusLabel == null)
            {
                var statusObject = new GameObject("CardArtStatus");
                statusObject.transform.SetParent(transform, false);
                statusObject.transform.localPosition = new Vector3(0f, -0.78f, -0.074f);
                statusObject.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
                artStatusLabel = statusObject.AddComponent<TextMesh>();
                artStatusLabel.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
                artStatusLabel.anchor = TextAnchor.MiddleCenter;
                artStatusLabel.alignment = TextAlignment.Center;
                artStatusLabel.characterSize = 0.038f;
                artStatusLabel.fontSize = 32;
                artStatusLabel.richText = false;
                var labelRenderer = statusObject.GetComponent<MeshRenderer>();
                if (labelRenderer != null) labelRenderer.sortingOrder = 20;
            }

            artStatusLabel.text = message;
            artStatusLabel.color = color;
            artStatusLabel.gameObject.SetActive(true);
        }

        private static readonly Color VexforgeCardArtStatusColor = new Color(0.94f, 0.70f, 0.32f, 1f);

        private void ReleaseLease()
        {
            if (lease == null) return;
            lease.Dispose();
            lease = null;
        }

        private void CancelBind()
        {
            var current = bindCancellation;
            bindCancellation = null;
            if (current == null) return;
            current.Cancel();
            current.Dispose();
        }

        private static Mesh BuildCardBodyMesh()
        {
            const int segmentsPerCorner = 6;
            const float outerCornerRadius = 0.13f;
            const float bevelWidth = 0.028f;
            const float bevelDepth = 0.018f;

            var insetOutline = BuildRoundedRectOutline(
                CardSize.x - bevelWidth * 2f,
                CardSize.y - bevelWidth * 2f,
                outerCornerRadius - bevelWidth,
                segmentsPerCorner);
            var outerOutline = BuildRoundedRectOutline(
                CardSize.x,
                CardSize.y,
                outerCornerRadius,
                segmentsPerCorner);

            var vertices = new List<Vector3>(insetOutline.Length * 4 + 2);
            var triangles = new List<int>(insetOutline.Length * 24);
            var frontFace = AddRing(vertices, insetOutline, -CardDepth * 0.5f);
            var frontBevel = AddRing(vertices, outerOutline, -CardDepth * 0.5f + bevelDepth);
            var backBevel = AddRing(vertices, outerOutline, CardDepth * 0.5f - bevelDepth);
            var backFace = AddRing(vertices, insetOutline, CardDepth * 0.5f);

            var frontCenter = vertices.Count;
            vertices.Add(new Vector3(0f, 0f, -CardDepth * 0.5f));
            var backCenter = vertices.Count;
            vertices.Add(new Vector3(0f, 0f, CardDepth * 0.5f));

            AddFaceFan(triangles, frontCenter, frontFace, insetOutline.Length, false);
            AddFaceFan(triangles, backCenter, backFace, insetOutline.Length, true);
            ConnectRings(vertices, triangles, frontFace, frontBevel, insetOutline.Length, -1f);
            ConnectRings(vertices, triangles, frontBevel, backBevel, insetOutline.Length, 0f);
            ConnectRings(vertices, triangles, backBevel, backFace, insetOutline.Length, 1f);

            var mesh = new Mesh { name = "VexforgeBeveledCardBody" };
            mesh.SetVertices(vertices);
            mesh.SetTriangles(triangles, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static Vector2[] BuildRoundedRectOutline(
            float width,
            float height,
            float radius,
            int segmentsPerCorner)
        {
            var halfWidth = width * 0.5f;
            var halfHeight = height * 0.5f;
            var clampedRadius = Mathf.Clamp(radius, 0.001f, Mathf.Min(halfWidth, halfHeight));
            var centers = new[]
            {
                new Vector2(halfWidth - clampedRadius, halfHeight - clampedRadius),
                new Vector2(-halfWidth + clampedRadius, halfHeight - clampedRadius),
                new Vector2(-halfWidth + clampedRadius, -halfHeight + clampedRadius),
                new Vector2(halfWidth - clampedRadius, -halfHeight + clampedRadius),
            };
            var points = new Vector2[segmentsPerCorner * 4];
            var outputIndex = 0;

            for (var corner = 0; corner < centers.Length; corner++)
            {
                var startAngle = corner * 90f;
                for (var segment = 0; segment < segmentsPerCorner; segment++)
                {
                    var angle = (startAngle + segment * (90f / segmentsPerCorner)) * Mathf.Deg2Rad;
                    points[outputIndex++] = centers[corner] +
                        new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * clampedRadius;
                }
            }

            return points;
        }

        private static int AddRing(List<Vector3> vertices, Vector2[] outline, float z)
        {
            var start = vertices.Count;
            foreach (var point in outline) vertices.Add(new Vector3(point.x, point.y, z));
            return start;
        }

        private static void AddFaceFan(
            List<int> triangles,
            int center,
            int ring,
            int count,
            bool facesPositiveZ)
        {
            for (var index = 0; index < count; index++)
            {
                var current = ring + index;
                var next = ring + (index + 1) % count;
                if (facesPositiveZ)
                {
                    triangles.Add(center);
                    triangles.Add(current);
                    triangles.Add(next);
                }
                else
                {
                    triangles.Add(center);
                    triangles.Add(next);
                    triangles.Add(current);
                }
            }
        }

        private static void ConnectRings(
            List<Vector3> vertices,
            List<int> triangles,
            int firstRing,
            int secondRing,
            int count,
            float faceDirectionZ)
        {
            for (var index = 0; index < count; index++)
            {
                var next = (index + 1) % count;
                var a = firstRing + index;
                var b = firstRing + next;
                var c = secondRing + next;
                var d = secondRing + index;
                var midpoint = (vertices[a] + vertices[b] + vertices[c] + vertices[d]) * 0.25f;
                var outward = new Vector3(midpoint.x, midpoint.y, faceDirectionZ);
                AddOrientedTriangle(vertices, triangles, a, b, c, outward);
                AddOrientedTriangle(vertices, triangles, a, c, d, outward);
            }
        }

        private static void AddOrientedTriangle(
            List<Vector3> vertices,
            List<int> triangles,
            int a,
            int b,
            int c,
            Vector3 desiredNormal)
        {
            var normal = Vector3.Cross(vertices[b] - vertices[a], vertices[c] - vertices[a]);
            if (Vector3.Dot(normal, desiredNormal) < 0f)
            {
                var swap = b;
                b = c;
                c = swap;
            }

            triangles.Add(a);
            triangles.Add(b);
            triangles.Add(c);
        }

        private static Mesh BuildArtworkQuadMesh()
        {
            var mesh = new Mesh { name = "VexforgeOfficialCardArtworkSurface" };
            mesh.vertices = new[]
            {
                new Vector3(-0.5f, -0.5f, 0f),
                new Vector3(0.5f, -0.5f, 0f),
                new Vector3(0.5f, 0.5f, 0f),
                new Vector3(-0.5f, 0.5f, 0f),
            };
            mesh.uv = new[]
            {
                new Vector2(0f, 0f),
                new Vector2(1f, 0f),
                new Vector2(1f, 1f),
                new Vector2(0f, 1f),
            };
            mesh.triangles = new[] { 0, 1, 2, 0, 2, 3 };
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static Mesh BuildFrameMesh()
        {
            const float outerHalfX = 0.79f;
            const float outerHalfY = 0.90f;
            const float innerHalfX = 0.72f;
            const float innerHalfY = 0.82f;
            const float z = -0.064f;

            var mesh = new Mesh();
            mesh.name = "VexforgeIllustrationFrame";

            var vertices = new Vector3[16];
            var triangles = new int[24];

            AddStrip(vertices, triangles, 0,
                new Vector2(-outerHalfX, innerHalfY),
                new Vector2(outerHalfX, outerHalfY), z, 0);      // top
            AddStrip(vertices, triangles, 4,
                new Vector2(-outerHalfX, -outerHalfY),
                new Vector2(outerHalfX, -innerHalfY), z, 6);    // bottom
            AddStrip(vertices, triangles, 8,
                new Vector2(-outerHalfX, -innerHalfY),
                new Vector2(-innerHalfX, innerHalfY), z, 12);   // left
            AddStrip(vertices, triangles, 12,
                new Vector2(innerHalfX, -innerHalfY),
                new Vector2(outerHalfX, innerHalfY), z, 18);    // right

            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void AddStrip(
            Vector3[] vertices,
            int[] triangles,
            int vertexOffset,
            Vector2 min,
            Vector2 max,
            float z,
            int triangleOffset)
        {
            vertices[vertexOffset + 0] = new Vector3(min.x, min.y, z);
            vertices[vertexOffset + 1] = new Vector3(max.x, min.y, z);
            vertices[vertexOffset + 2] = new Vector3(max.x, max.y, z);
            vertices[vertexOffset + 3] = new Vector3(min.x, max.y, z);

            // Front face normal points toward the camera (-Z).
            triangles[triangleOffset + 0] = vertexOffset + 0;
            triangles[triangleOffset + 1] = vertexOffset + 2;
            triangles[triangleOffset + 2] = vertexOffset + 1;
            triangles[triangleOffset + 3] = vertexOffset + 0;
            triangles[triangleOffset + 4] = vertexOffset + 3;
            triangles[triangleOffset + 5] = vertexOffset + 2;
        }

        private void OnDestroy()
        {
            CancelBind();
            ReleaseLease();

            if (artMaterialInstance != null)
            {
                Object.Destroy(artMaterialInstance);
            }

            if (artMesh != null)
            {
                Object.Destroy(artMesh);
            }

            if (bodyMesh != null)
            {
                Object.Destroy(bodyMesh);
            }

            if (frameMesh != null)
            {
                Object.Destroy(frameMesh);
            }
        }
    }
}
