using System;
using System.Collections;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    public enum BattlePresentationKind
    {
        Boss,
        Victory,
        Defeat,
        Cast,
        Attack,
        Guard,
        Heal,
        Status,
        Neutral
    }

    public sealed class BattleSequenceFrame
    {
        public int Index { get; private set; }
        public BattleEvent Event { get; private set; }
        public BattlePresentationKind Kind { get; private set; }
        public int DurationMs { get; private set; }
        public bool Interruptible { get; private set; }
        public int Priority { get; private set; }

        public BattleSequenceFrame(int index, BattleEvent battleEvent, BattlePresentationKind kind)
        {
            Index = index;
            Event = battleEvent;
            Kind = kind;
            DurationMs = BattlePresentationPolicy.DurationMs(kind);
            Interruptible = kind != BattlePresentationKind.Boss &&
                            kind != BattlePresentationKind.Victory &&
                            kind != BattlePresentationKind.Defeat;
            Priority = BattlePresentationPolicy.Priority(kind);
        }
    }

    public static class BattlePresentationPolicy
    {
        public static BattlePresentationKind Classify(string eventType)
        {
            var kind = (eventType ?? string.Empty).ToUpperInvariant();
            if (ContainsAny(kind, "BOSS", "PHASE")) return BattlePresentationKind.Boss;
            if (kind.Contains("VICTORY")) return BattlePresentationKind.Victory;
            if (ContainsAny(kind, "DEFEAT", "KO", "DEATH")) return BattlePresentationKind.Defeat;
            if (ContainsAny(kind, "HEAL", "REGENERATE")) return BattlePresentationKind.Heal;
            if (ContainsAny(kind, "BURN", "POISON", "STATUS_TICK")) return BattlePresentationKind.Status;
            if (ContainsAny(kind, "SHIELD", "GUARD", "BUFF")) return BattlePresentationKind.Guard;
            if (ContainsAny(kind, "SKILL", "CAST", "SUMMON", "DRAIN")) return BattlePresentationKind.Cast;
            if (ContainsAny(kind, "ATTACK", "HIT", "DAMAGE", "CRITICAL")) return BattlePresentationKind.Attack;
            return BattlePresentationKind.Neutral;
        }

        public static int DurationMs(BattlePresentationKind kind)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss: return 1250;
                case BattlePresentationKind.Victory: return 1150;
                case BattlePresentationKind.Defeat: return 1050;
                case BattlePresentationKind.Attack: return 560;
                case BattlePresentationKind.Cast: return 640;
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal: return 520;
                case BattlePresentationKind.Status: return 500;
                default: return 360;
            }
        }

        public static int Priority(BattlePresentationKind kind)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss: return 100;
                case BattlePresentationKind.Victory: return 95;
                case BattlePresentationKind.Defeat: return 94;
                case BattlePresentationKind.Cast: return 70;
                case BattlePresentationKind.Attack: return 65;
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal: return 55;
                case BattlePresentationKind.Status: return 50;
                default: return 10;
            }
        }

        public static float CameraZoom(BattlePresentationKind kind)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss: return 1.12f;
                case BattlePresentationKind.Attack:
                case BattlePresentationKind.Cast: return 1.075f;
                case BattlePresentationKind.Victory: return 1.035f;
                case BattlePresentationKind.Defeat: return 1.025f;
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal: return 1.045f;
                default: return 1f;
            }
        }

        public static int CameraDurationMs(BattlePresentationKind kind)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss: return 680;
                case BattlePresentationKind.Attack:
                case BattlePresentationKind.Cast: return 340;
                case BattlePresentationKind.Victory:
                case BattlePresentationKind.Defeat: return 520;
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal: return 360;
                default: return 360;
            }
        }

        public static string AudioCue(BattlePresentationKind kind)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss: return "pack_reveal";
                case BattlePresentationKind.Victory: return "reward";
                case BattlePresentationKind.Defeat: return "impact";
                case BattlePresentationKind.Attack: return "attack";
                case BattlePresentationKind.Cast:
                case BattlePresentationKind.Guard:
                case BattlePresentationKind.Heal: return "shield";
                case BattlePresentationKind.Status: return "impact";
                default: return null;
            }
        }

        private static bool ContainsAny(string value, params string[] fragments)
        {
            for (var i = 0; i < fragments.Length; i++)
                if (value.Contains(fragments[i]))
                    return true;
            return false;
        }
    }

    public enum PresentationState
    {
        Idle,
        Playing,
        Completed,
        Error
    }

    /// <summary>
    /// Converts authoritative backend BattleEvent objects into a visual sequence.
    /// This class never resolves rules locally.
    /// </summary>
    public sealed class BattlePresentationDirector : MonoBehaviour
    {
        public PresentationState State { get; private set; } = PresentationState.Idle;
        public bool IsInitialized { get { return initialized; } }
        public int CurrentEventIndex { get; private set; } = -1;
        public int EventCount { get; private set; }
        public BattlePresentationKind CurrentKind { get; private set; } = BattlePresentationKind.Neutral;
        public bool CanSkipCurrentEvent { get; private set; }
        public bool IsReducedMotion { get; private set; }
        public event Action<BattleEvent> EventStarted;
        public event Action<BattleEvent> EventPresented;
        public event Action<int, int> PlaybackPositionChanged;
        public event Action PresentationCompleted;

        private VexforgeBattlefieldStage battlefield;
        private bool initialized;
        private int presentationToken;
        private BattleEvent[] lastResolvedEvents = new BattleEvent[0];
        private bool hasResolvedSequence;

        public void Initialize(
            Camera camera,
            VexforgeCardArtResolver resolver,
            Func<string, CardRecord> cardLookup,
            string localPlayerId)
        {
            if (initialized)
                return;

            var stages = GetComponentsInChildren<VexforgeBattlefieldStage>(true);
            for (var i = 0; i < stages.Length; i++)
            {
                if (stages[i].gameObject != gameObject)
                {
                    battlefield = stages[i];
                    break;
                }
            }

            if (battlefield == null)
            {
                var battlefieldObject = new GameObject("BattlefieldStage");
                battlefieldObject.transform.SetParent(transform, false);
                battlefield = battlefieldObject.AddComponent<VexforgeBattlefieldStage>();
            }

            battlefield.Initialize(camera, resolver, cardLookup, localPlayerId);
            initialized = true;
        }

        public void SetLocalPlayerId(string playerId)
        {
            if (battlefield != null)
                battlefield.SetLocalPlayerId(playerId);
        }

        public void SetVisible(bool visible)
        {
            if (!visible)
            {
                presentationToken++;
                StopAllCoroutines();
                if (State == PresentationState.Playing)
                    State = PresentationState.Idle;
            }
            if (battlefield != null)
                battlefield.SetVisible(visible);
        }

        public void StopAndHide()
        {
            presentationToken++;
            StopAllCoroutines();
            if (battlefield != null)
                battlefield.SetVisible(false);
            State = PresentationState.Idle;
            CurrentEventIndex = -1;
            EventCount = 0;
            CanSkipCurrentEvent = false;
        }

        public void Play(BattleEvent[] events)
        {
            if (!initialized)
            {
                State = PresentationState.Error;
                Debug.LogError("VEXFORGE BattlePresentationDirector.Play() requires Initialize() first.", this);
                return;
            }

            lastResolvedEvents = CopyEvents(events);
            hasResolvedSequence = true;
            BeginPlayback(CopyEvents(lastResolvedEvents));
        }

        /// <summary>
        /// Replays the last server-provided event sequence without making another battle request.
        /// </summary>
        public bool ReplayLastSequence()
        {
            if (!initialized || !hasResolvedSequence)
                return false;

            BeginPlayback(CopyEvents(lastResolvedEvents));
            return true;
        }

        public void ClearLastSequence()
        {
            lastResolvedEvents = new BattleEvent[0];
            hasResolvedSequence = false;
        }

        public bool SkipToEnd()
        {
            if (State != PresentationState.Playing || !CanSkipCurrentEvent)
                return false;

            presentationToken++;
            StopAllCoroutines();
            if (battlefield != null)
                battlefield.SetVisible(false);
            State = PresentationState.Completed;
            CurrentEventIndex = EventCount;
            CanSkipCurrentEvent = false;
            PlaybackPositionChanged?.Invoke(EventCount, EventCount);
            PresentationCompleted?.Invoke();
            return true;
        }

        private void BeginPlayback(BattleEvent[] events)
        {
            presentationToken++;
            var token = presentationToken;
            StopAllCoroutines();
            StartCoroutine(PlaySequence(events, token));
        }

        private IEnumerator PlaySequence(BattleEvent[] events, int token)
        {
            if (!initialized)
            {
                State = PresentationState.Error;
                yield break;
            }

            var frames = BuildSequence(events);
            State = PresentationState.Playing;
            CurrentEventIndex = -1;
            EventCount = frames.Length;

            // A fresh playback starts from a clean visual baseline, including replay and
            // replacement of an interrupted sequence.
            battlefield.SetVisible(false);
            battlefield.SetVisible(true);
            var app = Vexforge.Core.VexforgeApp.Instance;
            IsReducedMotion = app != null && app.PersistentState != null && app.PersistentState.ReducedMotion;
            battlefield.SetReducedMotion(IsReducedMotion);

            for (var i = 0; i < frames.Length; i++)
            {
                if (token != presentationToken)
                    yield break;

                var frame = frames[i];
                CurrentEventIndex = frame.Index;
                CurrentKind = frame.Kind;
                CanSkipCurrentEvent = frame.Interruptible;
                PlaybackPositionChanged?.Invoke(i, frames.Length);
                EventStarted?.Invoke(frame.Event);
                yield return battlefield.PresentEvent(frame.Event, frame.Kind);
                if (token != presentationToken)
                    yield break;
                EventPresented?.Invoke(frame.Event);
            }

            if (token != presentationToken)
                yield break;
            State = PresentationState.Completed;
            CanSkipCurrentEvent = false;
            PlaybackPositionChanged?.Invoke(frames.Length, frames.Length);
            PresentationCompleted?.Invoke();
        }

        private static BattleSequenceFrame[] BuildSequence(BattleEvent[] events)
        {
            var frames = new System.Collections.Generic.List<BattleSequenceFrame>();
            if (events == null)
                return frames.ToArray();

            for (var i = 0; i < events.Length; i++)
            {
                var battleEvent = events[i];
                if (battleEvent == null)
                    continue;
                frames.Add(new BattleSequenceFrame(
                    i,
                    battleEvent,
                    BattlePresentationPolicy.Classify(battleEvent.event_type)));
            }
            return frames.ToArray();
        }

        private static BattleEvent[] CopyEvents(BattleEvent[] events)
        {
            if (events == null || events.Length == 0)
                return new BattleEvent[0];
            var copy = new BattleEvent[events.Length];
            Array.Copy(events, copy, events.Length);
            return copy;
        }

        private void OnDisable()
        {
            presentationToken++;
            StopAllCoroutines();
            if (battlefield != null)
                battlefield.SetVisible(false);
            if (State == PresentationState.Playing)
                State = PresentationState.Idle;
            CurrentEventIndex = -1;
            EventCount = 0;
            CanSkipCurrentEvent = false;
        }
    }
}
