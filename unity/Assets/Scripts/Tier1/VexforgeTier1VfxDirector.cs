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
            var color = new Color(0.96f, 0.28f, 0.12f, 1f);
            var count = 14;
            var lifetime = 0.42f;
            var shapeType = ParticleSystemShapeType.Cone;
            var shapeRotation = new Vector3(-90f, 0f, 0f);
            var radius = 0.18f;
            var angle = 14f;
            var minSpeed = 0.55f;
            var maxSpeed = 1.40f;
            var minSize = 0.025f;
            var maxSize = 0.07f;

            switch (kind)
            {
                case BattlePresentationKind.Boss:
                    color = new Color(0.55f, 0.30f, 0.98f, 1f);
                    count = 24;
                    lifetime = 0.95f;
                    shapeType = ParticleSystemShapeType.Cone;
                    radius = 0.35f;
                    angle = 20f;
                    minSpeed = 0.75f;
                    maxSpeed = 1.75f;
                    minSize = 0.035f;
                    maxSize = 0.11f;
                    break;
                case BattlePresentationKind.Guard:
                    color = new Color(0.18f, 0.70f, 0.98f, 1f);
                    count = 18;
                    lifetime = 0.52f;
                    shapeType = ParticleSystemShapeType.Circle;
                    shapeRotation = new Vector3(90f, 0f, 0f);
                    radius = 0.78f;
                    angle = 0f;
                    minSpeed = 0.05f;
                    maxSpeed = 0.16f;
                    minSize = 0.035f;
                    maxSize = 0.075f;
                    break;
                case BattlePresentationKind.Heal:
                    color = new Color(0.20f, 0.86f, 0.62f, 1f);
                    count = 18;
                    lifetime = 0.66f;
                    shapeType = ParticleSystemShapeType.Sphere;
                    shapeRotation = Vector3.zero;
                    radius = 0.42f;
                    angle = 0f;
                    minSpeed = 0.24f;
                    maxSpeed = 0.88f;
                    minSize = 0.03f;
                    maxSize = 0.08f;
                    break;
                case BattlePresentationKind.Cast:
                    color = new Color(0.28f, 0.52f, 1f, 1f);
                    count = 20;
                    lifetime = 0.62f;
                    shapeType = ParticleSystemShapeType.Cone;
                    radius = 0.14f;
                    angle = 10f;
                    minSpeed = 0.55f;
                    maxSpeed = 1.25f;
                    minSize = 0.03f;
                    maxSize = 0.075f;
                    break;
                case BattlePresentationKind.Status:
                    color = new Color(0.74f, 0.32f, 0.96f, 1f);
                    count = 16;
                    lifetime = 0.54f;
                    shapeType = ParticleSystemShapeType.Circle;
                    shapeRotation = new Vector3(90f, 0f, 0f);
                    radius = 0.48f;
                    angle = 0f;
                    minSpeed = 0.12f;
                    maxSpeed = 0.42f;
                    minSize = 0.025f;
                    maxSize = 0.065f;
                    break;
                case BattlePresentationKind.Victory:
                    color = new Color(0.98f, 0.75f, 0.20f, 1f);
                    count = 24;
                    lifetime = 0.90f;
                    shapeType = ParticleSystemShapeType.Cone;
                    radius = 0.32f;
                    angle = 24f;
                    minSpeed = 0.45f;
                    maxSpeed = 1.30f;
                    minSize = 0.035f;
                    maxSize = 0.11f;
                    break;
                case BattlePresentationKind.Defeat:
                    color = new Color(0.78f, 0.08f, 0.13f, 1f);
                    count = 22;
                    lifetime = 0.74f;
                    shapeType = ParticleSystemShapeType.Sphere;
                    shapeRotation = Vector3.zero;
                    radius = 0.44f;
                    angle = 0f;
                    minSpeed = 0.35f;
                    maxSpeed = 1.05f;
                    minSize = 0.04f;
                    maxSize = 0.12f;
                    break;
            }

            Emit(
                anchor,
                color,
                count,
                lifetime,
                shapeType,
                shapeRotation,
                radius,
                angle,
                minSpeed,
                maxSpeed,
                minSize,
                maxSize);
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
            ps.useAutoRandomSeed = false;
            ps.randomSeed = (uint)(index + 1);
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

            return new PooledEffect { System = ps };
        }

        private void Emit(
            Vector3 position,
            Color color,
            int count,
            float lifetime,
            ParticleSystemShapeType shapeType,
            Vector3 shapeRotation,
            float radius,
            float angle,
            float minSpeed,
            float maxSpeed,
            float minSize,
            float maxSize)
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
            main.startLifetime = new ParticleSystem.MinMaxCurve(lifetime * 0.55f, lifetime);
            main.startColor = color;
            main.startSpeed = new ParticleSystem.MinMaxCurve(minSpeed, maxSpeed);
            main.startSize = new ParticleSystem.MinMaxCurve(minSize, maxSize);
            var shape = ps.shape;
            shape.shapeType = shapeType;
            shape.rotation = shapeRotation;
            shape.radius = radius;
            shape.angle = angle;
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
