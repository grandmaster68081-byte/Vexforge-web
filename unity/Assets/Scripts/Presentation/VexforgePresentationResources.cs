using UnityEngine;

namespace Vexforge.Presentation
{
    [CreateAssetMenu(
        menuName = "VEXFORGE/Presentation Resources",
        fileName = "VexforgePresentationResources")]
    public sealed class VexforgePresentationResources : ScriptableObject
    {
        [SerializeField] private Material cardBodyMaterial;
        [SerializeField] private Material cardArtMaterial;
        [SerializeField] private Material cardFrameMaterial;
        [SerializeField] private Material worldSurfaceMaterial;
        [SerializeField] private Material worldAccentMaterial;

        public Material CardBodyMaterial { get { return cardBodyMaterial; } }
        public Material CardArtMaterial { get { return cardArtMaterial; } }
        public Material CardFrameMaterial { get { return cardFrameMaterial; } }
        public Material WorldSurfaceMaterial { get { return worldSurfaceMaterial; } }
        public Material WorldAccentMaterial { get { return worldAccentMaterial; } }

        public bool IsComplete
        {
            get
            {
                return cardBodyMaterial != null &&
                       cardArtMaterial != null &&
                       cardFrameMaterial != null &&
                       worldSurfaceMaterial != null &&
                       worldAccentMaterial != null;
            }
        }

        public static VexforgePresentationResources LoadRuntime()
        {
            return Resources.Load<VexforgePresentationResources>(
                "Vexforge/VexforgePresentationResources");
        }
    }
}
