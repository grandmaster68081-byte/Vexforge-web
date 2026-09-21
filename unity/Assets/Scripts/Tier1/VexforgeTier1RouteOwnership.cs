using Vexforge.Core;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Single route-ownership contract used by legacy HUD suppression and the canonical shell.
    /// Tier-1 owns these routes; legacy HUD must not render a competing surface there.
    /// </summary>
    public static class VexforgeTier1RouteOwnership
    {
        public static bool Owns(GameRoute route)
        {
            switch (route)
            {
                case GameRoute.Nexus:
                case GameRoute.Battle:
                case GameRoute.Missions:
                case GameRoute.Economy:
                    return true;
                default:
                    return false;
            }
        }
    }
}
