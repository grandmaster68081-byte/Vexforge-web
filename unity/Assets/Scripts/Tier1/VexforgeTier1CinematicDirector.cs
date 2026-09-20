using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1CinematicDirector : MonoBehaviour
    {
        private Camera cameraTarget;
        private Vector3 homePosition;
        private Quaternion homeRotation;
        private BattlePresentationDirector director;
        private Coroutine motion;

        public void Initialize(Camera target)
        {
            cameraTarget = target != null ? target : Camera.main;
            if (cameraTarget == null) return;
            homePosition = cameraTarget.transform.position;
            homeRotation = cameraTarget.transform.rotation;
        }

        public void Bind(BattlePresentationDirector canonical)
        {
            if (director != null) director.EventPresented -= OnEvent;
            director = canonical;
            if (director != null) director.EventPresented += OnEvent;
        }

        private void OnEvent(BattleEvent evt)
        {
            if (evt == null || cameraTarget == null) return;
            var kind = (evt.event_type ?? string.Empty).ToUpperInvariant();
            if (kind.Contains("BOSS") || kind.Contains("RAID")) FocusReveal(.42f);
            else if (kind.Contains("ATTACK") || kind.Contains("STRIKE") || kind.Contains("DAMAGE")) Impact(.045f, .12f);
            else if (kind.Contains("VICTORY") || kind.Contains("DEFEAT") || kind.Contains("MATCH_END")) FinishReveal(kind.Contains("VICTORY"));
        }

        private void FocusReveal(float pull)
        {
            var p = homePosition + cameraTarget.transform.forward * pull + Vector3.up * .26f;
            var r = Quaternion.LookRotation((homePosition + cameraTarget.transform.forward * 3.1f) - p, Vector3.up);
            MoveTo(p, r, .28f);
        }

        private void FinishReveal(bool victory)
        {
            var p = homePosition + Vector3.up * (victory ? 3.6f : 2.6f) - cameraTarget.transform.forward * (victory ? 7.2f : 6.6f);
            var r = Quaternion.LookRotation((homePosition + cameraTarget.transform.forward * 2.4f) - p, Vector3.up);
            MoveTo(p, r, .52f);
        }

        public void ReturnHome(float seconds = .34f) { MoveTo(homePosition, homeRotation, seconds); }

        public void Impact(float amplitude = .08f, float duration = .16f)
        {
            if (cameraTarget == null) return;
            if (motion != null) StopCoroutine(motion);
            motion = StartCoroutine(ImpactRoutine(amplitude, duration));
        }

        private void MoveTo(Vector3 position, Quaternion rotation, float seconds)
        {
            if (cameraTarget == null) return;
            if (motion != null) StopCoroutine(motion);
            motion = StartCoroutine(MoveRoutine(position, rotation, Mathf.Max(.01f, seconds)));
        }

        private IEnumerator MoveRoutine(Vector3 position, Quaternion rotation, float seconds)
        {
            var p0 = cameraTarget.transform.position; var r0 = cameraTarget.transform.rotation; var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / seconds;
                var n = Mathf.SmoothStep(0f,1f,Mathf.Clamp01(t));
                cameraTarget.transform.position = Vector3.Lerp(p0, position, n);
                cameraTarget.transform.rotation = Quaternion.Slerp(r0, rotation, n);
                yield return null;
            }
            cameraTarget.transform.position = position;
            cameraTarget.transform.rotation = rotation;
            motion = null;
        }

        private IEnumerator ImpactRoutine(float amplitude, float duration)
        {
            var p0 = cameraTarget.transform.position; var r0 = cameraTarget.transform.rotation; var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / Mathf.Max(.01f, duration);
                var n = Mathf.Clamp01(t); var envelope = 1f - n;
                var noise = new Vector3(Mathf.Sin(n*43f), Mathf.Sin(n*57f), Mathf.Sin(n*71f)) * amplitude * envelope;
                cameraTarget.transform.position = p0 + noise;
                cameraTarget.transform.rotation = r0 * Quaternion.Euler(noise * 5f);
                yield return null;
            }
            cameraTarget.transform.position = p0; cameraTarget.transform.rotation = r0; motion = null;
        }

        private void OnDestroy()
        {
            if (director != null) director.EventPresented -= OnEvent;
            if (motion != null) StopCoroutine(motion);
        }
    }
}
