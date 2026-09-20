using UnityEngine;
using UnityEngine.UI;
using Vexforge.Core;
using Vexforge.Backend;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1TutorialDirector : MonoBehaviour
    {
        private const string Prefix = "vexforge.tier1.tutorial.v13.";
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private VexforgeTier1BattleGate battleGate;
        private Canvas canvas;
        private Image hero;
        private Text eyebrow;
        private Text title;
        private Text stepText;
        private Text body;
        private Button next;
        private Button exit;
        private int step;
        private bool active;
        private bool tutorialBattleRequested;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            app = host;
            assets = registry;
            Build();
        }

        public void BindBattleGate(VexforgeTier1BattleGate gate)
        {
            if (battleGate == gate) return;
            if (battleGate != null) battleGate.BattleCompleted -= OnBattleCompleted;
            battleGate = gate;
            if (battleGate != null) battleGate.BattleCompleted += OnBattleCompleted;
        }

        public void TryStart()
        {
            if (app == null || app.Session == null || !app.Session.IsAuthenticated) return;
            var completeKey = CompleteKey();
            if (!string.IsNullOrWhiteSpace(completeKey) && PlayerPrefs.GetInt(completeKey, 0) == 1) return;
            step = Mathf.Clamp(PlayerPrefs.GetInt(StepKey(), 0), 0, 7);
            tutorialBattleRequested = false;
            active = true;
            canvas.gameObject.SetActive(true);
            Render();
        }

        public void Hide()
        {
            active = false;
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        private void Build()
        {
            if (canvas != null) return;
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1Tutorial", 90, 3.5f);
            var veil = VexforgeTier1Ui.Panel(canvas.transform, "Veil", new Color(.001f,.002f,.005f,.64f)); VexforgeTier1Ui.Full(veil.rectTransform); veil.raycastTarget = false;
            var plaque = VexforgeTier1Ui.Panel(canvas.transform, "TutorialPlaque", new Color(.009f,.012f,.018f,.96f)); VexforgeTier1Ui.Anchor(plaque.rectTransform,.05f,.11f,.95f,.89f);
            hero = VexforgeTier1Ui.Panel(plaque.transform,"Hero",Color.white); VexforgeTier1Ui.Anchor(hero.rectTransform,.02f,.02f,.98f,.98f); hero.transform.SetAsFirstSibling(); hero.raycastTarget = false;
            var heroVeil = VexforgeTier1Ui.Panel(hero.transform,"HeroShade",new Color(.004f,.006f,.010f,.46f)); VexforgeTier1Ui.Full(heroVeil.rectTransform); heroVeil.raycastTarget = false;
            eyebrow = VexforgeTier1Ui.Label(plaque.transform,"Eyebrow","",12,VexforgeTier1Ui.GoldSoft,TextAnchor.UpperLeft); VexforgeTier1Ui.Anchor(eyebrow.rectTransform,.08f,.86f,.92f,.93f);
            title = VexforgeTier1Ui.Label(plaque.transform,"Title","",34,VexforgeTier1Ui.Gold,TextAnchor.MiddleLeft); VexforgeTier1Ui.Anchor(title.rectTransform,.08f,.72f,.92f,.84f);
            stepText = VexforgeTier1Ui.Label(plaque.transform,"Step","",11,VexforgeTier1Ui.Muted,TextAnchor.MiddleLeft); VexforgeTier1Ui.Anchor(stepText.rectTransform,.08f,.66f,.92f,.71f);
            body = VexforgeTier1Ui.Label(plaque.transform,"Body","",16,VexforgeTier1Ui.Text,TextAnchor.UpperLeft); VexforgeTier1Ui.Anchor(body.rectTransform,.08f,.30f,.92f,.63f);
            next = VexforgeTier1Ui.Button(plaque.transform,"Next","CONTINUAR",Next,new Color(.065f,.056f,.045f,.97f),15); VexforgeTier1Ui.Anchor(next.GetComponent<RectTransform>(),.08f,.16f,.62f,.235f);
            exit = VexforgeTier1Ui.Button(plaque.transform,"Exit","SALIR",Finish,new Color(.032f,.035f,.040f,.91f),13); VexforgeTier1Ui.Anchor(exit.GetComponent<RectTransform>(),.65f,.16f,.92f,.235f);
            canvas.gameObject.SetActive(false);
        }

        private void Render()
        {
            if (!active) return;
            stepText.text = "RITE OF ENTRY · " + (step + 1) + " / 8";
            var art = "VF_NEXUS_CITADEL_HERO";
            switch (step)
            {
                case 0: eyebrow.text="NEXUS"; title.text="ENTRA EN VEXFORGE"; body.text="Aprende el mundo mediante acciones reales: entra, prepara, desafía y vuelve con consecuencias autorizadas."; art="VF_NEXUS_CITADEL_HERO"; break;
                case 1: eyebrow.text="ARCHIVE"; title.text="CONOCE TUS CARTAS"; body.text="Las 127 artes oficiales continúan en Supabase Storage. VEXFORGE añade marco, profundidad e iluminación sin sustituir la obra original."; art="VF_ARCHIVE_SANCTUM_HERO"; break;
                case 2: eyebrow.text="FORGE"; title.text="FORJA UNA FORMACIÓN"; body.text="Tu formación parte de cartas reales. Validar y sellar dependen de la autoridad de Supabase, no de una regla simulada en el cliente."; art="VF_FORGE_CHAMBER_HERO"; break;
                case 3: eyebrow.text="STRATEGY"; title.text="PIENSA ANTES DEL DUELO"; body.text="Lee tu propia composición, afinidades y poder reportado. El cliente jamás inventa la mano, el mazo oculto o el counter del rival."; art="VF_BATTLE_SIGIL_ATLAS"; break;
                case 4: eyebrow.text="BATTLE GATE"; title.text="ELIGE UN RIVAL REAL"; body.text="La Arena obtiene oponentes desde el servidor. Primero revisas el matchup; después sellas el desafío."; art="VF_BATTLE_ARENA_CITADEL_A"; break;
                case 5: eyebrow.text="BATTLEFIELD"; title.text="AHORA JUEGA"; body.text="Este paso abandona el tutorial para llevarte al mismo Battlefield del juego. El tutorial sólo avanza cuando esa batalla autorizada termina."; art="VF_BATTLE_ARENA_CITADEL_A"; break;
                case 6: eyebrow.text="LOOP"; title.text="BATALLA → PROGRESO"; body.text="El resultado vuelve al GameState después de la presentación. Esa sincronización alimenta tus siguientes decisiones."; art="VF_MISSION_HALL_HERO"; break;
                default: eyebrow.text="RITE COMPLETE"; title.text="TU CAMINO COMIENZA"; body.text="Ya conoces el lenguaje de VEXFORGE. El Nexus conduce al mundo; el Battlefield sigue siendo el centro del juego."; art="VF_NEXUS_CITADEL_HERO"; break;
            }
            SetHero(art);
            var label = next.GetComponentInChildren<Text>(true);
            label.text = step == 7 ? "ENTRAR AL NEXUS" : (step == 5 && !tutorialBattleRequested ? "ABRIR BATALLA" : "CONTINUAR");
        }

        private void Next()
        {
            if (step == 5 && !tutorialBattleRequested)
            {
                tutorialBattleRequested = true;
                SaveStep();
                Hide();
                if (app != null) app.Navigation.Navigate(GameRoute.Battle);
                return;
            }
            if (step < 7)
            {
                step++;
                SaveStep();
                Navigate(step);
                Render();
            }
            else Finish();
        }

        private void Navigate(int s)
        {
            if (app == null) return;
            switch (s)
            {
                case 1: app.Navigation.Navigate(GameRoute.Collection); break;
                case 2: app.Navigation.Navigate(GameRoute.Deck); break;
                case 3: app.Navigation.Navigate(GameRoute.Deck); break;
                case 4: app.Navigation.Navigate(GameRoute.Battle); break;
                case 5: app.Navigation.Navigate(GameRoute.Battle); break;
                case 6: app.Navigation.Navigate(GameRoute.Missions); break;
                case 7: app.Navigation.Navigate(GameRoute.Nexus); break;
            }
        }

        private void OnBattleCompleted(BattleResult _)
        {
            if (!tutorialBattleRequested || app == null || app.Session == null || !app.Session.IsAuthenticated) return;
            tutorialBattleRequested = false;
            step = 6;
            SaveStep();
            app.Navigation.Navigate(GameRoute.Missions);
            active = true;
            canvas.gameObject.SetActive(true);
            Render();
        }

        private void Finish()
        {
            var key = CompleteKey();
            if (!string.IsNullOrWhiteSpace(key))
            {
                PlayerPrefs.SetInt(key,1);
                PlayerPrefs.DeleteKey(StepKey());
                PlayerPrefs.Save();
            }
            Hide();
            if (app != null) app.Navigation.Navigate(GameRoute.Nexus);
        }

        private string AccountScope() { return app == null || app.GameState == null ? "player_unknown" : VexforgeTier1IdentityScope.For(app.GameState.PlayerId); }
        private string CompleteKey() { return Prefix + "complete." + AccountScope(); }
        private string StepKey() { return Prefix + "step." + AccountScope(); }
        private void SaveStep() { var key = StepKey(); PlayerPrefs.SetInt(key,step); PlayerPrefs.Save(); }
        private void SetHero(string key)
        {
            if (hero==null||assets==null)return;
            var tex=assets.LoadTexture(key,"VF_NEXUS_CITADEL_HERO");
            if(tex==null)return;
            var old=hero.sprite;
            hero.sprite=Sprite.Create(tex,new Rect(0,0,tex.width,tex.height),new Vector2(.5f,.5f));
            hero.type=Image.Type.Simple;
            hero.preserveAspect=false;
            if(old!=null)Destroy(old);
        }
        private void OnDestroy() { if(battleGate!=null) battleGate.BattleCompleted-=OnBattleCompleted; }
    }
}
