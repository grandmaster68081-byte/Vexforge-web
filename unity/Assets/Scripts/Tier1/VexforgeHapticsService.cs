using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public enum VexforgeHapticCue
    {
        None,
        Selection,
        Impact,
        Success,
        Warning
    }

    /// <summary>
    /// Keeps battle presentation dependent on semantic cues rather than device APIs.
    /// Unity's built-in vibration is used as the optional mobile fallback.
    /// </summary>
    public sealed class VexforgeHapticsService : MonoBehaviour
    {
        private BattlePresentationDirector director;
        private float lastPulseAt = -1f;

        public void Bind(BattlePresentationDirector canonical)
        {
            if (director != null)
                director.EventStarted -= OnEventStarted;
            director = canonical;
            if (director != null)
                director.EventStarted += OnEventStarted;
        }

        public void Play(VexforgeHapticCue cue)
        {
            if (cue == VexforgeHapticCue.None || !Application.isMobilePlatform)
                return;

            var now = Time.unscaledTime;
            if (lastPulseAt >= 0f && now - lastPulseAt < 0.09f)
                return;

            lastPulseAt = now;
            Handheld.Vibrate();
        }

        private void OnEventStarted(BattleEvent battleEvent)
        {
            if (battleEvent == null)
                return;

            var kind = BattlePresentationPolicy.Classify(battleEvent.event_type);
            switch (kind)
            {
                case BattlePresentationKind.Victory:
                    Play(VexforgeHapticCue.Success);
                    break;
                case BattlePresentationKind.Defeat:
                    Play(VexforgeHapticCue.Warning);
                    break;
                case BattlePresentationKind.Boss:
                case BattlePresentationKind.Attack:
                case BattlePresentationKind.Cast:
                    Play(VexforgeHapticCue.Impact);
                    break;
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal:
                    Play(VexforgeHapticCue.Selection);
                    break;
            }
        }

        private void OnDestroy()
        {
            if (director != null)
                director.EventStarted -= OnEventStarted;
        }
    }
}
