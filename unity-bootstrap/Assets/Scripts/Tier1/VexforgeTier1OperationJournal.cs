using System;
using UnityEngine;

namespace Vexforge.Tier1
{
    /// <summary>
    /// Device-local retry journal for idempotency only.
    /// It stores no rewards, balances, ownership, tokens or authoritative results.
    /// Keys are account-scoped so one device can safely host multiple test accounts.
    /// </summary>
    public sealed class VexforgeTier1OperationJournal
    {
        private const string Prefix = "vexforge.tier1.v13.";
        private const string SequenceKey = Prefix + "sequence";

        public string GetOrCreate(string playerId, string operation, string opponentId)
        {
            var scope = Scope(playerId);
            var op = Sanitize(operation);
            var key = Prefix + scope + ".op." + op;
            var existing = PlayerPrefs.GetString(key, string.Empty);
            if (string.IsNullOrWhiteSpace(existing))
            {
                var next = PlayerPrefs.GetInt(SequenceKey, 0) + 1;
                PlayerPrefs.SetInt(SequenceKey, next);
                existing = Application.identifier + ":v13:" + next + ":" + DateTime.UtcNow.Ticks;
                PlayerPrefs.SetString(key, existing);
            }

            PlayerPrefs.SetString(Prefix + scope + ".pending.operation", op);
            PlayerPrefs.SetString(Prefix + scope + ".pending.opponent", Sanitize(opponentId));
            PlayerPrefs.Save();
            return existing;
        }

        public bool TryGetPending(string playerId, out string operation, out string opponentId, out string idempotencyKey)
        {
            operation = string.Empty;
            opponentId = string.Empty;
            idempotencyKey = string.Empty;
            var scope = Scope(playerId);
            operation = PlayerPrefs.GetString(Prefix + scope + ".pending.operation", string.Empty);
            opponentId = PlayerPrefs.GetString(Prefix + scope + ".pending.opponent", string.Empty);
            if (string.IsNullOrWhiteSpace(operation) || string.IsNullOrWhiteSpace(opponentId)) return false;
            idempotencyKey = PlayerPrefs.GetString(Prefix + scope + ".op." + Sanitize(operation), string.Empty);
            return !string.IsNullOrWhiteSpace(idempotencyKey);
        }

        public void Clear(string playerId, string operation)
        {
            var scope = Scope(playerId);
            var op = Sanitize(operation);
            var opKey = Prefix + scope + ".op." + op;
            if (PlayerPrefs.HasKey(opKey)) PlayerPrefs.DeleteKey(opKey);
            var pendingOpKey = Prefix + scope + ".pending.operation";
            var pendingOpponentKey = Prefix + scope + ".pending.opponent";
            if (PlayerPrefs.GetString(pendingOpKey, string.Empty) == op)
            {
                PlayerPrefs.DeleteKey(pendingOpKey);
                PlayerPrefs.DeleteKey(pendingOpponentKey);
            }
            PlayerPrefs.Save();
        }

        public void ClearPending(string playerId)
        {
            var scope = Scope(playerId);
            var pendingOp = PlayerPrefs.GetString(Prefix + scope + ".pending.operation", string.Empty);
            if (!string.IsNullOrWhiteSpace(pendingOp))
                PlayerPrefs.DeleteKey(Prefix + scope + ".op." + Sanitize(pendingOp));
            PlayerPrefs.DeleteKey(Prefix + scope + ".pending.operation");
            PlayerPrefs.DeleteKey(Prefix + scope + ".pending.opponent");
            PlayerPrefs.Save();
        }

        private static string Scope(string playerId)
        {
            return VexforgeTier1IdentityScope.For(playerId);
        }

        private static string Sanitize(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "unknown";
            var chars = value.Trim().ToCharArray();
            for (var i = 0; i < chars.Length; i++)
                if (!char.IsLetterOrDigit(chars[i]) && chars[i] != '-' && chars[i] != '_') chars[i] = '_';
            return new string(chars);
        }
    }
}
