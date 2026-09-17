using System;
using System.Text;
using UnityEngine;

namespace VexForge.Foundation
{
    public static class VexForgeSessionStore
    {
        private const string EditorKey = "vexforge.foundation.session";
        private const string AndroidAlias = "vexforge.session";

        public static void Save(VexForgeSession session)
        {
            if (session == null)
            {
                Clear();
                return;
            }

            var json = JsonUtility.ToJson(session);

#if UNITY_ANDROID && !UNITY_EDITOR
            PlayerPrefs.SetString(EditorKey, AndroidEncrypt(json));
            PlayerPrefs.Save();
#else
            PlayerPrefs.SetString(EditorKey, json);
            PlayerPrefs.Save();
#endif
        }

        public static VexForgeSession Load()
        {
            if (!PlayerPrefs.HasKey(EditorKey))
            {
                return null;
            }

            try
            {
                var value = PlayerPrefs.GetString(EditorKey);

#if UNITY_ANDROID && !UNITY_EDITOR
                value = AndroidDecrypt(value);
#endif

                if (string.IsNullOrWhiteSpace(value))
                {
                    return null;
                }

                return JsonUtility.FromJson<VexForgeSession>(value);
            }
            catch
            {
                Clear();
                return null;
            }
        }

        public static void Clear()
        {
            PlayerPrefs.DeleteKey(EditorKey);
            PlayerPrefs.Save();
        }

#if UNITY_ANDROID && !UNITY_EDITOR

        private static AndroidJavaObject GetAndroidKey()
        {
            using (var keyStoreClass = new AndroidJavaClass("java.security.KeyStore"))
            using (var keyStore = keyStoreClass.CallStatic<AndroidJavaObject>("getInstance", "AndroidKeyStore"))
            {
                keyStore.Call("load", null);

                var existing = keyStore.Call<AndroidJavaObject>("getKey", AndroidAlias, null);
                if (existing != null)
                {
                    return existing;
                }
            }

            using (var keyGeneratorClass = new AndroidJavaClass("javax.crypto.KeyGenerator"))
            using (var keyGenerator = keyGeneratorClass.CallStatic<AndroidJavaObject>("getInstance", "AES", "AndroidKeyStore"))
            using (var builder = new AndroidJavaObject(
                       "android.security.keystore.KeyGenParameterSpec$Builder",
                       AndroidAlias,
                       3))
            {
                builder.Call<AndroidJavaObject>("setBlockModes", new object[] { new[] { "GCM" } });
                builder.Call<AndroidJavaObject>("setEncryptionPaddings", new object[] { new[] { "NoPadding" } });

                using (var spec = builder.Call<AndroidJavaObject>("build"))
                {
                    keyGenerator.Call("init", spec);
                    return keyGenerator.Call<AndroidJavaObject>("generateKey");
                }
            }
        }

        private static string AndroidEncrypt(string plainText)
        {
            var bytes = Encoding.UTF8.GetBytes(plainText);

            using (var cipherClass = new AndroidJavaClass("javax.crypto.Cipher"))
            using (var cipher = cipherClass.CallStatic<AndroidJavaObject>("getInstance", "AES/GCM/NoPadding"))
            using (var key = GetAndroidKey())
            {
                cipher.Call("init", 1, key);

                var iv = cipher.Call<byte[]>("getIV");
                var encrypted = cipher.Call<byte[]>("doFinal", new object[] { bytes });

                var combined = new byte[iv.Length + encrypted.Length];
                Buffer.BlockCopy(iv, 0, combined, 0, iv.Length);
                Buffer.BlockCopy(encrypted, 0, combined, iv.Length, encrypted.Length);

                return Convert.ToBase64String(combined);
            }
        }

        private static string AndroidDecrypt(string encoded)
        {
            var combined = Convert.FromBase64String(encoded);

            if (combined.Length < 13)
            {
                throw new InvalidOperationException("Invalid encrypted session.");
            }

            var iv = new byte[12];
            var encrypted = new byte[combined.Length - iv.Length];

            Buffer.BlockCopy(combined, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(combined, iv.Length, encrypted, 0, encrypted.Length);

            using (var cipherClass = new AndroidJavaClass("javax.crypto.Cipher"))
            using (var cipher = cipherClass.CallStatic<AndroidJavaObject>("getInstance", "AES/GCM/NoPadding"))
            using (var key = GetAndroidKey())
            using (var spec = new AndroidJavaObject("javax.crypto.spec.GCMParameterSpec", 128, iv))
            {
                cipher.Call("init", 2, key, spec);

                var decrypted = cipher.Call<byte[]>("doFinal", new object[] { encrypted });
                return Encoding.UTF8.GetString(decrypted);
            }
        }

#endif
    }
}