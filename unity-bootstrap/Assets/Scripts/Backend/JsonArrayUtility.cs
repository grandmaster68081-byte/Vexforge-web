using System;
using UnityEngine;

namespace Vexforge.Backend
{
    public static class JsonArrayUtility
    {
        [Serializable]
        private sealed class Wrapper<T>
        {
            public T[] items;
        }

        public static T[] FromJson<T>(string json)
        {
            if (string.IsNullOrWhiteSpace(json) || json == "null") return new T[0];
            return JsonUtility.FromJson<Wrapper<T>>("{\"items\":" + json + "}").items ?? new T[0];
        }
    }
}