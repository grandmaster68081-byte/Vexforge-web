using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Owns the single active Nexus presentation root and its shared diegetic input seam.
    /// </summary>
    public sealed class VexforgeNexusStage : MonoBehaviour
    {
        private VexforgeNexusStageState state = VexforgeNexusStageState.Uninitialized;

        public VexforgeDiegeticInputRouter InputRouter { get; private set; }
        public NexusPresentationRoot PresentationRoot { get; private set; }

        public void Initialize(VexforgeApp app)
        {
            if (state != VexforgeNexusStageState.Uninitialized) return;
            if (app == null) throw new System.ArgumentNullException(nameof(app));

            var world = new GameObject("NexusPresentationRoot");
            world.transform.SetParent(transform, false);

            PresentationRoot = world.AddComponent<NexusPresentationRoot>();
            PresentationRoot.Initialize(app.Navigation);

            InputRouter = world.AddComponent<VexforgeDiegeticInputRouter>();
            InputRouter.Initialize(Camera.main);

            state = VexforgeNexusStageState.Ready;
        }

        public void SetNexusVisible(bool visible)
        {
            if (state == VexforgeNexusStageState.Uninitialized) return;

            gameObject.SetActive(visible);

            if (InputRouter != null)
            {
                InputRouter.enabled = visible;
            }
        }

        private enum VexforgeNexusStageState
        {
            Uninitialized,
            Ready
        }
    }
}
