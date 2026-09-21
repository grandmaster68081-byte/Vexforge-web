using System;

namespace Vexforge.Backend
{
    /// <summary>
    /// Authoritative opponent discovery DTO returned by get_pvp_opponents.
    /// Presentation consumes this record; it never becomes a local rules engine.
    /// </summary>
    [Serializable]
    public sealed class PvpOpponentRecord
    {
        public string id;
        public string player_id;
        public string display_name;
        public int mmr;
        public int deck_size;
    }
}
