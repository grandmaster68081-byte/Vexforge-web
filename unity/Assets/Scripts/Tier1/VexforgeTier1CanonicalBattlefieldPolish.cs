using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Vexforge.Backend;
using UnityEngine.Rendering;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1CanonicalBattlefieldPolish : MonoBehaviour
    {
        private BattlePresentationDirector director;
        private VexforgeBattlefieldStage stage;
        private VexforgeTier1AssetRegistry assets;
        private Transform root;
        private Texture2D arenaTexture;
        private Texture2D sigilTexture;
        private Texture2D bossTexture;
        private readonly List<Material> materials = new List<Material>();
        private readonly List<Mesh> ownedMeshes = new List<Mesh>();
        private readonly Dictionary<string, GameObject> replacements = new Dictionary<string, GameObject>();
        private float scanClock;
        private bool built;

        public void Initialize(BattlePresentationDirector canonical, VexforgeBattlefieldStage canonicalStage, VexforgeTier1AssetRegistry registry)
        {
            director = canonical;
            stage = canonicalStage;
            assets = registry;
            if (built || stage == null) return;
            if (director != null) director.EventPresented += OnEventPresented;
            arenaTexture = assets == null ? null : assets.LoadTexture("VF_BATTLE_ARENA_CITADEL_A");
            sigilTexture = assets == null ? null : assets.LoadTexture("VF_BATTLE_SIGIL_ATLAS");
            bossTexture = assets == null ? null : assets.LoadTexture("VF_BOSS_SIGIL");
            Build();
            built = true;
        }

        private void Update()
        {
            if (!built || stage == null) return;
            scanClock += Time.unscaledDeltaTime;
            if (scanClock < .08f) return;
            scanClock = 0f;
            SuppressLegacyFallbacks();
            AnimateAmbient();
        }

        private void Build()
        {
            var canonicalRoot = stage.transform.Find("BattlefieldArena");
            if (canonicalRoot == null) canonicalRoot = stage.transform;
            HideLegacyScaffolding(canonicalRoot);
            root = new GameObject("VexforgePremiumBattlefield").transform;
            root.SetParent(canonicalRoot, false);
            root.localPosition = new Vector3(0f, 0f, 5.0f);

            var floor = CreateDisc("ObsidianFloor", 8.2f, .09f, new Vector3(0f,-.04f,0f));
            Apply(floor, MakeMaterial("Obsidian", new Color(.012f,.015f,.022f,1f), .18f, .62f, sigilTexture));
            var inner = CreateDisc("InnerSanctum", 6.25f, .05f, new Vector3(0f,.05f,0f));
            Apply(inner, MakeMaterial("Inner", new Color(.028f,.021f,.034f,1f), .24f, .72f, sigilTexture));

            var outer = CreateRing("OuterGoldSeal", 7.25f, 7.55f, .075f, new Vector3(0f,.10f,0f));
            Apply(outer, MakeMaterial("GoldSeal", new Color(.30f,.20f,.08f,1f), .30f, .88f, null));
            var core = CreateRing("NexusCore", 1.78f, 2.10f, .10f, new Vector3(0f,.13f,0f));
            Apply(core, MakeMaterial("CoreGold", new Color(.40f,.16f,.075f,1f), .34f, 1.05f, null));

            CreateZone("CHAMPION", new Vector3(0f,.12f,-2.55f), 1.18f, new Color(.55f,.34f,.12f,1f));
            CreateZone("VANGUARD", new Vector3(-2.25f,.12f,-.32f), 1.00f, new Color(.18f,.33f,.48f,1f));
            CreateZone("SENTINEL", new Vector3(2.25f,.12f,-.32f), 1.00f, new Color(.20f,.24f,.30f,1f));
            CreateZone("OPP_CHAMPION", new Vector3(0f,.12f,2.55f), 1.18f, new Color(.55f,.11f,.10f,1f));
            CreateZone("OPP_VANGUARD", new Vector3(-2.25f,.12f,.32f), 1.00f, new Color(.30f,.12f,.13f,1f));
            CreateZone("OPP_SENTINEL", new Vector3(2.25f,.12f,.32f), 1.00f, new Color(.25f,.09f,.11f,1f));

            CreateBackdrop();
            CreateBattlePillars();
            CreateBossSanctum();
        }

        private void CreateBackdrop()
        {
            var backdrop = CreateQuad("ArenaBackdrop", new Vector3(0f,3.8f,4.1f), new Vector3(13.0f,7.2f,1f));
            backdrop.transform.localRotation = Quaternion.Euler(0f,180f,0f);
            Apply(backdrop, MakeMaterial("ArenaBackdrop", Color.white, .08f, .92f, arenaTexture));
        }

        private void CreateBattlePillars()
        {
            for (var i = 0; i < 8; i++)
            {
                var angle = (Mathf.PI * 2f / 8f) * i;
                var p = new Vector3(Mathf.Cos(angle) * 6.15f, .65f, Mathf.Sin(angle) * 6.15f);
                var pillar = GameObject.CreatePrimitive(PrimitiveType.Cube);
                pillar.name = "VexforgePillar_" + i;
                pillar.transform.SetParent(root, false);
                pillar.transform.localPosition = p;
                pillar.transform.localScale = new Vector3(.24f, 1.30f, .24f);
                var top = CreateDisc("PillarSeal_" + i, .42f, .035f, p + Vector3.up * .96f);
                Apply(pillar, MakeMaterial("Pillar", new Color(.06f,.052f,.045f,1f), .25f, .76f, null));
                Apply(top, MakeMaterial("PillarSeal", new Color(.35f,.25f,.11f,1f), .26f, .86f, sigilTexture));
                RemoveCollider(pillar);
            }
        }

        private void CreateBossSanctum()
        {
            var bossRoot = new GameObject("BossSanctum");
            bossRoot.transform.SetParent(root, false);
            bossRoot.transform.localPosition = new Vector3(0f,.08f,2.75f);
            var halo = CreateRing("BossHalo", 1.35f, 1.72f, .06f, Vector3.zero);
            halo.transform.SetParent(bossRoot.transform, false);
            Apply(halo, MakeMaterial("BossHalo", new Color(.52f,.08f,.08f,1f), .30f, 1.10f, bossTexture));
            var sigil = CreateQuad("BossSigil", Vector3.up * .65f, new Vector3(1.75f,1.75f,1f));
            sigil.transform.SetParent(bossRoot.transform, false);
            sigil.transform.localRotation = Quaternion.Euler(90f,0f,0f);
            Apply(sigil, MakeMaterial("BossSigil", Color.white, .12f, 1.08f, bossTexture));
            var point = new GameObject("BossPointLight");
            point.transform.SetParent(bossRoot.transform, false);
            point.transform.localPosition = new Vector3(0f,1.0f,0f);
            var light = point.AddComponent<Light>();
            light.type = LightType.Point;
            light.range = 6f;
            light.intensity = 2.2f;
            light.color = new Color(.54f,.08f,.09f,1f);
        }

        private void CreateZone(string name, Vector3 position, float radius, Color accent)
        {
            var disc = CreateDisc(name + "Deck", radius, .08f, position);
            Apply(disc, MakeMaterial(name + "Deck", new Color(.045f,.039f,.033f,1f), .18f, .66f, sigilTexture));
            var ring = CreateRing(name + "Seal", radius * .84f, radius * .96f, .045f, position + Vector3.up * .10f);
            Apply(ring, MakeMaterial(name + "Seal", accent, .30f, .95f, null));
            var inner = CreateRing(name + "Inner", radius * .54f, radius * .59f, .035f, position + Vector3.up * .14f);
            Apply(inner, MakeMaterial(name + "Inner", accent * .62f, .26f, .78f, sigilTexture));
        }

        private void HideLegacyScaffolding(Transform canonicalRoot)
        {
            var renderers = canonicalRoot.GetComponentsInChildren<Renderer>(true);
            foreach (var renderer in renderers)
            {
                if (renderer == null) continue;
                var n = renderer.gameObject.name;
                if (n == "ArenaFloor" || n == "ArenaOuterRing" || n == "ArenaCoreRing" || n == "BattleCore" || n.Contains("ZoneMarker") || n.StartsWith("ArenaObelisk_"))
                    renderer.enabled = false;
            }
        }

        private void SuppressLegacyFallbacks()
        {
            var objects = stage.GetComponentsInChildren<Transform>(true);
            foreach (var t in objects)
            {
                if (t == null || root != null && t.IsChildOf(root)) continue;
                var n = t.name;
                if (n == "BattleEntryFallback" || n == "BossManifestation" || n == "DefeatFlash")
                {
                    t.gameObject.SetActive(false);
                    EnsureReplacement(n);
                }
            }
        }

        private void EnsureReplacement(string key)
        {
            if (replacements.ContainsKey(key) || root == null) return;
            var go = new GameObject("VexforgeReplacement_" + key);
            go.transform.SetParent(root, false);
            if (key == "BossManifestation")
            {
                go.transform.localPosition = new Vector3(0f,.70f,2.75f);
                var quad = CreateQuad("BossSigilReveal", Vector3.zero, new Vector3(2.3f,2.3f,1f));
                quad.transform.SetParent(go.transform, false);
                quad.transform.localRotation = Quaternion.Euler(90f,0f,0f);
                Apply(quad, MakeMaterial("BossReveal", Color.white, .10f, 1.22f, bossTexture));
            }
            else
            {
                go.transform.localPosition = Vector3.zero;
                var ring = CreateRing("ImpactReplacement", 1.0f, 1.5f, .07f, Vector3.zero);
                ring.transform.SetParent(go.transform, false);
                Apply(ring, MakeMaterial("ImpactReplacement", new Color(.50f,.18f,.09f,1f), .30f, 1.15f, sigilTexture));
            }
            go.SetActive(false);
            replacements[key] = go;
        }

        private void OnEventPresented(BattleEvent evt)
        {
            if (evt == null) return;
            var kind = (evt.event_type ?? string.Empty).ToUpperInvariant();
            if (kind.Contains("BOSS") || kind.Contains("RAID")) ToggleReplacement("BossManifestation", true, .70f);
            else if (kind.Contains("DEFEAT") || kind.Contains("VICTORY") || kind.Contains("MATCH_END")) ToggleReplacement("DefeatFlash", true, .34f);
        }

        private void ToggleReplacement(string key, bool active, float seconds)
        {
            if (!replacements.ContainsKey(key)) EnsureReplacement(key);
            GameObject go;
            if (!replacements.TryGetValue(key, out go) || go == null) return;
            go.SetActive(active);
            if (active) StartCoroutine(DisableReplacement(go, seconds));
        }

        private IEnumerator DisableReplacement(GameObject go, float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            if (go != null) go.SetActive(false);
        }

        private void AnimateAmbient()
        {
            if (root == null) return;
            var time = Time.unscaledTime;
            var core = root.Find("NexusCore");
            if (core != null) core.localScale = Vector3.one * (1f + Mathf.Sin(time * 1.4f) * .018f);
            var boss = root.Find("BossSanctum/BossHalo");
            if (boss != null) boss.localRotation = Quaternion.Euler(0f, time * 18f, 0f);
        }

        private GameObject CreateDisc(string name, float radius, float thickness, Vector3 position)
        {
            var go = new GameObject(name, typeof(MeshFilter), typeof(MeshRenderer));
            go.transform.SetParent(root, false);
            go.transform.localPosition = position;
            var filter = go.GetComponent<MeshFilter>();
            var mesh = BuildDiscMesh(name, radius, thickness, 96);
            filter.sharedMesh = mesh;
            ownedMeshes.Add(mesh);
            return go;
        }

        private GameObject CreateRing(string name, float inner, float outer, float height, Vector3 position)
        {
            var go = new GameObject(name, typeof(MeshFilter), typeof(MeshRenderer));
            go.transform.SetParent(root, false);
            go.transform.localPosition = position;
            var mesh = BuildRingMesh(name, inner, outer, height, 96);
            go.GetComponent<MeshFilter>().sharedMesh = mesh;
            ownedMeshes.Add(mesh);
            return go;
        }

        private GameObject CreateQuad(string name, Vector3 position, Vector3 scale)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Quad);
            go.name = name;
            go.transform.SetParent(root, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            RemoveCollider(go);
            return go;
        }

        private Material MakeMaterial(string name, Color color, float metallic, float smoothness, Texture2D texture)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Standard");
            if (shader == null) return null;
            var mat = new Material(shader) { name = "VEXFORGE_" + name };
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
            if (mat.HasProperty("_Color")) mat.SetColor("_Color", color);
            if (mat.HasProperty("_Metallic")) mat.SetFloat("_Metallic", metallic);
            if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", smoothness);
            if (texture != null)
            {
                if (mat.HasProperty("_BaseMap")) mat.SetTexture("_BaseMap", texture);
                if (mat.HasProperty("_MainTex")) mat.SetTexture("_MainTex", texture);
            }
            if (mat.HasProperty("_EmissionColor")) { mat.SetColor("_EmissionColor", color * 1.18f); mat.EnableKeyword("_EMISSION"); }
            materials.Add(mat);
            return mat;
        }

        private static void Apply(GameObject go, Material mat)
        {
            if (go == null) return;
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null && mat != null) { renderer.sharedMaterial = mat; renderer.shadowCastingMode = ShadowCastingMode.On; renderer.receiveShadows = true; }
        }
        private static void RemoveCollider(GameObject go) { var c = go == null ? null : go.GetComponent<Collider>(); if (c != null) Object.Destroy(c); }

        private static Mesh BuildDiscMesh(string name, float radius, float thickness, int segments)
        {
            var mesh = new Mesh { name = name + "Mesh" };
            var v = new Vector3[(segments + 1) * 2];
            var uv = new Vector2[v.Length];
            var tri = new int[segments * 6];
            for (var i = 0; i <= segments; i++)
            {
                var a = (Mathf.PI * 2f * i) / segments;
                var x = Mathf.Cos(a) * radius;
                var z = Mathf.Sin(a) * radius;
                v[i] = new Vector3(x, thickness, z); v[i + segments + 1] = new Vector3(x, 0f, z);
                uv[i] = new Vector2((x / radius + 1f)*.5f,(z / radius + 1f)*.5f);
                uv[i + segments + 1] = uv[i];
            }
            for (var i = 0; i < segments; i++)
            {
                var a = i; var b = i + 1; var c = i + segments + 1; var d = c + 1;
                var k = i * 6; tri[k] = a; tri[k+1] = d; tri[k+2] = b; tri[k+3] = a; tri[k+4] = c; tri[k+5] = d;
            }
            mesh.vertices = v; mesh.uv = uv; mesh.triangles = tri; mesh.RecalculateNormals(); return mesh;
        }

        private static Mesh BuildRingMesh(string name, float inner, float outer, float height, int segments)
        {
            var mesh = new Mesh { name = name + "RingMesh" };
            var v = new Vector3[(segments + 1) * 4]; var uv = new Vector2[v.Length]; var tri = new int[segments * 12];
            for (var i=0;i<=segments;i++)
            {
                var a=2f*Mathf.PI*i/segments; var ca=Mathf.Cos(a); var sa=Mathf.Sin(a); var idx=i*4;
                v[idx]=new Vector3(ca*outer,height,sa*outer); v[idx+1]=new Vector3(ca*inner,height,sa*inner); v[idx+2]=new Vector3(ca*outer,0f,sa*outer); v[idx+3]=new Vector3(ca*inner,0f,sa*inner);
                uv[idx]=new Vector2(i/(float)segments,1f); uv[idx+1]=new Vector2(i/(float)segments,0f); uv[idx+2]=uv[idx]; uv[idx+3]=uv[idx+1];
            }
            for(var i=0;i<segments;i++)
            {
                var s=i*4; var n=s+4; var k=i*12;
                tri[k]=s;tri[k+1]=n;tri[k+2]=s+1; tri[k+3]=s+1;tri[k+4]=n;tri[k+5]=n+1;
                tri[k+6]=s+2;tri[k+7]=s+3;tri[k+8]=n+2; tri[k+9]=s+3;tri[k+10]=n+3;tri[k+11]=n+2;
            }
            mesh.vertices=v;mesh.uv=uv;mesh.triangles=tri;mesh.RecalculateNormals();return mesh;
        }

        private void OnDestroy()
        {
            if (director != null) director.EventPresented -= OnEventPresented;
            foreach (var mat in materials) if (mat != null) Destroy(mat);
            materials.Clear();
            foreach (var mesh in ownedMeshes) if (mesh != null) Destroy(mesh);
            ownedMeshes.Clear();
        }
    }
}
