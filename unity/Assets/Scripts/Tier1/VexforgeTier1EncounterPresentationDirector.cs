using System.Collections;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Presentation;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Converts server event vocabulary into mode-specific battlefield dressing without changing combat rules.
    /// The same canonical event stream drives every mode.
    /// </summary>
    public sealed class VexforgeTier1EncounterPresentationDirector : MonoBehaviour
    {
        private BattlePresentationDirector director;
        private GameObject manifestation;
        private MeshRenderer meshRenderer;
        private Light point;
        private float clock;
        private Color targetColor = new Color(.40f,.24f,.10f,1f);
        private float targetScale = 1f;
        private bool bound;

        public void Initialize(BattlePresentationDirector canonical, VexforgeBattlefieldStage canonicalStage)
        {
            if (bound || canonical == null) return;
            director = canonical;
            director.EventPresented += OnEvent;
            bound = true;
            StartCoroutine(FindBattlefield(canonicalStage));
        }

        private IEnumerator FindBattlefield(VexforgeBattlefieldStage canonicalStage)
        {
            for(var i=0;i<300;i++)
            {
                Transform parent = null;
                if(canonicalStage!=null)
                {
                    var arena=canonicalStage.transform.Find("BattlefieldArena");
                    parent=arena==null?canonicalStage.transform:arena;
                    var premium=parent.Find("VexforgePremiumBattlefield");
                    if(premium!=null){Build(premium);yield break;}
                }
                var go=GameObject.Find("VexforgePremiumBattlefield");
                if(go!=null){Build(go.transform);yield break;}
                yield return null;
            }
        }

        private void Build(Transform parent)
        {
            if(manifestation!=null||parent==null)return;
            manifestation=new GameObject("VexforgeEncounterManifestation");
            manifestation.transform.SetParent(parent,false);
            manifestation.transform.localPosition=new Vector3(0f,.82f,2.82f);
            meshRenderer=manifestation.AddComponent<MeshRenderer>();
            var filter=manifestation.AddComponent<MeshFilter>();
            filter.sharedMesh=BuildStarMesh("VexforgeEncounterCrown",1.28f,.62f,.16f,18);
            var shader=Shader.Find("Universal Render Pipeline/Lit")??Shader.Find("Standard");
            if(shader!=null)
            {
                var mat=new Material(shader){name="VEXFORGE_EncounterEnergy"};
                if(mat.HasProperty("_BaseColor"))mat.SetColor("_BaseColor",targetColor);
                if(mat.HasProperty("_Color"))mat.SetColor("_Color",targetColor);
                if(mat.HasProperty("_Metallic"))mat.SetFloat("_Metallic",.18f);
                if(mat.HasProperty("_Smoothness"))mat.SetFloat("_Smoothness",.84f);
                if(mat.HasProperty("_EmissionColor")){mat.EnableKeyword("_EMISSION");mat.SetColor("_EmissionColor",targetColor*.42f);}
                meshRenderer.sharedMaterial=mat;
            }
            point=manifestation.AddComponent<Light>();
            point.type=LightType.Point;point.range=4.8f;point.intensity=1.5f;point.color=targetColor;
        }

        private void OnEvent(BattleEvent evt)
        {
            if(evt==null||manifestation==null)return;
            var kind=(evt.event_type??string.Empty).ToUpperInvariant();
            if(kind.Contains("CLAN"))SetMode(new Color(.64f,.17f,.11f,1f),1.08f);
            else if(kind.Contains("RAID"))SetMode(new Color(.30f,.16f,.58f,1f),1.12f);
            else if(kind.Contains("BOSS"))SetMode(new Color(.62f,.08f,.09f,1f),1.18f);
            else if(kind.Contains("MISSION")||kind.Contains("EXPEDITION"))SetMode(new Color(.16f,.44f,.60f,1f),.96f);
            else if(kind.Contains("PVP")||kind.Contains("MATCH"))SetMode(new Color(.53f,.34f,.10f,1f),1f);
            if(kind.Contains("DEFEAT"))StartCoroutine(Pulse(.68f));
            if(kind.Contains("VICTORY"))StartCoroutine(Pulse(1.36f));
        }

        private void SetMode(Color color,float scale)
        {
            targetColor=color;targetScale=scale;
            if(meshRenderer!=null&&meshRenderer.sharedMaterial!=null)
            {
                var mat=meshRenderer.sharedMaterial;
                if(mat.HasProperty("_BaseColor"))mat.SetColor("_BaseColor",color);
                if(mat.HasProperty("_Color"))mat.SetColor("_Color",color);
                if(mat.HasProperty("_EmissionColor"))mat.SetColor("_EmissionColor",color*.42f);
            }
            if(point!=null)point.color=color;
            if(manifestation!=null)manifestation.transform.localScale=Vector3.one*scale;
        }

        private IEnumerator Pulse(float peak)
        {
            if(manifestation==null)yield break;
            var baseScale=Vector3.one*targetScale;var t=0f;const float duration=.48f;
            while(t<duration&&manifestation!=null){t+=Time.unscaledDeltaTime;var n=Mathf.Clamp01(t/duration);var e=Mathf.Sin(n*Mathf.PI);manifestation.transform.localScale=baseScale*(1f+e*(peak-1f));yield return null;}
            if(manifestation!=null)manifestation.transform.localScale=baseScale;
        }

        private void Update()
        {
            if(manifestation==null)return;
            clock+=Time.unscaledDeltaTime;
            manifestation.transform.localRotation=Quaternion.Euler(0f,clock*11f,Mathf.Sin(clock*1.4f)*3f);
        }

        private static Mesh BuildStarMesh(string name,float outer,float inner,float thickness,int points)
        {
            var mesh=new Mesh{name=name};
            var count=points*2;var verts=new Vector3[count*2];var tris=new int[count*6];
            for(var i=0;i<count;i++){var a=(Mathf.PI*2f*i)/count;var r=(i%2==0)?outer:inner;var x=Mathf.Cos(a)*r;var z=Mathf.Sin(a)*r;verts[i]=new Vector3(x,thickness*.5f,z);verts[i+count]=new Vector3(x,-thickness*.5f,z);}
            var k=0;
            for(var i=0;i<count;i++){var n=(i+1)%count;tris[k++]=i;tris[k++]=n;tris[k++]=i+count;tris[k++]=n;tris[k++]=n+count;tris[k++]=i+count;}
            mesh.vertices=verts;mesh.triangles=tris;mesh.RecalculateNormals();return mesh;
        }

        private void OnDestroy(){if(director!=null&&bound)director.EventPresented-=OnEvent;if(meshRenderer!=null&&meshRenderer.sharedMaterial!=null)Destroy(meshRenderer.sharedMaterial);}
    }
}
