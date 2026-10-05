using UnityEngine;
using UnityEngine.UI;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1WorldAtlasDirector : MonoBehaviour
    {
        private VexforgeApp app;
        private VexforgeTier1AssetRegistry assets;
        private Canvas canvas;
        private Image background;
        private Sprite auraSprite;
        private RawImage sigil;
        private Text status;
        private Text details;
        private RectTransform content;
        private WorldBossRecord[] bosses = new WorldBossRecord[0];
        private int page;
        private int selectedIndex = -1;
        private bool showingDetails;
        private bool visible;
        private bool loading;

        public void Initialize(VexforgeApp host, VexforgeTier1AssetRegistry registry)
        {
            if (canvas != null) return;
            app = host;
            assets = registry;
            Build();
        }

        public void Show()
        {
            if (canvas == null || app == null) return;
            visible = true;
            canvas.gameObject.SetActive(true);
            LoadBossesAsync();
        }

        public void Hide()
        {
            visible = false;
            if (canvas != null) canvas.gameObject.SetActive(false);
        }

        private void Build()
        {
            canvas = VexforgeTier1Ui.MakeCanvas("VexforgeTier1WorldAtlas", 62, 3.7f);
            var veil = VexforgeTier1Ui.Panel(
                canvas.transform,
                "Veil",
                new Color(.002f, .003f, .008f, .86f));
            VexforgeTier1Ui.Full(veil.rectTransform);

            background = VexforgeTier1Ui.Panel(
                canvas.transform,
                "Atlas",
                new Color(.006f, .008f, .013f, .98f));
            VexforgeTier1Ui.Anchor(background.rectTransform, .035f, .07f, .965f, .93f);

            var aura = assets == null ? null : assets.LoadTexture("VF_BOSS_AURA");
            if (aura != null)
            {
                background.color = Color.white;
                auraSprite = Sprite.Create(
                    aura,
                    new Rect(0, 0, aura.width, aura.height),
                    new Vector2(.5f, .5f),
                    100f);
                background.sprite = auraSprite;
                background.preserveAspect = false;
            }

            var shade = VexforgeTier1Ui.Panel(
                background.transform,
                "Shade",
                new Color(.003f, .005f, .010f, .75f));
            VexforgeTier1Ui.Full(shade.rectTransform);

            var title = VexforgeTier1Ui.Label(
                background.transform,
                "Title",
                "WORLD ATLAS",
                28,
                VexforgeTier1Ui.Gold,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(title.rectTransform, .28f, .86f, .92f, .96f);

            var back = VexforgeTier1Ui.Button(
                background.transform,
                "Back",
                "NEXUS",
                () => app.Navigation.Navigate(GameRoute.Nexus),
                new Color(.055f, .050f, .046f, .96f),
                11);
            VexforgeTier1Ui.Anchor(back.GetComponent<RectTransform>(), .08f, .88f, .25f, .95f);

            status = VexforgeTier1Ui.Label(
                background.transform,
                "Status",
                "CONSULTANDO JEFES ACTIVOS…",
                12,
                VexforgeTier1Ui.Muted,
                TextAnchor.MiddleCenter);
            VexforgeTier1Ui.Anchor(status.rectTransform, .08f, .79f, .92f, .85f);

            content = new GameObject("AtlasContent", typeof(RectTransform)).GetComponent<RectTransform>();
            content.SetParent(background.transform, false);
            VexforgeTier1Ui.Full(content);

            var sigilObject = new GameObject("BossSigil", typeof(RectTransform), typeof(RawImage));
            sigilObject.transform.SetParent(background.transform, false);
            var sigilRect = sigilObject.GetComponent<RectTransform>();
            VexforgeTier1Ui.Anchor(sigilRect, .64f, .37f, .88f, .70f);
            sigil = sigilObject.GetComponent<RawImage>();
            sigil.texture = assets == null ? null : assets.LoadTexture("VF_BOSS_SIGIL");
            sigil.color = Color.white;
            sigil.raycastTarget = false;

            details = VexforgeTier1Ui.Label(
                background.transform,
                "BossDetails",
                string.Empty,
                15,
                VexforgeTier1Ui.Text,
                TextAnchor.UpperLeft);
            VexforgeTier1Ui.Anchor(details.rectTransform, .09f, .26f, .60f, .72f);
            details.gameObject.SetActive(false);
            sigil.gameObject.SetActive(false);
            canvas.gameObject.SetActive(false);
        }

        private async void LoadBossesAsync()
        {
            if (loading || !visible || app.GameState == null) return;
            loading = true;
            status.text = "CONSULTANDO JEFES ACTIVOS…";
            ClearContent();
            sigil.gameObject.SetActive(false);
            details.gameObject.SetActive(false);
            try
            {
                bosses = await app.GameState.LoadActiveWorldBossesAsync();
                if (selectedIndex >= bosses.Length) selectedIndex = bosses.Length - 1;
                Render();
            }
            catch (System.Exception)
            {
                bosses = new WorldBossRecord[0];
                if (visible)
                {
                    status.text = "EL ATLAS NO ESTÁ DISPONIBLE DESDE ESTA SESIÓN.";
                    AddRetry();
                }
            }
            finally
            {
                loading = false;
            }
        }

        private void Render()
        {
            if (!visible) return;
            ClearContent();
            if (bosses == null || bosses.Length == 0)
            {
                sigil.gameObject.SetActive(false);
                details.gameObject.SetActive(false);
                status.text = "SIN JEFES ACTIVOS REPORTADOS.";
                var empty = VexforgeTier1Ui.Label(
                    content,
                    "Empty",
                    "EL ATLAS MUESTRA SOLAMENTE REGISTROS ACTIVOS RECIBIDOS DEL SERVIDOR.",
                    14,
                    VexforgeTier1Ui.Muted,
                    TextAnchor.MiddleCenter);
                VexforgeTier1Ui.Anchor(empty.rectTransform, .10f, .38f, .90f, .58f);
                return;
            }

            if (showingDetails && selectedIndex >= 0 && selectedIndex < bosses.Length)
            {
                status.text = "FICHA DEL JEFE · REGISTRO ACTIVO";
                sigil.gameObject.SetActive(true);
                details.gameObject.SetActive(true);
                ShowBoss(bosses[selectedIndex]);

                var backToList = VexforgeTier1Ui.Button(
                    content,
                    "BackToBossList",
                    "LISTA",
                    () =>
                    {
                        showingDetails = false;
                        Render();
                    },
                    new Color(.055f, .050f, .046f, .96f),
                    11);
                VexforgeTier1Ui.Anchor(backToList.GetComponent<RectTransform>(), .08f, .15f, .34f, .22f);

                var encounterUnavailable = VexforgeTier1Ui.Button(
                    content,
                    "EncounterUnavailable",
                    "ENCUENTRO NO DISPONIBLE",
                    null,
                    new Color(.055f, .050f, .046f, .72f),
                    11);
                VexforgeTier1Ui.Anchor(encounterUnavailable.GetComponent<RectTransform>(), .52f, .15f, .92f, .22f);
                encounterUnavailable.interactable = false;
                return;
            }

            sigil.gameObject.SetActive(false);
            details.gameObject.SetActive(false);
            var pageCount = (bosses.Length + 2) / 3;
            page = Mathf.Clamp(page, 0, pageCount - 1);
            var first = page * 3;
            var count = Mathf.Min(3, bosses.Length - first);
            status.text = "JEFES ACTIVOS REPORTADOS · " + (page + 1) + " / " + pageCount;

            for (var i = 0; i < count; i++)
            {
                var index = first + i;
                var boss = bosses[index];
                var top = .72f - i * .18f;
                var label = Safe(boss.name, Safe(boss.boss_code, "JEFE")) +
                            (boss.tier > 0 ? "\nNIVEL " + boss.tier : string.Empty);
                var button = VexforgeTier1Ui.Button(
                    content,
                    "Boss_" + index,
                    label,
                    () => SelectBoss(index),
                    new Color(.055f, .050f, .046f, .96f),
                    12);
                VexforgeTier1Ui.Anchor(button.GetComponent<RectTransform>(), .08f, top - .14f, .92f, top);
            }

            if (pageCount > 1)
            {
                var previous = VexforgeTier1Ui.Button(
                    content,
                    "PreviousPage",
                    "‹",
                    () => ChangePage(-1),
                    new Color(.055f, .050f, .046f, .96f),
                    16);
                VexforgeTier1Ui.Anchor(previous.GetComponent<RectTransform>(), .08f, .13f, .20f, .19f);
                var next = VexforgeTier1Ui.Button(
                    content,
                    "NextPage",
                    "›",
                    () => ChangePage(1),
                    new Color(.055f, .050f, .046f, .96f),
                    16);
                VexforgeTier1Ui.Anchor(next.GetComponent<RectTransform>(), .80f, .13f, .92f, .19f);
            }

            if (selectedIndex < 0 || selectedIndex >= bosses.Length)
                selectedIndex = first;
        }

        private void SelectBoss(int index)
        {
            if (index < 0 || index >= bosses.Length) return;
            selectedIndex = index;
            page = index / 3;
            showingDetails = true;
            Render();
        }

        private void ShowBoss(WorldBossRecord boss)
        {
            if (boss == null) return;
            var lines = Safe(boss.name, Safe(boss.boss_code, "JEFE"));
            if (!string.IsNullOrWhiteSpace(boss.boss_code))
                lines += "\nIDENTIDAD · " + boss.boss_code;
            if (!string.IsNullOrWhiteSpace(boss.region_id))
                lines += "\nDOMINIO · " + boss.region_id;
            if (boss.tier > 0) lines += "\nNIVEL · " + boss.tier;
            if (boss.power_level > 0) lines += "\nPODER REPORTADO · " + boss.power_level;
            if (boss.hp > 0) lines += "\nSALUD REPORTADA · " + boss.hp;
            lines += "\n\nLa ficha usa datos activos del servidor. No inicia combates ni calcula resultados o recompensas en Unity.";
            details.text = lines;
        }

        private void AddRetry()
        {
            ClearContent();
            var retry = VexforgeTier1Ui.Button(
                content,
                "Retry",
                "REINTENTAR",
                LoadBossesAsync,
                new Color(.16f, .10f, .045f, .96f),
                12);
            VexforgeTier1Ui.Anchor(retry.GetComponent<RectTransform>(), .20f, .43f, .80f, .53f);
        }

        private void ChangePage(int delta)
        {
            var pageCount = (bosses.Length + 2) / 3;
            if (pageCount <= 1) return;
            page = (page + delta + pageCount) % pageCount;
            selectedIndex = page * 3;
            showingDetails = false;
            Render();
        }

        private void ClearContent()
        {
            if (content == null) return;
            for (var i = content.childCount - 1; i >= 0; i--)
                Destroy(content.GetChild(i).gameObject);
        }

        private static string Safe(string value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private void OnDestroy()
        {
            if (auraSprite != null) Destroy(auraSprite);
        }
    }
}
