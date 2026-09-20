using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Presentation-only card response. It deliberately avoids guessing which hidden card caused an event.
    /// </summary>
    public sealed class VexforgeTier1CardImmersionDirector : MonoBehaviour
    {
        private BattlePresentationDirector director;
        private VexforgeBattlefieldStage stage;
        private bool bound;
        private int activeResponses;
        private int roundRobin;

        public void Initialize(BattlePresentationDirector canonical, VexforgeCardArtResolver _)
        {
            director=canonical;
            stage=director==null?null:director.GetComponentInChildren<VexforgeBattlefieldStage>(true);
            if(director==null||bound)return;
            director.EventPresented+=OnEventPresented;
            bound=true;
        }

        private void OnEventPresented(BattleEvent evt)
        {
            if(evt==null||stage==null)return;
            var kind=(evt.event_type??string.Empty).ToUpperInvariant();
            if(!(kind.Contains("ATTACK")||kind.Contains("STRIKE")||kind.Contains("DAMAGE")||kind.Contains("GUARD")||kind.Contains("SHIELD")||kind.Contains("VEIL")||kind.Contains("DEPLOY")||kind.Contains("SUMMON")||kind.Contains("PLAY")||kind.Contains("CAST")))return;
            if(activeResponses>=2)return;
            activeResponses++;
            StartCoroutine(RespondToVisibleCards());
        }

        private IEnumerator RespondToVisibleCards()
        {
            var cards=stage==null?new VexforgeCardView[0]:stage.GetComponentsInChildren<VexforgeCardView>(true);
            var count=Mathf.Min(cards.Length,4);
            if(count==0){activeResponses=Mathf.Max(0,activeResponses-1);yield break;}
            for(var step=0;step<count;step++)
            {
                var index=(roundRobin+step)%cards.Length;
                var card=cards[index];
                if(card!=null&&card.gameObject.activeInHierarchy)StartCoroutine(Pulse(card.transform));
                yield return new WaitForSecondsRealtime(.055f);
            }
            roundRobin=(roundRobin+count)%Mathf.Max(1,cards.Length);
            yield return new WaitForSecondsRealtime(.20f);
            activeResponses=Mathf.Max(0,activeResponses-1);
        }

        private IEnumerator Pulse(Transform target)
        {
            var original=target.localScale;const float duration=.20f;var t=0f;
            while(t<duration&&target!=null)
            {
                t+=Time.unscaledDeltaTime;var n=Mathf.Clamp01(t/duration);var envelope=Mathf.Sin(n*Mathf.PI);
                target.localScale=original*(1f+envelope*.045f);
                yield return null;
            }
            if(target!=null)target.localScale=original;
        }

        private void OnDestroy(){if(director!=null&&bound)director.EventPresented-=OnEventPresented;}
    }
}
