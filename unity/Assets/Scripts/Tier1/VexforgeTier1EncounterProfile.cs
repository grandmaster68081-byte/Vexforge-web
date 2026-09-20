using System;

namespace Vexforge.Tier1
{
    public enum VexforgeTier1EncounterKind { PvP, Mission, Raid, Boss, ClanWar }
    [Serializable]
    public sealed class VexforgeTier1EncounterProfile
    {
        public string profile_id;public VexforgeTier1EncounterKind kind;public string presentation_id;public string arena_asset_id;public string intro_cue;public string victory_cue;public string defeat_cue;
    }
    public static class VexforgeTier1EncounterProfiles
    {
        public static VexforgeTier1EncounterProfile For(VexforgeTier1EncounterKind kind)
        {
            var id=kind==VexforgeTier1EncounterKind.PvP?"pvp_v1":kind.ToString().ToLowerInvariant()+"_v1";
            return new VexforgeTier1EncounterProfile{profile_id=id,kind=kind,presentation_id=kind.ToString().ToLowerInvariant(),arena_asset_id="VF_BATTLE_ARENA_CITADEL_A",intro_cue="battle_intro",victory_cue="victory",defeat_cue="defeat"};
        }
    }
}
