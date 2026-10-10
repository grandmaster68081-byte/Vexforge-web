using UnityEngine;

namespace Vexforge.Core
{
    public sealed class PersistentRuntimeState
    {
        private const string ReducedMotionKey = "vexforge.reduced_motion";
        private const string LastRouteKey = "vexforge.last_route";

        public bool ReducedMotion
        {
            get { return PlayerPrefs.GetInt(ReducedMotionKey, 0) == 1; }
            set
            {
                PlayerPrefs.SetInt(ReducedMotionKey, value ? 1 : 0);
                PlayerPrefs.Save();
            }
        }

        public string LastRoute
        {
            get { return PlayerPrefs.GetString(LastRouteKey, "nexus"); }
            set
            {
                PlayerPrefs.SetString(LastRouteKey, value ?? "nexus");
                PlayerPrefs.Save();
            }
        }
    }
}