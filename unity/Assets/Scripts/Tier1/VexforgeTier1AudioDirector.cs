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
            if (director != null) director.EventPresented -= OnEvent;
            director = canonical;
            if (director != null) director.EventPresented += OnEvent;
        }

        private void OnEvent(BattleEvent evt)
        {
            if (evt == null) return;
            var kind=(evt.event_type??string.Empty).ToUpperInvariant();
            if(kind.Contains("VICTORY")||kind.Contains("MATCH_END")) Play("victory",.8f);
            else if(kind.Contains("DEFEAT")) Play("defeat",.8f);
            else if(kind.Contains("GUARD")) Play("guard",.55f);
            else if(kind.Contains("SHIELD")||kind.Contains("VEIL")) Play("shield",.55f);
            else if(kind.Contains("ATTACK")||kind.Contains("STRIKE")||kind.Contains("DAMAGE")) Play("impact",.62f);
            else if(kind.Contains("DEPLOY")||kind.Contains("SUMMON")||kind.Contains("PLAY")||kind.Contains("CAST")) Play("attack",.28f);
        }

        public void Play(string cue,float volume=1f)
        {
            if(sfx==null)Initialize();
            var clip=Get(cue); if(clip==null)return;
            sfx.PlayOneShot(clip,Mathf.Clamp01(volume));
        }
        private AudioClip Get(string cue){if(string.IsNullOrWhiteSpace(cue))return null;AudioClip c;if(clips.TryGetValue(cue,out c))return c;c=Resources.Load<AudioClip>("VexforgeTier1/Audio/"+cue);clips[cue]=c;return c;}
        private void OnDestroy(){if(director!=null)director.EventPresented-=OnEvent;}
    }
}
