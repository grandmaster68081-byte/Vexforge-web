using UnityEngine;

namespace Vexforge.Core
{
    public static class AppLogger
    {
        private const string Prefix = "[VEXFORGE]";

        public static void Info(string message)
        {
            Debug.Log(Prefix + " " + message);
        }

        public static void Warning(string message)
        {
            Debug.LogWarning(Prefix + " " + message);
        }

        public static void Error(string message)
        {
            Debug.LogError(Prefix + " " + message);
        }
    }
}