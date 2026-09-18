using System;

namespace Vexforge.Core
{
    public enum GameRoute
    {
        Boot,
        Nexus,
        Collection,
        Deck,
        Battle,
        Missions,
        Economy,
        Profile
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