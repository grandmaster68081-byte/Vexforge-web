using System;
using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Presentation
{
    public enum PresentationState
    {
        Idle,
        Playing,
        Completed,
        Error
    }

    public sealed class BattlePresentationDirector : MonoBehaviour
    {
        public PresentationState State { get; private set; } = PresentationState.Idle;
        public event Action<BattleEvent> EventPresented;
        public event Action PresentationCompleted;

        public void Play(BattleEvent[] events)
        {
            StopAllCoroutines();
            StartCoroutine(PlaySequence(events ?? new BattleEvent[0]));
        }

        private IEnumerator PlaySequence(BattleEvent[] events)
        {
            State = PresentationState.Playing;
            foreach (var battleEvent in events)
            {
                if (battleEvent == null) continue;
                EventPresented?.Invoke(battleEvent);
                yield return new WaitForSeconds(0.18f);
            }

            State = PresentationState.Completed;
            PresentationCompleted?.Invoke();
        }
    }
}