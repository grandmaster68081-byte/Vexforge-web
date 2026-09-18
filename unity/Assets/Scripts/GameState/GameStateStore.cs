using System;
using System.Threading.Tasks;
using Vexforge.Backend;
using Vexforge.Session;

namespace Vexforge.GameState
{
    public enum SyncState
    {
        Idle,
        Loading,
        Connected,
        Unavailable,
        Error
    }

    public sealed class GameStateStore
    {
        private readonly VexforgeRepository repository;
        private readonly SessionService session;

        public GameStateStore(VexforgeRepository repository, SessionService session)
        {
            this.repository = repository;
            this.session = session;
        }

        public event Action<SyncState> SyncStateChanged;
        public SyncState SyncState { get; private set; } = SyncState.Idle;
        public PlayerProfile Profile { get; private set; }
        public string PlayerId { get; private set; }
        public PlayerProgress Progress { get; private set; }
        public CardRecord[] Catalog { get; private set; } = new CardRecord[0];
        public PlayerCardRecord[] Collection { get; private set; } = new PlayerCardRecord[0];
        public DeckSlot[] Deck { get; private set; } = new DeckSlot[0];
        public MissionRecord[] Missions { get; private set; } = new MissionRecord[0];
        public WalletRecord Wallet { get; private set; }
        public string LastError { get; private set; }

        public async Task RefreshAsync()
        {
            if (!session.IsAuthenticated || session.Current == null)
            {
                SetSync(SyncState.Unavailable);
                LastError = "La sesión autenticada es necesaria para cargar el estado del jugador.";
                return;
            }

            SetSync(SyncState.Loading);
            LastError = string.Empty;
            try
            {
                var playerId = await repository.GetCurrentPlayerIdAsync(session.Current.userId);
                if (string.IsNullOrWhiteSpace(playerId))
                {
                    LastError = "Supabase no devolvió un jugador para la sesión autenticada.";
                    SetSync(SyncState.Error);
                    return;
                }
                PlayerId = playerId;
                Profile = await repository.GetPlayerProfileAsync(session.Current.userId);
                Progress = await repository.GetPlayerProgressAsync(playerId);
                Catalog = await repository.GetCatalogAsync();
                Collection = await repository.GetCollectionAsync(playerId);
                Deck = await repository.GetDeckAsync(playerId);
                Missions = await repository.GetMissionsAsync();
                Wallet = await repository.GetWalletAsync(playerId);
                SetSync(SyncState.Connected);
            }
            catch (Exception exception)
            {
                LastError = exception.Message;
                SetSync(SyncState.Error);
            }
        }

        public void Clear()
        {
            Profile = null;
            PlayerId = null;
            Progress = null;
            Catalog = new CardRecord[0];
            Collection = new PlayerCardRecord[0];
            Deck = new DeckSlot[0];
            Missions = new MissionRecord[0];
            Wallet = null;
            LastError = string.Empty;
            SetSync(SyncState.Idle);
        }

        private void SetSync(SyncState state)
        {
            SyncState = state;
            SyncStateChanged?.Invoke(state);
        }
    }
}