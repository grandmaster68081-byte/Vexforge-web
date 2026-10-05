using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;
using Vexforge.GameState;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1DiegeticRoomDirector : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private Canvas canvas;
        private Image hero;
        private Text eyebrow;
        private Text title;
        private Text body;
        private RectTransform portalRow;
        private Button backButton;
        private Button packButton;
        private Button economyButton;
        private VexforgeTier1PackRevealDirector packReveal;
        private VexforgeTier1EconomyHub economyHub;
        private bool built;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            if (built) return;
            app=host;assets=registry;Build();built=true;
            economyHub=gameObject.GetComponent<VexforgeTier1EconomyHub>();
            if(economyHub==null)economyHub=gameObject.AddComponent<VexforgeTier1EconomyHub>();
            economyHub.Initialize(app);
        }

        public void Show(GameRoute route)
        {
            if(!built)Build();
            canvas.gameObject.SetActive(true);
            ClearPortals();
            if(route!=GameRoute.Economy&&economyHub!=null)economyHub.Hide();
            if (backButton != null) backButton.gameObject.SetActive(route != GameRoute.Nexus);
            if(route==GameRoute.Nexus)
            {
                eyebrow.text="THE NEXUS";
                title.text="VEXFORGE";
                body.text=BuildNexusReadout(app.GameState);
                SetHero("VF_NEXUS_CITADEL_HERO");
                BuildNexusPortals();
            }
            else if(route==GameRoute.World)
            {eyebrow.text="WORLD ATLAS";title.text="JEFES DEL MUNDO";body.text="Selecciona un registro activo para consultar su ficha.\n\nLos encuentros no disponibles no crean combates ni recompensas locales.";SetHero("VF_NEXUS_CITADEL_HERO");}
            else if(route==GameRoute.Missions)
            {eyebrow.text="MISSION HALL";title.text="EXPEDICIONES";body.text=BuildMissionReadout(app.GameState);SetHero("VF_MISSION_HALL_HERO");}
            else if(route==GameRoute.Economy)
            {eyebrow.text="TREASURY VAULT";title.text="TESORERÍA";body.text=BuildTreasuryReadout(app.GameState);SetHero("VF_TREASURY_VAULT_HERO");}
            else
            {eyebrow.text="PLAYER HALL";title.text="IDENTIDAD";body.text=BuildProfileReadout(app.GameState);SetHero("VF_NEXUS_CITADEL_HERO");}

            var isEconomy=route==GameRoute.Economy;
            if(backButton!=null)
                VexforgeTier1Ui.Anchor(backButton.GetComponent<RectTransform>(),.03f,.035f,.25f,.095f);
            if(packButton!=null)
            {
                packButton.gameObject.SetActive(isEconomy);
                VexforgeTier1Ui.Anchor(packButton.GetComponent<RectTransform>(),.67f,.035f,.97f,.095f);
            }
            if(economyButton!=null)
            {
                economyButton.gameObject.SetActive(isEconomy);
                VexforgeTier1Ui.Anchor(economyButton.GetComponent<RectTransform>(),.29f,.035f,.64f,.095f);
            }
        }

        public void Hide(){if(canvas!=null)canvas.gameObject.SetActive(false);if(economyHub!=null)economyHub.Hide();}
        public void BindPackReveal(VexforgeTier1PackRevealDirector director){packReveal=director;}

        private void Build()
        {
            canvas=VexforgeTier1Ui.MakeCanvas("VexforgeTier1WorldRooms",44,4.8f);
            var bg=VexforgeTier1Ui.Panel(canvas.transform,"Background",new Color(.008f,.009f,.014f,.96f));VexforgeTier1Ui.Full(bg.rectTransform);
            hero=VexforgeTier1Ui.Panel(canvas.transform,"SanctumHero",new Color(.006f,.008f,.013f,1f));VexforgeTier1Ui.Anchor(hero.rectTransform,.025f,.12f,.975f,.97f);
            hero.type=Image.Type.Simple;hero.preserveAspect=false;
            var shade=VexforgeTier1Ui.Panel(hero.transform,"Veil",new Color(.006f,.008f,.012f,.45f));VexforgeTier1Ui.Full(shade.rectTransform);
            var plaque=VexforgeTier1Ui.Panel(canvas.transform,"Plaque",new Color(.012f,.014f,.019f,.88f));VexforgeTier1Ui.Anchor(plaque.rectTransform,.065f,.14f,.935f,.67f);
            eyebrow=VexforgeTier1Ui.Label(plaque.transform,"Eyebrow","",12,VexforgeTier1Ui.GoldSoft,TextAnchor.UpperLeft);VexforgeTier1Ui.Anchor(eyebrow.rectTransform,.07f,.83f,.93f,.92f);
            title=VexforgeTier1Ui.Label(plaque.transform,"Title","",32,VexforgeTier1Ui.Gold,TextAnchor.MiddleLeft);VexforgeTier1Ui.Anchor(title.rectTransform,.07f,.69f,.93f,.82f);
            body=VexforgeTier1Ui.Label(plaque.transform,"Body","",15,VexforgeTier1Ui.Text,TextAnchor.UpperLeft);VexforgeTier1Ui.Anchor(body.rectTransform,.07f,.14f,.93f,.66f);
            portalRow=new GameObject("NexusPortals",typeof(RectTransform)).GetComponent<RectTransform>();
            portalRow.SetParent(canvas.transform,false); VexforgeTier1Ui.Anchor(portalRow,.075f,.025f,.925f,.115f);
            backButton=VexforgeTier1Ui.Button(canvas.transform,"Back","NEXUS",()=>app.Navigation.Navigate(GameRoute.Nexus),new Color(.055f,.052f,.048f,.96f),12);
            VexforgeTier1Ui.Anchor(backButton.GetComponent<RectTransform>(),.03f,.035f,.25f,.095f);
            backButton.gameObject.SetActive(false);
            packButton=VexforgeTier1Ui.Button(canvas.transform,"PackVault","PACK VAULT",()=>{if(packReveal!=null)packReveal.ShowCatalog();},new Color(.13f,.09f,.045f,.98f),12);
            VexforgeTier1Ui.Anchor(packButton.GetComponent<RectTransform>(),.67f,.035f,.97f,.095f);
            packButton.gameObject.SetActive(false);
            economyButton=VexforgeTier1Ui.Button(canvas.transform,"EconomyHub","CARTERA · MERCADO",()=>{if(economyHub!=null)economyHub.OpenWallet();},new Color(.045f,.10f,.085f,.98f),10);
            VexforgeTier1Ui.Anchor(economyButton.GetComponent<RectTransform>(),.29f,.035f,.64f,.095f);
            economyButton.gameObject.SetActive(false);
            canvas.gameObject.SetActive(false);
        }

        private void BuildNexusPortals()
        {
            AddPortal("Expediciones",()=>app.Navigation.Navigate(GameRoute.Missions),0f,.235f);
            AddPortal("Tesorería",()=>app.Navigation.Navigate(GameRoute.Economy),.255f,.49f);
            AddPortal("Atlas",()=>app.Navigation.Navigate(GameRoute.World),.51f,.745f);
            AddPortal("Perfil",()=>app.Navigation.Navigate(GameRoute.Profile),.765f,1f);
        }

        private void AddPortal(string label,UnityEngine.Events.UnityAction action,float x1,float x2)
        {
            var b=VexforgeTier1Ui.Button(portalRow,"Portal_"+label,label.ToUpperInvariant(),action,new Color(.055f,.050f,.046f,.96f),11);
            VexforgeTier1Ui.Anchor(b.GetComponent<RectTransform>(),x1,0f,x2,1f);
        }

        private void ClearPortals()
        {
            if(portalRow==null)return;
            for(var i=portalRow.childCount-1;i>=0;i--)Destroy(portalRow.GetChild(i).gameObject);
        }

        private string BuildNexusReadout(GameStateStore state)
        {
            var name=state==null||state.Profile==null||string.IsNullOrWhiteSpace(state.Profile.display_name)?"VESSEL":state.Profile.display_name;
            var deck=state==null||state.Deck==null?0:state.Deck.Length;
            var cards=state==null||state.Catalog==null?0:state.Catalog.Length;
            return name.ToUpperInvariant()+"\n\nEL NEXUS ES EL PUNTO DE PARTIDA.\n\n"+cards+" CARTAS REPORTADAS · "+deck+" ESPACIOS DE FORMACIÓN\n\nBATALLA ES EL CENTRO. ARCHIVO Y FORJA PREPARAN TU MAZO. LAS EXPEDICIONES Y LA TESORERÍA VIVEN DETRÁS DE ESTOS SELLOS.";
        }
        private string BuildMissionReadout(GameStateStore state)
        {
            var count=state==null||state.Missions==null?0:state.Missions.Length;
            return "Los contratos son expediciones vivas del mundo.\n\n"+count+" ACTIVIDADES DISPONIBLES\n\nENERGÍA Y RECOMPENSAS: ESTADO CONFIRMADO\n\nCuando haya un enfrentamiento disponible, su entrada llevará al campo de batalla y no a una pantalla de gestión.";
        }
        private string BuildTreasuryReadout(GameStateStore state)
        {
            var w=state==null?null:state.Wallet;
            if(w==null)return "LA CARTERA NO ESTÁ REPORTADA POR LA SESIÓN ACTUAL.";
            return "VEX IN-GAME  "+w.vex_ingame+"\nVEX TRADEABLE  "+w.vex_tradeable+"\nRESERVADO IN-GAME  "+w.reserved_ingame+"\nRESERVADO TRADEABLE  "+w.reserved_tradeable+"\n\nEsta vista muestra datos confirmados y no calcula emisiones, precios, retiros, comisiones ni recompensas.";
        }
        private string BuildProfileReadout(GameStateStore state)
        {
            if(state==null)return "IDENTIDAD NO DISPONIBLE.";
            var name=state.Profile==null?"VESSEL":(string.IsNullOrWhiteSpace(state.Profile.display_name)?"VESSEL":state.Profile.display_name);
            var level=state.Progress==null?"NO REPORTADO":state.Progress.level.ToString();
            var rank=state.Rank==null?"NO REPORTADO":(string.IsNullOrWhiteSpace(state.Rank.tier)?"NO REPORTADO":state.Rank.tier);
            var stats=state.Stats;
            return name.ToUpperInvariant()+"\n\nNIVEL  "+level+"  ·  RANGO  "+rank+
                   "\nVICTORIAS PVP  "+(stats==null?"NO DISPONIBLE":stats.pvp_wins.ToString())+
                   "  ·  MISIONES  "+(stats==null?"NO DISPONIBLE":stats.missions_completed.ToString())+
                   "\nCARTAS  "+(stats==null?"NO DISPONIBLE":stats.cards_owned.ToString())+
                   "  ·  VENTAS  "+(stats==null?"NO DISPONIBLE":stats.market_sales.ToString())+
                   "  ·  JEFES  "+(stats==null?"NO DISPONIBLE":stats.boss_kills.ToString())+
                   "  ·  PACKS  "+(stats==null?"NO DISPONIBLE":stats.packs_opened.ToString())+
                   "\n\nLos valores proceden de tus estadísticas confirmadas.";
        }
        private void SetHero(string key)
        {
            var tex=assets==null?null:assets.LoadTexture(key,"VF_NEXUS_CITADEL_HERO");
            if(tex==null||hero==null)return;
            hero.color=Color.white;
            var old=hero.sprite;hero.sprite=Sprite.Create(tex,new Rect(0,0,tex.width,tex.height),new Vector2(.5f,.5f),100f);if(old!=null)Destroy(old);
        }
    }
}
