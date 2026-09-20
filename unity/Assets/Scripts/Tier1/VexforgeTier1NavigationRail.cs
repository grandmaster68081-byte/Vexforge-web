using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1NavigationRail : MonoBehaviour
    {
        private VexforgeApp app;
        private Canvas canvas;
        private Button[] buttons;
        private readonly string[] labels = { "NEXUS", "BATALLA", "ARCHIVO", "FORJA", "PERFIL" };
        private readonly GameRoute[] routes = { GameRoute.Nexus, GameRoute.Battle, GameRoute.Collection, GameRoute.Deck, GameRoute.Profile };
        private bool battleLocked;

        public void Initialize(VexforgeApp host)
        {
            app=host;
            if(canvas!=null)return;
            Build();
            Sync(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);
        }
        public void Show(GameRoute route){if(canvas==null)Build();canvas.gameObject.SetActive(route!=GameRoute.Battle);Sync(route);}
        public void Hide(){if(canvas!=null)canvas.gameObject.SetActive(false);}
        public void SetBattleLocked(bool locked){battleLocked=locked;Sync(app==null?GameRoute.Nexus:app.Navigation.CurrentRoute);}

        private void Build()
        {
            canvas=VexforgeTier1Ui.MakeCanvas("VexforgeTier1NavigationRail",72,4.0f);
            var dock=VexforgeTier1Ui.Panel(canvas.transform,"RuneDock",new Color(.004f,.006f,.010f,.94f));
            VexforgeTier1Ui.Anchor(dock.rectTransform,.045f,.015f,.955f,.082f);
            buttons=new Button[5];
            for(var i=0;i<5;i++){var index=i;var button=VexforgeTier1Ui.Button(dock.transform,"Nav_"+i,labels[i],()=>Navigate(routes[index]),new Color(.055f,.050f,.046f,.94f),11);buttons[i]=button;VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(),.012f+i*.198f,.12f,.188f+i*.198f,.88f);}
            canvas.gameObject.SetActive(false);
        }
        private void Navigate(GameRoute route){if(battleLocked)return;if(app!=null&&app.Navigation!=null)app.Navigation.Navigate(route);}
        private void Sync(GameRoute route)
        {
            if(buttons==null)return;
            for(var i=0;i<buttons.Length;i++)
            {
                var c=buttons[i].colors;
                var selected=i==Index(route);
                c.normalColor=selected?new Color(.30f,.20f,.09f,.96f):new Color(.055f,.050f,.046f,.94f);
                c.highlightedColor=new Color(.42f,.29f,.12f,1f);
                c.pressedColor=new Color(.18f,.12f,.07f,1f);
                c.disabledColor=new Color(.055f,.050f,.046f,.45f);
                buttons[i].colors=c;
                buttons[i].interactable=!battleLocked;
            }
        }
        private static int Index(GameRoute route){switch(route){case GameRoute.Battle:return 1;case GameRoute.Collection:return 2;case GameRoute.Deck:return 3;case GameRoute.Profile:return 4;default:return 0;}}
    }
}
