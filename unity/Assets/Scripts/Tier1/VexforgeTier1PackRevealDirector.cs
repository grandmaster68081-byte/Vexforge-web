using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1PackRevealDirector : MonoBehaviour
    {
        private Canvas canvas;
        private Image background;
        private RectTransform relic;
        private Text status;
        private float clock;
        private VexforgeTier1AssetRegistry assets;
        private Coroutine revealRoutine;

        public void Initialize(VexforgeTier1AssetRegistry registry)
        {
            if(canvas!=null)return;
            assets=registry;
            canvas=VexforgeTier1Ui.MakeCanvas("VexforgeTier1PackReveal",84,3.4f);
            var veil=VexforgeTier1Ui.Panel(canvas.transform,"Veil",new Color(.002f,.002f,.006f,.72f));VexforgeTier1Ui.Full(veil.rectTransform);
            background=VexforgeTier1Ui.Panel(canvas.transform,"Vault",new Color(.006f,.008f,.013f,1f));VexforgeTier1Ui.Anchor(background.rectTransform,.04f,.07f,.96f,.93f);
            var hero=assets==null?null:assets.LoadTexture("VF_PACK_VAULT_HERO","VF_NEXUS_CITADEL_HERO");
            if(hero!=null){background.color=Color.white;background.sprite=Sprite.Create(hero,new Rect(0,0,hero.width,hero.height),new Vector2(.5f,.5f),100f);background.preserveAspect=false;}
            var shade=VexforgeTier1Ui.Panel(background.transform,"Shade",new Color(.002f,.003f,.007f,.52f));VexforgeTier1Ui.Full(shade.rectTransform);
            var title=VexforgeTier1Ui.Label(background.transform,"Title","PACK VAULT",30,VexforgeTier1Ui.Gold,TextAnchor.MiddleCenter);VexforgeTier1Ui.Anchor(title.rectTransform,.08f,.82f,.92f,.92f);
            var relicGo=new GameObject("Relic",typeof(RectTransform),typeof(RawImage));relicGo.transform.SetParent(background.transform,false);relic=relicGo.GetComponent<RectTransform>();VexforgeTier1Ui.Anchor(relic,.22f,.24f,.78f,.78f);var raw=relicGo.GetComponent<RawImage>();raw.texture=assets==null?null:assets.LoadTexture("VF_PACK_RELIC");raw.color=Color.white;
            status=VexforgeTier1Ui.Label(background.transform,"Status","ABRIENDO…",12,VexforgeTier1Ui.Muted,TextAnchor.MiddleCenter);VexforgeTier1Ui.Anchor(status.rectTransform,.15f,.14f,.85f,.20f);
            canvas.gameObject.SetActive(false);
        }
        public void Show(){if(canvas==null)return;if(revealRoutine!=null)StopCoroutine(revealRoutine);canvas.gameObject.SetActive(true);clock=0f;revealRoutine=StartCoroutine(RevealRoutine());}
        public void Hide(){if(revealRoutine!=null){StopCoroutine(revealRoutine);revealRoutine=null;}if(canvas!=null)canvas.gameObject.SetActive(false);}
        private IEnumerator RevealRoutine(){status.text="SELLANDO EL VAULT…";yield return new WaitForSecondsRealtime(.55f);status.text="REVELANDO";yield return new WaitForSecondsRealtime(.72f);status.text="CONTENIDO AUTORIZADO POR EL SERVIDOR";revealRoutine=null;}
        private void OnDestroy(){if(revealRoutine!=null)StopCoroutine(revealRoutine);if(background!=null&&background.sprite!=null)Destroy(background.sprite);}
        private void Update(){if(canvas==null||!canvas.gameObject.activeSelf||relic==null)return;clock+=Time.unscaledDeltaTime;relic.localEulerAngles=new Vector3(0f,0f,Mathf.Sin(clock*1.4f)*2.4f);var s=1f+Mathf.Sin(clock*1.8f)*.025f;relic.localScale=Vector3.one*s;}
    }
}
