using UnityEngine;
using UnityEngine.UI;

namespace Vexforge.Tier1
{
    internal static class VexforgeTier1Ui
    {
        public static readonly Color Ink = new Color(.007f,.009f,.013f,.96f);
        public static readonly Color BlackGlass = new Color(.013f,.015f,.020f,.86f);
        public static readonly Color Gold = new Color(.84f,.67f,.36f,1f);
        public static readonly Color GoldSoft = new Color(.63f,.52f,.33f,1f);
        public static readonly Color Text = new Color(.90f,.88f,.82f,1f);
        public static readonly Color Muted = new Color(.56f,.61f,.69f,1f);
        public static readonly Color Blue = new Color(.22f,.58f,.84f,1f);
        public static readonly Color Crimson = new Color(.58f,.08f,.11f,1f);
        private static Font headingFont;
        private static Font bodyFont;

        public static Canvas MakeCanvas(string name,int order,float planeDistance=4.5f)
        {
            var go=new GameObject(name,typeof(RectTransform),typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster));
            var canvas=go.GetComponent<Canvas>();canvas.renderMode=RenderMode.ScreenSpaceCamera;canvas.worldCamera=Camera.main;canvas.planeDistance=planeDistance;canvas.sortingOrder=order;
            var scaler=go.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1080f,2340f);scaler.matchWidthOrHeight=.50f;
            return canvas;
        }

        public static Image Panel(Transform parent,string name,Color color)
        {
            var go=new GameObject(name,typeof(RectTransform),typeof(Image));go.transform.SetParent(parent,false);var image=go.GetComponent<Image>();image.color=color;return image;
        }

        public static Text Label(Transform parent,string name,string value,int size,Color color,TextAnchor alignment)
        {
            var go=new GameObject(name,typeof(RectTransform),typeof(Text));go.transform.SetParent(parent,false);
            var label=go.GetComponent<Text>();label.font=ResolveFont(size);label.text=value??string.Empty;label.fontSize=size;label.color=color;label.alignment=alignment;label.horizontalOverflow=HorizontalWrapMode.Wrap;label.verticalOverflow=VerticalWrapMode.Truncate;label.supportRichText=false;label.raycastTarget=false;
            if(size>=26)label.fontStyle=FontStyle.Bold;
            return label;
        }

        public static Button Button(Transform parent,string name,string label,UnityEngine.Events.UnityAction action,Color fill,int size=15)
        {
            var go=new GameObject(name,typeof(RectTransform),typeof(Image),typeof(Button));go.transform.SetParent(parent,false);
            var image=go.GetComponent<Image>();image.color=fill;
            var button=go.GetComponent<Button>();button.transition=Selectable.Transition.ColorTint;
            var colors=button.colors;colors.normalColor=fill;colors.highlightedColor=Color.Lerp(fill,Gold,.16f);colors.pressedColor=Color.Lerp(fill,Gold,.28f);colors.selectedColor=colors.highlightedColor;colors.disabledColor=new Color(fill.r,fill.g,fill.b,.35f);button.colors=colors;
            if(action!=null)button.onClick.AddListener(action);
            var text=Label(go.transform,"Text",label,size,Text,TextAnchor.MiddleCenter);Full(text.rectTransform);
            var shadow=go.AddComponent<Shadow>();shadow.effectColor=new Color(0f,0f,0f,.42f);shadow.effectDistance=new Vector2(0f,-2f);
            var outline=go.AddComponent<Outline>();outline.effectColor=new Color(Gold.r,Gold.g,Gold.b,.18f);outline.effectDistance=new Vector2(1.1f,1.1f);
            return button;
        }

        private static Font ResolveFont(int size)
        {
            if(size>=26&&headingFont!=null)return headingFont;
            if(size<26&&bodyFont!=null)return bodyFont;
            var fonts=Resources.FindObjectsOfTypeAll<Font>();
            string[] preferred=size>=26?new[]{"Cinzel","Trajan","Rajdhani","Inter"}:new[]{"Rajdhani","Inter","Cinzel","Trajan"};
            for(var p=0;p<preferred.Length;p++)
                for(var i=0;i<fonts.Length;i++)
                    if(fonts[i]!=null&&!string.IsNullOrWhiteSpace(fonts[i].name)&&fonts[i].name.IndexOf(preferred[p],System.StringComparison.OrdinalIgnoreCase)>=0)
                    {
                        if(size>=26)headingFont=fonts[i];else bodyFont=fonts[i];
                        return fonts[i];
                    }
            var fallback=Resources.GetBuiltinResource<Font>("Arial.ttf");
            if(size>=26)headingFont=fallback;else bodyFont=fallback;
            return fallback;
        }

        public static void Anchor(RectTransform rect,float x1,float y1,float x2,float y2){rect.anchorMin=new Vector2(x1,y1);rect.anchorMax=new Vector2(x2,y2);rect.offsetMin=Vector2.zero;rect.offsetMax=Vector2.zero;}
        public static void Full(RectTransform rect){Anchor(rect,0f,0f,1f,1f);}
    }
}
