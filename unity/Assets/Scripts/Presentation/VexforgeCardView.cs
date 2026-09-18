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

    public sealed class VexforgeCardView : MonoBehaviour
    {
        private Renderer bodyRenderer;
        private Renderer artRenderer;
        private Renderer frameRenderer;
        private TextMesh titleText;
        private TextMesh stateText;
        private MaterialPropertyBlock bodyBlock;
        private MaterialPropertyBlock artBlock;
        private MaterialPropertyBlock frameBlock;
        private VexforgeCardArtResolver resolver;
        private VexforgeTextureLruCache.TextureLease lease;
        private int bindGeneration;

        public static VexforgeCardView CreateRuntime(Transform parent)
        {
            var root = GameObject.CreatePrimitive(PrimitiveType.Cube);
            root.name = "VexforgeCardView";
            root.transform.SetParent(parent, false);
            root.transform.localScale = new Vector3(1.8f, 2.5f, 0.12f);
            var view = root.AddComponent<VexforgeCardView>();
            view.InitializeVisuals();
            return view;
        }

        public static string ValueOr(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        public void Bind(
            CardRecord card,
            PlayerCardRecord ownership,
            bool selected,
            bool active,
            bool locked,
            VexforgeCardArtResolver artResolver)
        {
            resolver = artResolver;
            var generation = ++bindGeneration;
            ReleaseLease();
            ApplyCardMetadata(card, ownership, selected, active, locked);
            _ = BindArtAsync(card, generation);
        }

        public void ResetForPool()
        {
            bindGeneration++;
            ReleaseLease();
            ApplyTexture(null);
            if (titleText != null) titleText.text = string.Empty;
            if (stateText != null) stateText.text = string.Empty;
            gameObject.SetActive(false);
        }

        private async Task BindArtAsync(CardRecord card, int generation)
        {
            if (resolver == null || card == null) return;
            var nextLease = await resolver.AcquireAsync(card);
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
            bodyRenderer = GetComponent<Renderer>();
            bodyBlock = new MaterialPropertyBlock();
            artBlock = new MaterialPropertyBlock();
            frameBlock = new MaterialPropertyBlock();

            var art = GameObject.CreatePrimitive(PrimitiveType.Quad);
            art.name = "OfficialCardArt";
            art.transform.SetParent(transform, false);
            art.transform.localPosition = new Vector3(0f, 0.18f, -0.071f);
            art.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            art.transform.localScale = new Vector3(1.46f, 1.48f, 1f);
            artRenderer = art.GetComponent<Renderer>();
            RemoveCollider(art);

            var frame = GameObject.CreatePrimitive(PrimitiveType.Quad);
            frame.name = "IllustrationFrame";
            frame.transform.SetParent(transform, false);
            frame.transform.localPosition = new Vector3(0f, 0.18f, -0.074f);
            frame.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            frame.transform.localScale = new Vector3(1.58f, 1.6f, 1f);
            frameRenderer = frame.GetComponent<Renderer>();
            RemoveCollider(frame);

            titleText = CreateText("CardTitle", new Vector3(0f, -0.76f, -0.09f), 0.07f);
            stateText = CreateText("CardState", new Vector3(0f, -1.03f, -0.09f), 0.045f);
            bodyBlock.SetColor("_Color", new Color(0.11f, 0.075f, 0.055f, 1f));
            bodyRenderer.SetPropertyBlock(bodyBlock);
            frameBlock.SetColor("_Color", new Color(0.72f, 0.48f, 0.12f, 1f));
            frameRenderer.SetPropertyBlock(frameBlock);
            ApplyTexture(null);
        }

        private void ApplyCardMetadata(CardRecord card, PlayerCardRecord ownership, bool selected, bool active, bool locked)
        {
            if (card == null) return;
            if (titleText != null) titleText.text = ValueOr(card.name, "NOMBRE NO REPORTADO");
            if (stateText != null)
            {
                stateText.text = locked || (ownership != null && ownership.locked)
                    ? "BLOQUEADA"
                    : active ? "ACTIVA" : selected ? "SELECCIONADA" : ownership == null ? "CATALOGO" : "POSESION " + ownership.quantity;
            }

            var mode = string.IsNullOrWhiteSpace(card.card_tier) ||
                !card.card_tier.ToLowerInvariant().Contains("illustration")
                ? CardArtMode.FullCardArtwork
                : CardArtMode.IllustrationOnly;
            if (frameRenderer != null) frameRenderer.gameObject.SetActive(mode == CardArtMode.IllustrationOnly);
        }

        private void ApplyTexture(Texture2D texture)
        {
            if (artRenderer == null) return;
            artRenderer.GetPropertyBlock(artBlock);
            artBlock.SetTexture("_MainTex", texture);
            artBlock.SetColor("_Color", texture == null ? new Color(0.06f, 0.06f, 0.07f, 1f) : Color.white);
            artRenderer.SetPropertyBlock(artBlock);
        }

        private TextMesh CreateText(string name, Vector3 position, float characterSize)
        {
            var textObject = new GameObject(name);
            textObject.transform.SetParent(transform, false);
            textObject.transform.localPosition = position;
            textObject.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
            var text = textObject.AddComponent<TextMesh>();
            text.anchor = TextAnchor.MiddleCenter;
            text.alignment = TextAlignment.Center;
            text.characterSize = characterSize;
            text.fontSize = 48;
            text.color = new Color(0.9f, 0.84f, 0.72f, 1f);
            return text;
        }

        private void ReleaseLease()
        {
            if (lease == null) return;
            lease.Dispose();
            lease = null;
        }

        private static void RemoveCollider(GameObject target)
        {
            var collider = target.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
        }

        private void OnDestroy()
        {
            ReleaseLease();
        }
    }
}