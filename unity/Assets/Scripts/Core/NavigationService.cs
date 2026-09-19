using System;

namespace Vexforge.Core
{
    /// <summary>
    /// Canonical internal navigation routes.
    /// Product-facing labels such as ARCHIVE, FORGE and BATTLEFIELD remain presentation labels only.
    /// Numeric values are intentionally preserved from the previous enum layout so serialized values
    /// remain stable: Boot=0, Nexus=1, Collection=2, Deck=3, Battle=4, Missions=5, Economy=6, Profile=7.
    /// </summary>
    public enum GameRoute
    {
        Boot = 0,
        Nexus = 1,
        Collection = 2,
        Deck = 3,
        Battle = 4,
        Missions = 5,
        Economy = 6,
        Profile = 7
    }

    public sealed class NavigationService
    {
        public event Action<GameRoute> RouteChanged;
        public GameRoute CurrentRoute { get; private set; } = GameRoute.Boot;

        public void Navigate(GameRoute route)
        {
            if (CurrentRoute == route) return;
            CurrentRoute = route;
            RouteChanged?.Invoke(route);
        }
    }
}
