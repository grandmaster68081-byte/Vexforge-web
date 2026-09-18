using UnityEngine;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    public sealed class VexforgeNexusStage : MonoBehaviour
    {
        private GameObject presentationObject;
        private NexusPresentationRoot presentationRoot;
        private VexforgeDiegeticInputRouter inputRouter;

        public void Initialize(VexforgeApp app)
        {
            if (presentationRoot != null || app == null) return;

            presentationObject = new GameObject("NexusPresentationRoot");
            presentationObject.transform.SetParent(transform, false);
            presentationRoot = presentationObject.AddComponent<NexusPresentationRoot>();
            presentationRoot.Initialize(app.Navigation);

            var fallback = new GameObject("NexusDevelopmentFallback");
            fallback.transform.SetParent(transform, false);
            fallback.AddComponent<NexusDevelopmentFallback>();
            fallback.SetActive(false);

            inputRouter = gameObject.AddComponent<VexforgeDiegeticInputRouter>();
            inputRouter.Initialize(Camera.main);
        }

        public void SetNexusVisible(bool visible)
        {
            if (presentationObject != null) presentationObject.SetActive(visible);
            if (inputRouter != null) inputRouter.enabled = visible;
        }
    }
}