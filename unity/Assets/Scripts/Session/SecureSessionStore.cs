using System;
using System.Text;
using UnityEngine;
using Vexforge.Backend;
using Vexforge.Core;

namespace Vexforge.Session
{
    public sealed class SecureSessionStore : ISessionStore
    {
        private const string StorageKey = "vexforge.secure_session.v1";
        private const string KeyAlias = "vexforge_session_key_v1";
        private const string EnvelopeVersion = "v1";

        public SessionSnapshot Load()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            var envelope = PlayerPrefs.GetString(StorageKey, string.Empty);
            if (string.IsNullOrWhiteSpace(envelope))
                return null;

            try
            {
                var parts = envelope.Split('|');
                if (parts.Length != 3 || parts[0] != EnvelopeVersion)
                    throw new InvalidOperationException("Unsupported secure session envelope.");

                var plainBytes = Decrypt(
                    DecodeBase64(parts[1]),
                    DecodeBase64(parts[2]));
                var json = Encoding.UTF8.GetString(plainBytes);
                return JsonUtility.FromJson<SessionSnapshot>(json);
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Secure session could not be restored: " + exception.GetType().Name);
                Clear();
                return null;
            }
#else
            return null;
#endif
        }

        public void Save(SessionSnapshot snapshot)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            if (snapshot == null ||
                string.IsNullOrWhiteSpace(snapshot.accessToken) ||
                string.IsNullOrWhiteSpace(snapshot.refreshToken))
            {
                Clear();
                return;
            }

            try
            {
                var plainBytes = Encoding.UTF8.GetBytes(JsonUtility.ToJson(snapshot));
                var encrypted = Encrypt(plainBytes, out var iv);
                var envelope = string.Join(
                    "|",
                    EnvelopeVersion,
                    EncodeBase64(iv),
                    EncodeBase64(encrypted));
                PlayerPrefs.SetString(StorageKey, envelope);
                PlayerPrefs.Save();
            }
            catch (Exception exception)
            {
                AppLogger.Warning("Secure session could not be persisted: " + exception.GetType().Name);
            }
#endif
        }

        public void Clear()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            PlayerPrefs.DeleteKey(StorageKey);
            PlayerPrefs.Save();
#endif
        }

#if UNITY_ANDROID && !UNITY_EDITOR
        private static AndroidJavaObject GetOrCreateKey()
        {
            using (var keyStoreClass = new AndroidJavaClass("java.security.KeyStore"))
            using (var keyStore = keyStoreClass.CallStatic<AndroidJavaObject>("getInstance", "AndroidKeyStore"))
            {
                keyStore.Call("load", new object[] { null });
                if (!keyStore.Call<bool>("containsAlias", KeyAlias))
                {
                    using (var keyProperties = new AndroidJavaClass("android.security.keystore.KeyProperties"))
                    using (var keyGeneratorClass = new AndroidJavaClass("javax.crypto.KeyGenerator"))
                    using (var keyGenerator = keyGeneratorClass.CallStatic<AndroidJavaObject>(
                               "getInstance",
                               "AES",
                               "AndroidKeyStore"))
                    {
                        var purposes =
                            keyProperties.GetStatic<int>("PURPOSE_ENCRYPT") |
                            keyProperties.GetStatic<int>("PURPOSE_DECRYPT");
                        using (var builder = new AndroidJavaObject(
                                   "android.security.keystore.KeyGenParameterSpec$Builder",
                                   KeyAlias,
                                   purposes))
                        {
                            builder.Call<AndroidJavaObject>(
                                "setBlockModes",
                                new object[] { new[] { "GCM" } });
                            builder.Call<AndroidJavaObject>(
                                "setEncryptionPaddings",
                                new object[] { new[] { "NoPadding" } });
                            using (var spec = builder.Call<AndroidJavaObject>("build"))
                            {
                                keyGenerator.Call("init", spec);
                                keyGenerator.Call<AndroidJavaObject>("generateKey");
                            }
                        }
                    }
                }

                return keyStore.Call<AndroidJavaObject>("getKey", KeyAlias, null);
            }
        }

        private static byte[] Encrypt(byte[] plainBytes, out byte[] iv)
        {
            using (var cipherClass = new AndroidJavaClass("javax.crypto.Cipher"))
            using (var cipher = cipherClass.CallStatic<AndroidJavaObject>(
                       "getInstance",
                       "AES/GCM/NoPadding"))
            using (var key = GetOrCreateKey())
            {
                cipher.Call("init", 1, key);
                iv = cipher.Call<byte[]>("getIV");
                return cipher.Call<byte[]>("doFinal", plainBytes);
            }
        }

        private static byte[] Decrypt(byte[] iv, byte[] encryptedBytes)
        {
            using (var cipherClass = new AndroidJavaClass("javax.crypto.Cipher"))
            using (var parameterSpec = new AndroidJavaObject(
                       "javax.crypto.spec.GCMParameterSpec",
                       128,
                       iv))
            using (var cipher = cipherClass.CallStatic<AndroidJavaObject>(
                       "getInstance",
                       "AES/GCM/NoPadding"))
            using (var key = GetOrCreateKey())
            {
                cipher.Call("init", 2, key, parameterSpec);
                return cipher.Call<byte[]>("doFinal", encryptedBytes);
            }
        }

        private static string EncodeBase64(byte[] bytes)
        {
            using (var base64 = new AndroidJavaClass("android.util.Base64"))
            {
                var noWrap = base64.GetStatic<int>("NO_WRAP");
                return base64.CallStatic<string>("encodeToString", bytes, noWrap);
            }
        }

        private static byte[] DecodeBase64(string value)
        {
            using (var base64 = new AndroidJavaClass("android.util.Base64"))
            {
                var noWrap = base64.GetStatic<int>("NO_WRAP");
                return base64.CallStatic<byte[]>("decode", value, noWrap);
            }
        }
#endif
    }
}