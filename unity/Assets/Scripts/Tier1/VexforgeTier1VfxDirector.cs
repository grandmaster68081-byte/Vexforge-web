using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1VfxDirector : MonoBehaviour
    {
        private Transform root;
        private Material particleMaterial;
        private BattlePresentationDirector director;
        private int active;
        private const int MaxConcurrent = 5;

        public void Initialize(Transform parent)
        {
            if (root != null) return;
            root = new GameObject("VexforgeTier1VfxRoot").transform;
            root.SetParent(parent, false);
            var shader = Shader.Find("Universal Render Pipeline/Particles/Unlit") ?? Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Particles/Standard Unlit") ?? Shader.Find("Unlit/Color");
            if (shader != null) particleMaterial = new Material(shader) { name = "VEXFORGE_RuntimeVfx" };
        }

        public void Bind(BattlePresentationDirector canonical)
        {
            if (director != null) director.EventPresented -= OnEvent;
            director = canonical;
            if (director != null) director.EventPresented += OnEvent;
        }

        private void OnEvent(BattleEvent evt)
        {
            if (evt == null || root == null || active >= MaxConcurrent) return;
            var kind = (evt.event_type ?? string.Empty).ToUpperInvariant();
            var color = new Color(.72f,.26f,.10f,1f);
            var count = 12; var life = .34f;
            if (kind.Contains("GUARD") || kind.Contains("SHIELD") || kind.Contains("VEIL")) { color = new Color(.17f,.52f,.82f,1f); count = 14; life = .40f; }
            else if (kind.Contains("VICTORY")) { color = new Color(.85f,.62f,.18f,1f); count = 20; life = .72f; }
            else if (kind.Contains("DEFEAT")) { color = new Color(.48f,.06f,.08f,1f); count = 20; life = .62f; }
            Emit(Vector3.up*.30f, color, count, life);
        }

        private void Emit(Vector3 position, Color color, int count, float lifetime)
        {
            if (particleMaterial == null) return;
            active++;
            var go = new GameObject("VexforgeEventFx"); go.transform.SetParent(root, false); go.transform.localPosition = position;
            var ps = go.AddComponent<ParticleSystem>();
            var main = ps.main; main.loop=false; main.playOnAwake=false; main.duration=lifetime; main.startLifetime=new ParticleSystem.MinMaxCurve(lifetime*.35f,lifetime); main.startSpeed=new ParticleSystem.MinMaxCurve(.35f,1.45f); main.startSize=new ParticleSystem.MinMaxCurve(.02f,.06f); main.startColor=color; main.maxParticles=32;
            var emission=ps.emission; emission.enabled=true; emission.SetBursts(new[]{new ParticleSystem.Burst(0f,(short)Mathf.Min(24,count))});
            var shape=ps.shape; shape.shapeType=ParticleSystemShapeType.Sphere; shape.radius=.26f;
            var renderer=ps.GetComponent<ParticleSystemRenderer>(); renderer.material=particleMaterial; renderer.renderMode=ParticleSystemRenderMode.Billboard;
            ps.Emit(Mathf.Min(24,count)); ps.Play(); StartCoroutine(DestroyAfter(go,lifetime+.18f));
        }

        private IEnumerator DestroyAfter(GameObject go,float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            if (go != null) Destroy(go);
            active = Mathf.Max(0,active-1);
        }
        private void OnDestroy(){if(director!=null)director.EventPresented-=OnEvent;if(particleMaterial!=null)Destroy(particleMaterial);}
    }
}
