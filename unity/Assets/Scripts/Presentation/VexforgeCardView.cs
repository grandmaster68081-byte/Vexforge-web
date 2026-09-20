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
        private Mesh frameMesh;
        private Material artMaterialInstance;
        private VexforgeCardArtResolver resolver;
        private VexforgeTextureLruCache.TextureLease lease;
        private CancellationTokenSource bindCancellation;
        private int bindGeneration;
        private CardArtMode artMode = CardArtMode.FullCardArtwork;
        private bool initialized;

        private static readonly Vector2 CardSize = new Vector2(1.65f, 2.30f);
        private static readonly Vector2 IllustrationSize = new Vector2(1.50f, 1.72f);

        public static VexforgeCardView CreateRuntime(Transform parent)
        {
            var root = GameObject.CreatePrimitive(PrimitiveType.Cube);
            root.name = "VexforgeCardView";
            root.transform.SetParent(parent, false);
            root.transform.localScale = new Vector3(CardSize.x, CardSize.y, 0.08f);
            var rootCollider = root.GetComponent<Collider>();
            if (rootCollider == null) rootCollider = root.AddComponent<BoxCollider>();
            rootCollider.isTrigger = false;

            var view = root.AddComponent<VexforgeCardView>();
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
            if (!initialized) InitializeVisuals();
            resolver = artResolver;
            BoundCard = card;
            artMode = presentationMode;
            var generation = ++bindGeneration;

            CancelBind();
            ReleaseLease();

            ApplyTexture(null);
            SetArtMode(presentationMode);

            if (card != null && resolver != null)
            {
                _ = BindArtAsync(card, generation, externalCancellation);
            }
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
            gameObject.SetActive(false);
        }

        private async Task BindArtAsync(
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
                return;
            }

            lease = nextLease;
            ApplyTexture(lease == null ? null : lease.Texture);
        }

        private void InitializeVisuals()
        {
            if (initialized) return;
            initialized = true;

            bodyRenderer = GetComponent<Renderer>();

            var artObject = GameObject.CreatePrimitive(PrimitiveType.Quad);
            artObject.name = "OfficialCardArt";
            artObject.transform.SetParent(transform, false);
            artObject.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            artRenderer = artObject.GetComponent<Renderer>();
            RemoveCollider(artObject);

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

        private void ApplyTexture(Texture2D texture)
        {
            if (artMaterialInstance == null) return;

            if (artMaterialInstance.HasProperty("_BaseMap"))
            {
                artMaterialInstance.SetTexture("_BaseMap", texture);
            }

            if (artMaterialInstance.HasProperty("_BaseColor"))
            {
                artMaterialInstance.SetColor(
                    "_BaseColor",
                    texture == null
                        ? new Color(0.04f, 0.04f, 0.05f, 1f)
                        : Color.white);
            }
        }

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

        private static void RemoveCollider(GameObject target)
        {
            var collider = target.GetComponent<Collider>();
            if (collider != null) Object.Destroy(collider);
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

            if (frameMesh != null)
            {
                Object.Destroy(frameMesh);
            }
        }
    }
}
