using System;

namespace Vexforge.Core
{
    public enum GameRoute
    {
        Boot,
        Nexus,
        Archive,
        Forge,
        Battlefield,
        Missions,
        Economy,
        Profile,
        Collection = Archive,
        Deck = Forge,
        Battle = Battlefield
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