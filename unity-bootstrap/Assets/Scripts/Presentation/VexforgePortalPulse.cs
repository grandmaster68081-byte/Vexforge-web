using UnityEngine;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Lightweight portal motion language for the alpha world. No gameplay authority.
    /// </summary>
    public sealed class VexforgePortalPulse : MonoBehaviour
    {
        private Transform rune;
        private Transform monolith;
        private Vector3 runeBaseScale = Vector3.one;
        private float phase;

        public void Configure(Transform runeTransform, Transform monolithTransform)
        {
            rune = runeTransform;
            monolith = monolithTransform;
            phase = Mathf.Abs(GetInstanceID()) * 0.0137f;
            if (rune != null) runeBaseScale = rune.localScale;
        }

        private void Update()
        {
            var time = Time.unscaledTime + phase;
            if (rune != null)
            {
                var pulse = 1f + Mathf.Sin(time * 1.7f) * 0.045f;
                rune.localScale = runeBaseScale * pulse;
                rune.Rotate(0f, 18f * Time.unscaledDeltaTime, 0f, Space.Self);
            }
            if (monolith != null)
            {
                monolith.localRotation = Quaternion.Euler(
                    0f,
                    time * 7f,
                    Mathf.Sin(time * 0.8f) * 3f);
            }
        }
    }
}
