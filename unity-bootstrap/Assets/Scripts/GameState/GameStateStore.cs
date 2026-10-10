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
        public PlayerStats Stats { get; private set; }
        public PlayerRank Rank { get; private set; }
        public string StatsError { get; private set; }
        public string RankError { get; private set; }
        public CardRecord[] Catalog { get; private set; } = new CardRecord[0];
        public PlayerCardRecord[] Collection { get; private set; } = new PlayerCardRecord[0];
        public DeckSlot[] Deck { get; private set; } = new DeckSlot[0];
        public MissionRecord[] Missions { get; private set; } = new MissionRecord[0];
        public WalletRecord Wallet { get; private set; }
        public WorldBossRecord[] WorldBosses { get; private set; } = new WorldBossRecord[0];
        public string WorldBossesError { get; private set; }
        public bool WorldBossesLoading { get; private set; }
        public string PackSyncWarning { get; private set; }
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
            Stats = null;
            Rank = null;
            StatsError = string.Empty;
            RankError = string.Empty;
            try
            {
                var playerId = await repository.GetCurrentPlayerIdAsync(session.Current.userId);
                if (string.IsNullOrWhiteSpace(playerId))
                {
                    LastError = "No se pudo cargar el estado de esta cuenta. Cierra sesión e inténtalo de nuevo.";
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

                try
                {
                    Stats = await repository.GetPlayerStatsAsync(playerId);
                }
                catch (Exception)
                {
                    StatsError = "Las estadísticas del jugador no están disponibles.";
                }

                try
                {
                    Rank = await repository.GetPlayerRankAsync(playerId);
                }
                catch (Exception)
                {
                    RankError = "El rango del jugador no está disponible.";
                }

                SetSync(SyncState.Connected);
            }
            catch (Exception)
            {
                LastError = "No se pudo sincronizar tu cuenta. Revisa la conexión e inténtalo de nuevo.";
                SetSync(SyncState.Error);
            }
        }

        public Task<PackRecord[]> GetPackCatalogAsync()
        {
            EnsureAuthenticatedPlayer();
            return repository.GetPackCatalogAsync();
        }

        public Task<PackOrderRecord[]> GetPendingPackOrdersAsync()
        {
            EnsureAuthenticatedPlayer();
            return repository.GetPendingPackOrdersAsync(PlayerId);
        }

        public Task<PackPurchaseResult> BuyPackAsync(string packKey)
        {
            EnsureAuthenticatedPlayer();
            return repository.BuyPackAsync(packKey);
        }

        public async Task<PackOpenResult> OpenPackAsync(string orderId)
        {
            EnsureAuthenticatedPlayer();
            var playerId = PlayerId;
            var result = await repository.OpenPackAsync(orderId);
            if (result == null || !result.ok)
                return result;

            if (!session.IsAuthenticated || PlayerId != playerId)
                throw new InvalidOperationException("La sesión cambió antes de actualizar la colección.");

            PackSyncWarning = string.Empty;
            try
            {
                Collection = await repository.GetCollectionAsync(playerId);
            }
            catch (Exception)
            {
                PackSyncWarning = "La apertura fue confirmada; la colección no se pudo actualizar ahora.";
            }

            try
            {
                Wallet = await repository.GetWalletAsync(playerId);
            }
            catch (Exception)
            {
                if (string.IsNullOrEmpty(PackSyncWarning))
                    PackSyncWarning = "La apertura fue confirmada; el saldo no se pudo actualizar ahora.";
            }
            return result;
        }

        public async Task<WorldBossRecord[]> LoadActiveWorldBossesAsync()
        {
            EnsureAuthenticatedPlayer();
            WorldBossesLoading = true;
            WorldBossesError = string.Empty;
            try
            {
                var bosses = await repository.GetActiveWorldBossesAsync();
                WorldBosses = bosses ?? new WorldBossRecord[0];
                return WorldBosses;
            }
            catch (Exception)
            {
                WorldBosses = new WorldBossRecord[0];
                WorldBossesError = "El atlas no está disponible desde esta sesión.";
                throw;
            }
            finally
            {
                WorldBossesLoading = false;
            }
        }

        public void Clear()
        {
            Profile = null;
            PlayerId = null;
            Progress = null;
            Stats = null;
            Rank = null;
            StatsError = string.Empty;
            RankError = string.Empty;
            Catalog = new CardRecord[0];
            Collection = new PlayerCardRecord[0];
            Deck = new DeckSlot[0];
            Missions = new MissionRecord[0];
            Wallet = null;
            WorldBosses = new WorldBossRecord[0];
            WorldBossesError = string.Empty;
            WorldBossesLoading = false;
            PackSyncWarning = string.Empty;
            LastError = string.Empty;
            SetSync(SyncState.Idle);
        }

        private void EnsureAuthenticatedPlayer()
        {
            if (!session.IsAuthenticated || string.IsNullOrWhiteSpace(PlayerId))
                throw new InvalidOperationException("Se requiere una sesión sincronizada para esta acción.");
        }

        private void SetSync(SyncState state)
        {
            SyncState = state;
            SyncStateChanged?.Invoke(state);
        }
    }
}