using System;
using System.Collections.Generic;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1AudioDirector : MonoBehaviour
    {
        private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>(StringComparer.OrdinalIgnoreCase);
        private AudioSource sfx;
        private BattlePresentationDirector director;

        public void Initialize()
        {
            if (sfx != null) return;
            sfx = gameObject.AddComponent<AudioSource>(); sfx.playOnAwake=false; sfx.volume=.50f;
        }

        public void Bind(BattlePresentationDirector canonical)
        {
            if (director != null) director.EventStarted -= OnEvent;
            director = canonical;
            if (director != null) director.EventStarted += OnEvent;
        }

        private void OnEvent(BattleEvent evt)
        {
            if (evt == null) return;
            var kind = BattlePresentationPolicy.Classify(evt.event_type);
            var cue = BattlePresentationPolicy.AudioCue(kind);
            if (string.IsNullOrWhiteSpace(cue)) return;

            var volume = kind == BattlePresentationKind.Victory
                ? .8f
                : kind == BattlePresentationKind.Attack ? .62f : .55f;
            Play(cue, volume);
        }

        public void Play(string cue,float volume=1f)
        {
            if(sfx==null)Initialize();
            var clip=Get(cue); if(clip==null)return;
            sfx.PlayOneShot(clip,Mathf.Clamp01(volume));
        }
        private AudioClip Get(string cue){if(string.IsNullOrWhiteSpace(cue))return null;AudioClip c;if(clips.TryGetValue(cue,out c))return c;c=Resources.Load<AudioClip>("VexforgeTier1/Audio/"+cue);clips[cue]=c;return c;}
        private void OnDestroy(){if(director!=null)director.EventStarted-=OnEvent;}
    }
}
