using System;
using System.Collections;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
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
        public event Action<BattleEvent> EventPresented;
        public event Action PresentationCompleted;

        private VexforgeBattlefieldStage battlefield;
        private bool initialized;
        private int presentationToken;

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
        }

        public void Play(BattleEvent[] events)
        {
            if (!initialized)
            {
                State = PresentationState.Error;
                Debug.LogError("VEXFORGE BattlePresentationDirector.Play() requires Initialize() first.", this);
                return;
            }

            presentationToken++;
            var token = presentationToken;
            StopAllCoroutines();
            StartCoroutine(PlaySequence(events ?? new BattleEvent[0], token));
        }

        private IEnumerator PlaySequence(BattleEvent[] events, int token)
        {
            if (!initialized)
            {
                State = PresentationState.Error;
                yield break;
            }

            State = PresentationState.Playing;
            battlefield.SetVisible(true);

            foreach (var battleEvent in events)
            {
                if (token != presentationToken)
                    yield break;
                if (battleEvent == null)
                    continue;

                yield return battlefield.PresentEvent(battleEvent);
                if (token != presentationToken)
                    yield break;
                EventPresented?.Invoke(battleEvent);
            }

            if (token != presentationToken)
                yield break;
            State = PresentationState.Completed;
            PresentationCompleted?.Invoke();
        }

        private void OnDisable()
        {
            presentationToken++;
            StopAllCoroutines();
            if (battlefield != null)
                battlefield.SetVisible(false);
            if (State == PresentationState.Playing)
                State = PresentationState.Idle;
        }
    }
}
