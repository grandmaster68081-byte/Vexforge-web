using System;
using System.Security.Cryptography;
using System.Text;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Deterministic short account scope for device-local continuity keys.
    /// It prevents delimiter/sanitization collisions between different player identifiers.
    /// </summary>
    internal static class VexforgeTier1IdentityScope
    {
        public static string For(string playerId)
        {
            var raw = string.IsNullOrWhiteSpace(playerId) ? "unknown" : playerId.Trim();
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                var sb = new StringBuilder(16);
                for (var i = 0; i < 8 && i < bytes.Length; i++) sb.Append(bytes[i].ToString("x2"));
                return "player_" + sb;
            }
        }
    }
}
