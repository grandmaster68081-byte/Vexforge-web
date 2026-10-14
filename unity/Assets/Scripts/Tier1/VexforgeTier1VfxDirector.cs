using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1VfxDirector : MonoBehaviour
    {
        private sealed class PooledEffect
        {
            public ParticleSystem System;
            public Coroutine ReleaseRoutine;
            public bool InUse;
        }

        private const int PoolCapacity = 5;
        private Transform root;
        private Material particleMaterial;
        private BattlePresentationDirector director;
        private readonly List<PooledEffect> pool = new List<PooledEffect>(PoolCapacity);

        public void Initialize(Transform parent)
        {
            if (root != null) return;
            root = new GameObject("VexforgeTier1VfxRoot").transform;
            root.SetParent(parent, false);
            var shader = Shader.Find("Universal Render Pipeline/Particles/Unlit") ?? Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Particles/Standard Unlit") ?? Shader.Find("Unlit/Color");
            if (shader == null)
            {
                Debug.LogError("VEXFORGE VFX pool unavailable: no compatible particle shader was found.", this);
                return;
            }

            particleMaterial = new Material(shader) { name = "VEXFORGE_RuntimeVfx" };
            for (var i = 0; i < PoolCapacity; i++)
                pool.Add(CreatePooledEffect(i));
        }

        public void Bind(BattlePresentationDirector canonical)
        {
            if (director != null) director.EventStarted -= OnEvent;
            director = canonical;
            if (director != null) director.EventStarted += OnEvent;
        }

        private void OnEvent(BattleEvent evt)
        {
            if (evt == null || root == null || director == null) return;
            if (director != null && director.IsReducedMotion) return;
            Vector3 anchor;
            if (!director.TryGetEventAnchor(evt, out anchor)) return;

            var kind = BattlePresentationPolicy.Classify(evt.event_type);
            var color = new Color(.72f,.26f,.10f,1f);
            var count = 12; var life = .34f;
            if (kind == BattlePresentationKind.Boss) { color = new Color(.48f,.34f,.88f,1f); count = 18; life = .62f; }
            else if (kind == BattlePresentationKind.Guard) { color = new Color(.17f,.52f,.82f,1f); count = 14; life = .40f; }
            else if (kind == BattlePresentationKind.Heal) { color = new Color(.20f,.78f,.62f,1f); count = 14; life = .44f; }
            else if (kind == BattlePresentationKind.Cast) { color = new Color(.26f,.48f,.95f,1f); count = 16; life = .46f; }
            else if (kind == BattlePresentationKind.Status) { color = new Color(.64f,.28f,.78f,1f); count = 12; life = .38f; }
            else if (kind == BattlePresentationKind.Victory) { color = new Color(.85f,.62f,.18f,1f); count = 20; life = .72f; }
            else if (kind == BattlePresentationKind.Defeat) { color = new Color(.48f,.06f,.08f,1f); count = 20; life = .62f; }
            Emit(anchor, color, count, life);
        }

        private PooledEffect CreatePooledEffect(int index)
        {
            var go = new GameObject("VexforgeEventFx_" + index);
            go.transform.SetParent(root, false);
            var ps = go.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.loop = false;
            main.playOnAwake = false;
            main.duration = 1f;
            main.startLifetime = 0.6f;
            main.startSpeed = new ParticleSystem.MinMaxCurve(.35f, 1.45f);
            main.startSize = new ParticleSystem.MinMaxCurve(.02f, .06f);
            main.maxParticles = 32;
            main.simulationSpace = ParticleSystemSimulationSpace.World;

            var emission = ps.emission;
            emission.enabled = false;
            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = .26f;
            var renderer = ps.GetComponent<ParticleSystemRenderer>();
            renderer.sharedMaterial = particleMaterial;
            renderer.renderMode = ParticleSystemRenderMode.Billboard;
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            return new PooledEffect { System = ps };
        }

        private void Emit(Vector3 position, Color color, int count, float lifetime)
        {
            if (particleMaterial == null)
                return;

            PooledEffect effect = null;
            for (var i = 0; i < pool.Count; i++)
            {
                if (!pool[i].InUse)
                {
                    effect = pool[i];
                    break;
                }
            }

            if (effect == null || effect.System == null)
                return;

            effect.InUse = true;
            var ps = effect.System;
            ps.transform.position = position;
            ps.Clear(true);
            var main = ps.main;
            main.duration = lifetime;
            main.startLifetime = new ParticleSystem.MinMaxCurve(lifetime * .35f, lifetime);
            main.startColor = color;
            ps.Emit(Mathf.Min(24, count));
            ps.Play();
            effect.ReleaseRoutine = StartCoroutine(ReleaseAfter(effect, lifetime + .18f));
        }

        private IEnumerator ReleaseAfter(PooledEffect effect, float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            if (effect != null && effect.System != null)
            {
                effect.System.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
                effect.InUse = false;
                effect.ReleaseRoutine = null;
            }
        }

        private void OnDestroy()
        {
            if (director != null) director.EventStarted -= OnEvent;
            for (var i = 0; i < pool.Count; i++)
            {
                if (pool[i].ReleaseRoutine != null)
                    StopCoroutine(pool[i].ReleaseRoutine);
            }
            if (particleMaterial != null) Destroy(particleMaterial);
        }
    }
}
