using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

namespace VexForge.Foundation
{
    public sealed class VexForgeGameShell : MonoBehaviour
    {
        private VexForgeSupabaseClient supabase;
        private VisualElement root;
        private Label status;
        private Label data;
        private TextField email;
        private TextField password;
        private Button loginButton;
        private Button registerButton;
        private Button logoutButton;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.SystemSetting;
            supabase = new VexForgeSupabaseClient();
            StartCoroutine(Boot());
        }

        private IEnumerator Boot()
        {
            BuildUi();
            SetStatus("INICIANDO NEXUS", "Preparando runtime Unity…");

            var stored = VexForgeSessionStore.Load();

            if (stored == null)
            {
                ShowAuth();
                yield break;
            }

            VexForgeSessionState.Set(stored);

            if (stored.IsExpiredOrNearExpiry())
            {
                SetStatus("RENOVANDO SESIÓN", "Validando sesión guardada con Supabase…");

                var done = false;
                var failed = false;

                yield return supabase.RefreshSession(
                    stored,
                    refreshed =>
                    {
                        VexForgeSessionStore.Save(refreshed);
                        VexForgeSessionState.Set(refreshed);
                        done = true;
                    },
                    _ =>
                    {
                        failed = true;
                        done = true;
                    });

                if (failed || !done)
                {
                    VexForgeSessionState.Clear();
                    VexForgeSessionStore.Clear();
                    ShowAuth();
                    yield break;
                }
            }

            yield return LoadRealData();
        }

        private void BuildUi()
        {
            var document = gameObject.GetComponent<UIDocument>();
            if (document == null)
            {
                document = gameObject.AddComponent<UIDocument>();
            }

            if (document.panelSettings == null)
            {
                var panel = ScriptableObject.CreateInstance<PanelSettings>();
                panel.scaleMode = PanelScaleMode.ScaleWithScreenSize;
                panel.referenceResolution = new Vector2Int(1080, 1920);
                panel.screenMatchMode = PanelScreenMatchMode.MatchWidthOrHeight;
                panel.match = 0.5f;
                document.panelSettings = panel;
            }

            root = new VisualElement();
            root.style.flexGrow = 1;
            root.style.backgroundColor = new Color(0.018f, 0.02f, 0.035f);

            var frame = new VisualElement();
            frame.style.flexGrow = 1;
            frame.style.paddingLeft = 44;
            frame.style.paddingRight = 44;
            frame.style.paddingTop = 70;
            frame.style.paddingBottom = 70;

            var title = new Label("VEXFORGE");
            title.style.fontSize = 38;
            title.style.unityFontStyleAndWeight = FontStyle.Bold;
            title.style.color = new Color(0.83f, 0.76f, 0.51f);

            var eyebrow = new Label("FOUNDATION • UNITY RUNTIME");
            eyebrow.style.fontSize = 12;
            eyebrow.style.letterSpacing = 2;
            eyebrow.style.color = new Color(0.48f, 0.52f, 0.62f);
            eyebrow.style.marginBottom = 38;

            status = new Label();
            status.style.fontSize = 18;
            status.style.unityFontStyleAndWeight = FontStyle.Bold;
            status.style.color = new Color(0.87f, 0.88f, 0.91f);
            status.style.marginBottom = 10;

            data = new Label();
            data.style.fontSize = 15;
            data.style.whiteSpace = WhiteSpace.Normal;
            data.style.color = new Color(0.68f, 0.71f, 0.77f);
            data.style.marginBottom = 34;

            frame.Add(title);
            frame.Add(eyebrow);
            frame.Add(status);
            frame.Add(data);

            email = new TextField("Correo");
            email.style.marginBottom = 12;

            password = new TextField("Contraseña");
            password.isPasswordField = true;
            password.style.marginBottom = 18;

            loginButton = new Button(HandleLogin) { text = "ENTRAR AL NEXUS" };
            loginButton.style.height = 52;
            loginButton.style.marginBottom = 10;

            registerButton = new Button(HandleRegister) { text = "CREAR CUENTA" };
            registerButton.style.height = 48;

            logoutButton = new Button(HandleLogout) { text = "CERRAR SESIÓN" };
            logoutButton.style.height = 48;

            frame.Add(email);
            frame.Add(password);
            frame.Add(loginButton);
            frame.Add(registerButton);
            frame.Add(logoutButton);

            root.Add(frame);
            document.rootVisualElement.Add(root);
        }

        private void ShowAuth()
        {
            email.style.display = DisplayStyle.Flex;
            password.style.display = DisplayStyle.Flex;
            loginButton.style.display = DisplayStyle.Flex;
            registerButton.style.display = DisplayStyle.Flex;
            logoutButton.style.display = DisplayStyle.None;

            data.text =
                "Supabase LIVE • autenticación real • sesión persistente\n" +
                "No hay datos simulados en Foundation.";

            SetStatus("AUTENTICACIÓN", "Introduce tus credenciales reales de VEXFORGE.");
        }

        private void ShowAuthenticated(
            VexForgePlayer player,
            VexForgeProgress progress,
            int cardCount)
        {
            email.style.display = DisplayStyle.None;
            password.style.display = DisplayStyle.None;
            loginButton.style.display = DisplayStyle.None;
            registerButton.style.display = DisplayStyle.None;
            logoutButton.style.display = DisplayStyle.Flex;

            var name = player != null && !string.IsNullOrWhiteSpace(player.display_name)
                ? player.display_name
                : "Jugador VEXFORGE";

            var level = progress != null ? progress.level.ToString() : "—";
            var energy = progress != null
                ? progress.energy + "/" + progress.max_energy
                : "—";

            data.text =
                "Jugador: " + name + "\n" +
                "Nivel: " + level + "\n" +
                "Energía: " + energy + "\n" +
                "Cartas activas reales: " + cardCount + "\n\n" +
                "Backend: Supabase LIVE\n" +
                "Runtime: Unity 6.3 LTS\n" +
                "Foundation: autenticación + sesión + datos reales";

            SetStatus("NEXUS CONECTADO", "Foundation Unity está ejecutándose con backend real.");
        }

        private IEnumerator LoadRealData()
        {
            var session = VexForgeSessionState.Current;

            if (session == null)
            {
                ShowAuth();
                yield break;
            }

            SetStatus("SINCRONIZANDO", "Consultando player, progreso y catálogo…");

            VexForgePlayer player = null;
            VexForgeProgress progress = null;
            VexForgeCard[] cards = null;

            var playerDone = false;
            var progressDone = false;
            var cardsDone = false;
            string error = null;

            yield return supabase.LoadPlayer(
                session,
                value =>
                {
                    player = value;
                    playerDone = true;
                },
                message =>
                {
                    error = message;
                    playerDone = true;
                });

            if (!string.IsNullOrWhiteSpace(error))
            {
                ShowError(error);
                yield break;
            }

            yield return supabase.LoadProgress(
                session,
                player.id,
                value =>
                {
                    progress = value;
                    progressDone = true;
                },
                message =>
                {
                    error = message;
                    progressDone = true;
                });

            if (!string.IsNullOrWhiteSpace(error))
            {
                ShowError(error);
                yield break;
            }

            yield return supabase.LoadCards(
                value =>
                {
                    cards = value;
                    cardsDone = true;
                },
                message =>
                {
                    error = message;
                    cardsDone = true;
                });

            if (!string.IsNullOrWhiteSpace(error))
            {
                ShowError(error);
                yield break;
            }

            if (!playerDone || !progressDone || !cardsDone)
            {
                ShowError("Foundation no pudo completar la sincronización.");
                yield break;
            }

            ShowAuthenticated(player, progress, cards != null ? cards.Length : 0);
        }

        private void HandleLogin()
        {
            StartCoroutine(LoginRoutine(false));
        }

        private void HandleRegister()
        {
            StartCoroutine(LoginRoutine(true));
        }

        private IEnumerator LoginRoutine(bool createAccount)
        {
            var mail = email.value != null ? email.value.Trim() : string.Empty;
            var pass = password.value ?? string.Empty;

            if (string.IsNullOrWhiteSpace(mail) || string.IsNullOrWhiteSpace(pass))
            {
                ShowError("Correo y contraseña son obligatorios.");
                yield break;
            }

            SetButtonsEnabled(false);
            SetStatus(
                createAccount ? "CREANDO CUENTA" : "AUTENTICANDO",
                "Contactando Supabase LIVE…");

            VexForgeSession session = null;
            string error = null;
            bool finished = false;

            if (createAccount)
            {
                yield return supabase.SignUp(
                    mail,
                    pass,
                    value =>
                    {
                        session = value;
                        finished = true;
                    },
                    message =>
                    {
                        error = message;
                        finished = true;
                    });
            }
            else
            {
                yield return supabase.SignIn(
                    mail,
                    pass,
                    value =>
                    {
                        session = value;
                        finished = true;
                    },
                    message =>
                    {
                        error = message;
                        finished = true;
                    });
            }

            if (!finished)
            {
                ShowError("La operación Auth no terminó.");
                SetButtonsEnabled(true);
                yield break;
            }

            if (!string.IsNullOrWhiteSpace(error))
            {
                ShowError(error);
                SetButtonsEnabled(true);
                yield break;
            }

            if (session == null || !session.IsUsable)
            {
                ShowError("Supabase no devolvió una sesión válida.");
                SetButtonsEnabled(true);
                yield break;
            }

            if (createAccount && string.IsNullOrWhiteSpace(session.access_token))
            {
                ShowError(
                    "La cuenta fue creada, pero Supabase no devolvió sesión inmediata. " +
                    "Si la instancia exige confirmación de correo, confirma el correo y vuelve a iniciar sesión.");
                SetButtonsEnabled(true);
                yield break;
            }

            yield return supabase.EnsurePlayer(
                session,
                mail,
                () => { },
                message => error = message);

            if (!string.IsNullOrWhiteSpace(error))
            {
                ShowError(error);
                SetButtonsEnabled(true);
                yield break;
            }

            VexForgeSessionState.Set(session);
            VexForgeSessionStore.Save(session);

            SetButtonsEnabled(true);

            yield return LoadRealData();
        }

        private void HandleLogout()
        {
            VexForgeSessionState.Clear();
            VexForgeSessionStore.Clear();
            email.value = string.Empty;
            password.value = string.Empty;
            ShowAuth();
        }

        private void SetButtonsEnabled(bool enabled)
        {
            loginButton.SetEnabled(enabled);
            registerButton.SetEnabled(enabled);
            logoutButton.SetEnabled(enabled);
        }

        private void SetStatus(string title, string detail)
        {
            status.text = title;
            data.text = detail;
        }

        private void ShowError(string message)
        {
            SetStatus("NEXUS ERROR", message);
        }
    }
}