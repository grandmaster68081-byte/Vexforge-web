using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using Vexforge.Backend;

namespace Vexforge.Presentation
{
    /// <summary>
    /// Presentation-only battlefield. It never decides combat rules or outcomes.
    /// Backend BattleEvent payloads are interpreted only for visual presentation.
    /// Unknown events fall back to a safe impact pulse instead of being discarded.
    /// </summary>
    public sealed class VexforgeBattlefieldStage : MonoBehaviour
    {
        private readonly List<GameObject> transientObjects = new List<GameObject>();
        private readonly List<Material> ownedMaterials = new List<Material>();
        private readonly List<Mesh> ownedMeshes = new List<Mesh>();
        private Transform arenaRoot;
        private Transform playerZone;
        private Transform opponentZone;
        private Transform impactCore;
        private Light atmosphereLight;
        private Camera targetCamera;
        private VexforgeCardArtResolver artResolver;
        private Func<string, CardRecord> cardLookup;
        private string localPlayerId;
        private bool initialized;
        private Material boardMaterial;
        private Material accentMaterial;
        private Material hostileMaterial;
        private Material neutralMaterial;
        private Vector3 cameraHomePosition;
        private Quaternion cameraHomeRotation;
        private MaterialPropertyBlock pulseBlock;

        public void Initialize(
            Camera camera,
            VexforgeCardArtResolver resolver,
            Func<string, CardRecord> lookup,
            string playerId)
        {
            if (initialized)
                return;

            targetCamera = camera != null ? camera : Camera.main;
            artResolver = resolver;
            cardLookup = lookup;
            localPlayerId = playerId;

            if (targetCamera != null)
            {
                cameraHomePosition = targetCamera.transform.position;
                cameraHomeRotation = targetCamera.transform.rotation;
            }

            CreateMaterials();
            BuildArena();
            initialized = true;
            gameObject.SetActive(false);
        }

        public void SetLocalPlayerId(string playerId)
        {
            localPlayerId = playerId;
        }

        public void SetVisible(bool visible)
        {
            if (!initialized)
                return;

            if (!visible)
            {
                StopAllCoroutines();
                ResetTransientPresentation();
                if (gameObject.activeSelf)
                    gameObject.SetActive(false);
                return;
            }

            if (!gameObject.activeSelf)
                gameObject.SetActive(true);
        }

        public IEnumerator PresentEvent(BattleEvent battleEvent)
        {
            if (!initialized || battleEvent == null)
                yield break;

            // These fields are already part of the verified BattleEvent contract and are used by the existing shell.
            // Optional encounter/card target fields stay reflective so this presentation layer never invents a compile-time contract.
            var type = battleEvent.event_type;
            var actorId = battleEvent.actor_id;
            var targetId = ReadString(battleEvent, "target_id", "targetId", "victim_id", "victimId");
            var cardId = ReadString(battleEvent, "card_id", "cardId", "source_card_id", "sourceCardId");
            if (ContainsAny(type, "victory", "win", "match_end", "battle_end", "complete"))
            {
                yield return PresentVictory(type);
                yield break;
            }

            if (ContainsAny(type, "play", "cast", "summon", "deploy", "invoke"))
            {
                yield return PresentCardEntry(cardId, actorId);
                yield break;
            }

            if (ContainsAny(type, "attack", "strike", "hit", "damage", "deal_damage"))
            {
                yield return PresentImpact(actorId, targetId, true);
                yield break;
            }

            if (ContainsAny(type, "guard", "defend", "shield", "sentinel"))
            {
                yield return PresentShield(actorId);
                yield break;
            }

            if (ContainsAny(type, "heal", "restore", "regenerate"))
            {
                yield return PresentPulse(true);
                yield break;
            }

            if (ContainsAny(type, "death", "destroy", "remove", "defeat"))
            {
                yield return PresentDefeat(targetId, actorId);
                yield break;
            }

            yield return PresentNeutralEvent(type, actorId, targetId);
        }

        private void BuildArena()
        {
            arenaRoot = new GameObject("BattlefieldArena").transform;
            arenaRoot.SetParent(transform, false);

            CreatePrimitive(
                "ArenaFloor",
                PrimitiveType.Cube,
                new Vector3(0f, -0.65f, 5.1f),
                new Vector3(18f, 0.55f, 15f),
                boardMaterial,
                arenaRoot);

            CreateRing("ArenaOuterRing", new Vector3(0f, -0.34f, 5.0f), 7.0f, 0.10f, accentMaterial, arenaRoot);
            CreateRing("ArenaCoreRing", new Vector3(0f, -0.24f, 5.0f), 2.9f, 0.08f, neutralMaterial, arenaRoot);

            playerZone = CreateZone("PlayerZone", new Vector3(0f, -0.18f, 2.15f), 5.8f, new Color(0.10f, 0.34f, 0.44f, 1f));
            opponentZone = CreateZone("OpponentZone", new Vector3(0f, -0.18f, 7.95f), 5.8f, new Color(0.38f, 0.12f, 0.18f, 1f));

            var lightObject = new GameObject("BattleAtmosphereLight");
            lightObject.transform.SetParent(arenaRoot, false);
            lightObject.transform.localPosition = new Vector3(0f, 4.5f, 5.0f);
            atmosphereLight = lightObject.AddComponent<Light>();
            atmosphereLight.type = LightType.Point;
            atmosphereLight.range = 12f;
            atmosphereLight.intensity = baseAtmosphereIntensity;
            atmosphereLight.color = baseAtmosphereColor;

            impactCore = CreatePrimitive(
                "BattleCore",
                PrimitiveType.Cylinder,
                new Vector3(0f, 0.05f, 5.0f),
                new Vector3(1.3f, 0.28f, 1.3f),
                accentMaterial,
                arenaRoot).transform;

            for (var i = 0; i < 4; i++)
            {
                var angle = (i / 4f) * Mathf.PI * 2f;
                var p = new Vector3(Mathf.Cos(angle) * 6.2f, 0.15f, 5f + Mathf.Sin(angle) * 6.2f);
                CreatePrimitive("ArenaObelisk_" + i, PrimitiveType.Cube, p, new Vector3(0.35f, 2.3f, 0.35f), hostileMaterial, arenaRoot);
            }
        }

        private Transform CreateZone(string name, Vector3 position, float width, Color accent)
        {
            var zone = new GameObject(name).transform;
            zone.SetParent(arenaRoot, false);
            zone.localPosition = position;
            var ringMaterial = CreateMaterial(accent, true);
            ownedMaterials.Add(ringMaterial);
            CreateRing(name + "Ring", position + Vector3.up * 0.08f, width * 0.42f, 0.08f, ringMaterial, arenaRoot);
            var markerMaterial = CreateMaterial(new Color(accent.r, accent.g, accent.b, 0.34f), true);
            ownedMaterials.Add(markerMaterial);
            CreatePrimitive(name + "Marker", PrimitiveType.Cube, position, new Vector3(width, 0.06f, 1.9f), markerMaterial, arenaRoot);
            return zone;
        }

        private IEnumerator PresentCardEntry(string cardId, string actorId)
        {
            var localSide = IsLocalActor(actorId);
            var destination = localSide ? playerZone.position : opponentZone.position;
            var start = destination + Vector3.up * 4.8f + new Vector3(0f, 0f, localSide ? -3.5f : 3.5f);
            var card = ResolveCard(cardId);

            VexforgeCardView view = null;
            GameObject fallback = null;

            if (card != null)
            {
                view = VexforgeCardView.CreateRuntime(arenaRoot);
                transientObjects.Add(view.gameObject);
                view.SetArtMode(CardArtMode.FullCardArtwork);
                view.Bind(card, null, false, true, false, artResolver, CardArtMode.FullCardArtwork);
                view.transform.position = start;
                view.transform.localScale = Vector3.one * 0.75f;
                view.transform.rotation = Quaternion.Euler(0f, localSide ? 180f : 0f, localSide ? -10f : 10f);
            }
            else
            {
                fallback = CreatePrimitive(
                    "BattleEntryFallback",
                    PrimitiveType.Capsule,
                    start,
                    new Vector3(0.85f, 1.25f, 0.45f),
                    localSide ? accentMaterial : hostileMaterial,
                    arenaRoot);
                transientObjects.Add(fallback);
            }

            var duration = 0.62f;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / duration;
                var eased = EaseOutCubic(Mathf.Clamp01(t));
                var position = Vector3.Lerp(start, destination + Vector3.up * 1.05f, eased);
                position.y += Mathf.Sin(eased * Mathf.PI) * 0.8f;

                if (view != null)
                {
                    view.transform.position = position;
                    view.transform.Rotate(0f, 24f * Time.unscaledDeltaTime, 0f, Space.Self);
                }
                else if (fallback != null)
                {
                    fallback.transform.position = position;
                    fallback.transform.Rotate(0f, 42f * Time.unscaledDeltaTime, 0f, Space.Self);
                }
                yield return null;
            }

            yield return CameraImpulse(0.20f, 0.085f);
            yield return PresentPulse(localSide);
            yield return PresentManifestation(view != null ? view.transform : fallback == null ? null : fallback.transform, localSide);
            if (view != null)
                DestroyTransientObject(view.gameObject);
            if (fallback != null)
                DestroyTransientObject(fallback);
        }

        private IEnumerator PresentManifestation(Transform actor, bool localSide)
        {
            if (actor == null)
                yield break;

            var ring = CreateRing(
                "CardManifestationRing",
                actor.position + Vector3.down * 1.0f,
                1.35f,
                0.10f,
                neutralMaterial,
                arenaRoot);
            transientObjects.Add(ring.gameObject);

            var start = actor.localScale;
            var startPosition = actor.position;
            var startRotation = actor.rotation;
            var targetScale = start * 1.38f;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / 0.55f;
                var n = Mathf.Clamp01(t);
                var envelope = Mathf.Sin(n * Mathf.PI);
                actor.localScale = Vector3.Lerp(start, targetScale, envelope);
                actor.position = startPosition + Vector3.up * (0.30f * envelope);
                actor.rotation = startRotation * Quaternion.Euler(0f, (localSide ? 1f : -1f) * 180f * n, 0f);
                ring.localScale = Vector3.one * (0.80f + envelope * 0.55f);
                ring.Rotate(0f, 160f * Time.unscaledDeltaTime, 0f, Space.Self);
                yield return null;
            }

            actor.localScale = start;
            actor.position = startPosition;
            actor.rotation = startRotation;
            DestroyTransientObject(ring.gameObject);
        }

        private IEnumerator PresentImpact(string actorId, string targetId, bool hostile)
        {
            var sourceLocal = IsLocalActor(actorId);
            var targetLocal = !string.IsNullOrWhiteSpace(targetId)
                ? IsLocalActor(targetId)
                : !sourceLocal;

            var source = sourceLocal ? playerZone.position : opponentZone.position;
            var target = targetLocal ? playerZone.position : opponentZone.position;
            var start = source + Vector3.up * 0.55f;
            var end = target + Vector3.up * 0.55f;

            var bolt = CreatePrimitive(
                "ImpactProjectile",
                PrimitiveType.Sphere,
                start,
                Vector3.one * 0.24f,
                hostile ? accentMaterial : neutralMaterial,
                arenaRoot);
            transientObjects.Add(bolt);

            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / 0.26f;
                bolt.transform.position = Vector3.Lerp(start, end, EaseInOutCubic(Mathf.Clamp01(t)));
                yield return null;
            }

            bolt.SetActive(false);
            yield return CameraImpulse(0.16f, hostile ? 0.12f : 0.07f);
            yield return PresentPulse(!hostile);
            yield return new WaitForSecondsRealtime(0.18f);
            DestroyTransientObject(bolt);
        }

        private IEnumerator PresentShield(string actorId)
        {
            var local = IsLocalActor(actorId);
            var position = (local ? playerZone : opponentZone).position + Vector3.up * 0.35f;
            var shield = CreateRing("GuardRing", position, 1.6f, 0.15f, neutralMaterial, arenaRoot);
            transientObjects.Add(shield.gameObject);

            var baseScale = shield.localScale;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / 0.38f;
                var s = 0.78f + Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI) * 0.35f;
                shield.localScale = baseScale * s;
                shield.Rotate(0f, 120f * Time.unscaledDeltaTime, 0f, Space.Self);
                yield return null;
            }
            yield return new WaitForSecondsRealtime(0.16f);
            DestroyTransientObject(shield.gameObject);
        }

        private IEnumerator PresentDefeat(string targetId, string actorId)
        {
            var local = IsLocalActor(!string.IsNullOrWhiteSpace(targetId) ? targetId : actorId);
            var zone = local ? playerZone : opponentZone;
            var flash = CreatePrimitive(
                "DefeatFlash",
                PrimitiveType.Cylinder,
                zone.position + Vector3.up * 0.25f,
                new Vector3(2.8f, 0.12f, 2.8f),
                hostileMaterial,
                arenaRoot);
            transientObjects.Add(flash);

            var initial = flash.transform.localScale;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / 0.40f;
                var n = Mathf.Clamp01(t);
                flash.transform.localScale = initial * (0.65f + n * 1.75f);
                yield return null;
            }
            flash.SetActive(false);
            yield return CameraImpulse(0.20f, 0.10f);
            DestroyTransientObject(flash);
        }


        private IEnumerator PresentVictory(string eventType)
        {
            for (var i = 0; i < 3; i++)
            {
                yield return PresentPulse(i % 2 == 0);
                yield return new WaitForSecondsRealtime(0.08f);
            }
            yield return CameraImpulse(0.28f, 0.05f);
            yield return new WaitForSecondsRealtime(0.35f);
        }

        private IEnumerator PresentNeutralEvent(string eventType, string actorId, string targetId)
        {
            yield return PresentPulse(false);
            yield return new WaitForSecondsRealtime(0.14f);
        }

        private IEnumerator PresentPulse(bool restorative)
        {
            if (impactCore == null)
                yield break;

            var renderer = impactCore.GetComponent<Renderer>();
            if (renderer == null)
                yield break;

            if (pulseBlock == null)
                pulseBlock = new MaterialPropertyBlock();

            var baseScale = impactCore.localScale;
            var pulseColor = restorative
                ? new Color(0.25f, 0.75f, 0.95f, 1f)
                : new Color(0.95f, 0.56f, 0.20f, 1f);
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / 0.28f;
                var n = Mathf.Clamp01(t);
                var envelope = Mathf.Sin(n * Mathf.PI);
                impactCore.localScale = baseScale * (1f + envelope * 0.42f);
                pulseBlock.Clear();
                var material = renderer.sharedMaterial;
                if (material != null)
                {
                    if (material.HasProperty("_BaseColor"))
                        pulseBlock.SetColor("_BaseColor", Color.Lerp(material.GetColor("_BaseColor"), pulseColor, envelope));
                    if (material.HasProperty("_EmissionColor"))
                        pulseBlock.SetColor("_EmissionColor", pulseColor * (1.2f + envelope * 2.0f));
                }
                renderer.SetPropertyBlock(pulseBlock);
                yield return null;
            }
            impactCore.localScale = baseScale;
            renderer.SetPropertyBlock(null);
        }

        private IEnumerator CameraImpulse(float duration, float amplitude)
        {
            if (targetCamera == null)
                yield break;

            var startPosition = targetCamera.transform.position;
            var startRotation = targetCamera.transform.rotation;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / Mathf.Max(0.01f, duration);
                var n = Mathf.Clamp01(t);
                var envelope = 1f - n;
                var noise = new Vector3(
                    Mathf.Sin(n * 43f),
                    Mathf.Sin(n * 57f),
                    Mathf.Sin(n * 71f)) * amplitude * envelope;
                targetCamera.transform.position = startPosition + noise;
                targetCamera.transform.rotation = startRotation * Quaternion.Euler(noise * 3f);
                yield return null;
            }
            targetCamera.transform.position = startPosition;
            targetCamera.transform.rotation = startRotation;
        }

        private CardRecord ResolveCard(string cardId)
        {
            if (string.IsNullOrWhiteSpace(cardId) || cardLookup == null)
                return null;
            return cardLookup(cardId);
        }

        private bool IsLocalActor(string actorId)
        {
            return !string.IsNullOrWhiteSpace(actorId) &&
                   !string.IsNullOrWhiteSpace(localPlayerId) &&
                   string.Equals(actorId, localPlayerId, StringComparison.OrdinalIgnoreCase);
        }

        private void ResetTransientPresentation()
        {
            for (var i = transientObjects.Count - 1; i >= 0; i--)
            {
                if (transientObjects[i] != null)
                    DestroyTransientObject(transientObjects[i]);
            }
            transientObjects.Clear();

            if (targetCamera != null)
            {
                targetCamera.transform.position = cameraHomePosition;
                targetCamera.transform.rotation = cameraHomeRotation;
            }
            if (atmosphereLight != null)
            {
                atmosphereLight.color = baseAtmosphereColor;
                atmosphereLight.intensity = baseAtmosphereIntensity;
            }
        }

        private void DestroyTransientObject(GameObject obj)
        {
            if (obj == null)
                return;

            var filter = obj.GetComponent<MeshFilter>();
            if (filter != null && filter.sharedMesh != null && ownedMeshes.Contains(filter.sharedMesh))
            {
                var mesh = filter.sharedMesh;
                ownedMeshes.Remove(mesh);
                UnityEngine.Object.Destroy(mesh);
            }

            transientObjects.Remove(obj);
            UnityEngine.Object.Destroy(obj);
        }

        private void CreateMaterials()
        {
            boardMaterial = CreateMaterial(new Color(0.045f, 0.035f, 0.055f, 1f), false);
            accentMaterial = CreateMaterial(new Color(0.28f, 0.54f, 0.68f, 1f), true);
            hostileMaterial = CreateMaterial(new Color(0.58f, 0.15f, 0.18f, 1f), true);
            neutralMaterial = CreateMaterial(new Color(0.78f, 0.60f, 0.32f, 1f), true);
            ownedMaterials.Add(boardMaterial);
            ownedMaterials.Add(accentMaterial);
            ownedMaterials.Add(hostileMaterial);
            ownedMaterials.Add(neutralMaterial);
        }

        private static Material CreateMaterial(Color color, bool emission)
        {
            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
                shader = Shader.Find("Standard");
            if (shader == null)
                return null;

            var material = new Material(shader)
            {
                name = "VexforgeRuntimeBattleMaterial"
            };
            if (material.HasProperty("_BaseColor"))
                material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color"))
                material.SetColor("_Color", color);
            if (emission)
            {
                if (material.HasProperty("_EmissionColor"))
                    material.SetColor("_EmissionColor", color * 1.8f);
                material.EnableKeyword("_EMISSION");
            }
            return material;
        }

        private static GameObject CreatePrimitive(
            string name,
            PrimitiveType primitive,
            Vector3 position,
            Vector3 scale,
            Material material,
            Transform parent)
        {
            var go = GameObject.CreatePrimitive(primitive);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            var collider = go.GetComponent<Collider>();
            if (collider != null)
                UnityEngine.Object.Destroy(collider);
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null && material != null)
                renderer.sharedMaterial = material;
            return go;
        }

        private Transform CreateRing(
            string name,
            Vector3 position,
            float radius,
            float thickness,
            Material material,
            Transform parent)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            var filter = go.AddComponent<MeshFilter>();
            var renderer = go.AddComponent<MeshRenderer>();
            var mesh = BuildRingMesh(radius, thickness, 64);
            filter.sharedMesh = mesh;
            ownedMeshes.Add(mesh);
            renderer.sharedMaterial = material;
            return go.transform;
        }

        private static Mesh BuildRingMesh(float radius, float thickness, int segments)
        {
            var mesh = new Mesh { name = "VexforgeRingMesh" };
            var vertices = new Vector3[segments * 2];
            var triangles = new int[segments * 6];
            var inner = Mathf.Max(0.01f, radius - thickness);
            for (var i = 0; i < segments; i++)
            {
                var angle = i / (float)segments * Mathf.PI * 2f;
                var dir = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle));
                vertices[i * 2] = dir * inner;
                vertices[i * 2 + 1] = dir * radius;
                var next = (i + 1) % segments;
                var t = i * 6;
                triangles[t] = i * 2;
                triangles[t + 1] = next * 2 + 1;
                triangles[t + 2] = i * 2 + 1;
                triangles[t + 3] = i * 2;
                triangles[t + 4] = next * 2;
                triangles[t + 5] = next * 2 + 1;
            }
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static string ReadString(object source, params string[] names)
        {
            if (source == null)
                return null;
            var type = source.GetType();
            for (var i = 0; i < names.Length; i++)
            {
                var property = type.GetProperty(names[i], BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
                if (property != null && property.PropertyType == typeof(string))
                    return property.GetValue(source, null) as string;

                var field = type.GetField(names[i], BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
                if (field != null && field.FieldType == typeof(string))
                    return field.GetValue(source) as string;
            }
            return null;
        }

        private static bool ContainsAny(string value, params string[] tokens)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;
            var normalized = value.ToLowerInvariant();
            for (var i = 0; i < tokens.Length; i++)
            {
                if (normalized.Contains(tokens[i]))
                    return true;
            }
            return false;
        }

        private static float EaseOutCubic(float value)
        {
            var oneMinus = 1f - value;
            return 1f - oneMinus * oneMinus * oneMinus;
        }

        private static float EaseInOutCubic(float value)
        {
            return value < 0.5f
                ? 4f * value * value * value
                : 1f - Mathf.Pow(-2f * value + 2f, 3f) / 2f;
        }

        private void OnDestroy()
        {
            StopAllCoroutines();
            ResetTransientPresentation();
            if (impactCore != null)
            {
                var renderer = impactCore.GetComponent<Renderer>();
                if (renderer != null) renderer.SetPropertyBlock(null);
            }
            for (var i = ownedMeshes.Count - 1; i >= 0; i--)
            {
                if (ownedMeshes[i] != null)
                    UnityEngine.Object.Destroy(ownedMeshes[i]);
            }
            ownedMeshes.Clear();
            for (var i = ownedMaterials.Count - 1; i >= 0; i--)
            {
                if (ownedMaterials[i] != null)
                    UnityEngine.Object.Destroy(ownedMaterials[i]);
            }
            ownedMaterials.Clear();
            if (targetCamera != null)
            {
                targetCamera.transform.position = cameraHomePosition;
                targetCamera.transform.rotation = cameraHomeRotation;
            }
        }

    }
}
