using System.Threading.Tasks;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.GameState;
using Vexforge.Session;
using Vexforge.UI;

namespace Vexforge.Core
{
    public sealed class VexforgeApp : MonoBehaviour
    {
        public static VexforgeApp Instance { get; private set; }

        public ServiceRegistry Services { get; private set; }
        public NavigationService Navigation { get; private set; }
        public PersistentRuntimeState PersistentState { get; private set; }
        public SessionService Session { get; private set; }
        public GameStateStore GameState { get; private set; }
        public VexforgeRepository Repository { get; private set; }
        public bool IsInitialized { get; private set; }
        public string InitializationError { get; private set; }

        private Task initializationTask;

        private void Start()
        {
            _ = InitializeAsync();
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            Services = new ServiceRegistry();
            Navigation = new NavigationService();
            PersistentState = new PersistentRuntimeState();

            var client = new SupabaseClient(RuntimeEnvironment.Current);
            var auth = new SupabaseAuthService(client);
            Session = new SessionService(auth);
            Repository = new VexforgeRepository(client);
            GameState = new GameStateStore(Repository, Session);
            Services.Register(client);
            Services.Register(auth);
            Services.Register(Session);
            Services.Register(Repository);
            Services.Register(GameState);
            Services.Register(Navigation);
            Services.Register(PersistentState);

            if (GetComponent<GameShellController>() == null)
            {
                gameObject.AddComponent<GameShellController>();
            }
        }

        public Task InitializeAsync()
        {
            if (initializationTask != null)
                return initializationTask;

            initializationTask = InitializeCore();
            return initializationTask;
        }

        private Task InitializeCore()
        {
            if (!RuntimeEnvironment.IsConfigured)
            {
                InitializationError = "La configuración de Supabase no está disponible.";
                IsInitialized = true;
                AppLogger.Warning(InitializationError);
                return Task.CompletedTask;
            }

            Navigation.Navigate(GameRoute.Nexus);
            IsInitialized = true;
            AppLogger.Info("Foundation inicializada; esperando sesión autenticada.");
            return Task.CompletedTask;
        }

        public async Task<bool> SignInAndSyncAsync(string email, string password)
        {
            var ok = await Session.SignInAsync(email, password);
            if (!ok) return false;
            await GameState.RefreshAsync();
            return GameState.SyncState == SyncState.Connected;
        }

        public void SignOut()
        {
            Session.SignOut();
            GameState.Clear();
            Navigation.Navigate(GameRoute.Nexus);
        }
    }
}