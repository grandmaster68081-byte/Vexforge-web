using UnityEngine;

namespace VexForge.Foundation
{
    public static class VexForgeSessionState
    {
        public static VexForgeSession Current { get; private set; }

        public static bool IsAuthenticated
        {
            get { return Current != null && Current.IsUsable; }
        }

        public static void Set(VexForgeSession session)
        {
            Current = session;
        }

        public static void Clear()
        {
            Current = null;
        }
    }
}