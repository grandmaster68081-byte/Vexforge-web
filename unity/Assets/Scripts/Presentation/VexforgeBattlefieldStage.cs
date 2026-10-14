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
        private readonly Dictionary<string, Material> battlefieldMeshMaterials =
            new Dictionary<string, Material>();
        private Transform arenaRoot;
        private Transform playerZone;
        private Transform opponentZone;
        private Transform impactCore;
        private Light atmosphereLight;
        private Color baseAtmosphereColor = new Color(0.20f, 0.42f, 0.68f, 1f);
        private float baseAtmosphereIntensity = 2.2f;
        private Camera targetCamera;
        private VexforgeCardArtResolver artResolver;
        private Func<string, CardRecord> cardLookup;
        private string localPlayerId;
        private bool initialized;
        private bool reducedMotion;
        private Vector3 cameraHomePosition;
        private Quaternion cameraHomeRotation;
        private float cameraHomeFieldOfView;
        private float cameraHomeOrthographicSize;
        private Coroutine atmosphereReturn;
        private MaterialPropertyBlock pulseBlock;

        public bool IsInitialized { get { return initialized; } }

        public void Initialize(
            Camera camera,
            VexforgeCardArtResolver resolver,
            Func<string, CardRecord> lookup,
            string playerId)
        {
            if (initialized)
                return;

            Debug.Log(
                "[VEXFORGE][Lifecycle] VexforgeBattlefieldStage phase=initialize-start camera=" +
                (camera != null) + " resolver=" + (resolver != null),
                this);
            targetCamera = camera != null ? camera : Camera.main;
            artResolver = resolver;
            cardLookup = lookup;
            localPlayerId = playerId;

            if (targetCamera != null)
            {
                cameraHomePosition = targetCamera.transform.position;
                cameraHomeRotation = targetCamera.transform.rotation;
                cameraHomeFieldOfView = targetCamera.fieldOfView;
                cameraHomeOrthographicSize = targetCamera.orthographicSize;
            }

            BuildArena();
            initialized = true;
            gameObject.SetActive(false);
            Debug.Log(
                "[VEXFORGE][Lifecycle] VexforgeBattlefieldStage phase=initialized camera-bound=" +
                (targetCamera != null) + " resolver-bound=" + (artResolver != null),
                this);
        }

        public void SetLocalPlayerId(string playerId)
        {
            localPlayerId = playerId;
        }

        public void SetReducedMotion(bool enabled)
        {
            reducedMotion = enabled;
        }

        public bool TryGetEventAnchor(BattleEvent battleEvent, out Vector3 position)
        {
            position = Vector3.zero;
            if (!initialized || battleEvent == null)
                return false;

            var kind = BattlePresentationPolicy.Classify(battleEvent.event_type);
            if ((kind == BattlePresentationKind.Boss || kind == BattlePresentationKind.Victory) &&
                impactCore != null)
            {
                position = impactCore.position + Vector3.up * 0.35f;
                return true;
            }

            var preferTarget = kind == BattlePresentationKind.Attack ||
                               kind == BattlePresentationKind.Defeat ||
                               kind == BattlePresentationKind.Heal ||
                               kind == BattlePresentationKind.Status ||
                               kind == BattlePresentationKind.Neutral;
            var firstId = preferTarget ? battleEvent.target_id : battleEvent.actor_id;
            var secondId = preferTarget ? battleEvent.actor_id : battleEvent.target_id;

            if (TryGetSideAnchor(firstId, out position) ||
                TryGetSideAnchor(secondId, out position))
                return true;

            // Events without participant IDs still belong to this authored arena. Use its
            // central core rather than emitting an effect at world origin.
            if (impactCore != null)
            {
                position = impactCore.position + Vector3.up * 0.35f;
                return true;
            }

            return false;
        }

        public void SetVisible(bool visible)
        {
            if (!initialized)
                return;

            if (!visible)
            {
                StopAllCoroutines();
                atmosphereReturn = null;
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
            if (battleEvent == null)
                yield break;
            yield return PresentEvent(battleEvent, BattlePresentationPolicy.Classify(battleEvent.event_type));
        }

        public IEnumerator PresentEvent(BattleEvent battleEvent, BattlePresentationKind kind)
        {
            if (!initialized || battleEvent == null)
                yield break;

            // These fields are already part of the verified BattleEvent contract and are used by the existing shell.
            // Optional encounter/card target fields stay reflective so this presentation layer never invents a compile-time contract.
            var type = battleEvent.event_type;
            var actorId = battleEvent.actor_id;
            var targetId = ReadString(battleEvent, "target_id", "targetId", "victim_id", "victimId");
            var cardId = ReadString(battleEvent, "card_id", "cardId", "source_card_id", "sourceCardId");
            var bossId = ReadString(battleEvent, "boss_id", "bossId", "encounter_id", "encounterId");
            Color atmosphereColor;
            float atmosphereIntensity;
            ResolveAtmosphere(kind, out atmosphereColor, out atmosphereIntensity);

            if (reducedMotion)
            {
                // Keep a quiet, static event cue while removing camera, actor, and flash motion.
                SetAtmosphere(atmosphereColor, Mathf.Min(atmosphereIntensity, 3.0f));
                yield return new WaitForSecondsRealtime(0.08f);
                yield break;
            }

            SetAtmosphere(atmosphereColor, atmosphereIntensity);
            var cameraShot = StartCoroutine(PresentCameraShot(kind));
            switch (kind)
            {
                case BattlePresentationKind.Boss:
                    yield return PresentBossArrival(bossId);
                    break;
                case BattlePresentationKind.Victory:
                    yield return PresentVictory(type);
                    break;
                case BattlePresentationKind.Cast:
                    yield return PresentCardEntry(cardId, actorId);
                    break;
                case BattlePresentationKind.Attack:
                    yield return PresentImpact(actorId, targetId, true);
                    break;
                case BattlePresentationKind.Guard:
                    yield return PresentShield(actorId);
                    break;
                case BattlePresentationKind.Heal:
                    yield return PresentPulse(true);
                    break;
                case BattlePresentationKind.Defeat:
                    yield return PresentDefeat(targetId, actorId);
                    break;
                case BattlePresentationKind.Status:
                case BattlePresentationKind.Neutral:
                default:
                    yield return PresentNeutralEvent(type, actorId, targetId);
                    break;
            }
            if (cameraShot != null)
                yield return cameraShot;
        }

        private static void ResolveAtmosphere(
            BattlePresentationKind kind,
            out Color color,
            out float intensity)
        {
            switch (kind)
            {
                case BattlePresentationKind.Boss:
                    color = new Color(0.35f, 0.28f, 0.82f, 1f); intensity = 5.5f; return;
                case BattlePresentationKind.Victory:
                    color = new Color(0.95f, 0.72f, 0.28f, 1f); intensity = 6.0f; return;
                case BattlePresentationKind.Defeat:
                    color = new Color(0.75f, 0.12f, 0.18f, 1f); intensity = 7.0f; return;
                case BattlePresentationKind.Cast:
                    color = new Color(0.25f, 0.55f, 0.90f, 1f); intensity = 5.0f; return;
                case BattlePresentationKind.Attack:
                    color = new Color(0.95f, 0.22f, 0.16f, 1f); intensity = 6.5f; return;
                case BattlePresentationKind.Guard:
                    color = new Color(0.92f, 0.67f, 0.28f, 1f); intensity = 5.5f; return;
                case BattlePresentationKind.Heal:
                    color = new Color(0.25f, 0.86f, 0.72f, 1f); intensity = 5.0f; return;
                case BattlePresentationKind.Status:
                    color = new Color(0.62f, 0.34f, 0.75f, 1f); intensity = 4.5f; return;
                default:
                    color = new Color(0.20f, 0.42f, 0.68f, 1f); intensity = 2.8f; return;
            }
        }

        private void BuildArena()
        {
            arenaRoot = new GameObject("BattlefieldArena").transform;
            arenaRoot.SetParent(transform, false);
            arenaRoot.localPosition = new Vector3(0f, 0f, 5.1f);

            VexforgeWorldMeshFactory.Instantiate(
                "VF_BATTLE_CITADEL_ARENA",
                arenaRoot,
                Vector3.zero,
                Quaternion.identity,
                Vector3.one,
                ResolveBattlefieldMeshMaterial);

            playerZone = CreateAnchor(
                "PlayerZone",
                new Vector3(0f, -0.10f, -2.95f));
            opponentZone = CreateAnchor(
                "OpponentZone",
                new Vector3(0f, -0.10f, 2.95f));

            var lightObject = new GameObject("BattleAtmosphereLight");
            lightObject.transform.SetParent(arenaRoot, false);
            lightObject.transform.localPosition = new Vector3(0f, 4.5f, 0f);
            atmosphereLight = lightObject.AddComponent<Light>();
            atmosphereLight.type = LightType.Point;
            atmosphereLight.range = 12f;
            atmosphereLight.intensity = baseAtmosphereIntensity;
            atmosphereLight.color = baseAtmosphereColor;

            impactCore = VexforgeWorldMeshFactory.Instantiate(
                "VF_BATTLE_CITADEL_CORE",
                arenaRoot,
                new Vector3(0f, -0.06f, 0f),
                Quaternion.identity,
                Vector3.one,
                ResolveBattlefieldMeshMaterial).transform;
        }

        private Transform CreateAnchor(string name, Vector3 position)
        {
            var anchor = new GameObject(name).transform;
            anchor.SetParent(arenaRoot, false);
            anchor.localPosition = position;
            return anchor;
        }

        private void SetAtmosphere(Color color, float intensity)
        {
            if (atmosphereLight == null) return;
            if (atmosphereReturn != null)
                StopCoroutine(atmosphereReturn);
            atmosphereReturn = null;
            atmosphereLight.color = color;
            atmosphereLight.intensity = intensity;
            atmosphereReturn = StartCoroutine(RestoreAtmosphereAfterDelay(0.95f));
        }

        private IEnumerator RestoreAtmosphereAfterDelay(float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            if (atmosphereLight != null)
            {
                atmosphereLight.color = baseAtmosphereColor;
                atmosphereLight.intensity = baseAtmosphereIntensity;
            }
            atmosphereReturn = null;
        }

        private IEnumerator PresentCardEntry(string cardId, string actorId)
        {
            var card = ResolveCard(cardId);
            if (card == null)
            {
                Debug.LogError(
                    "VEXFORGE battle card visual unavailable: card_id=" + cardId,
                    this);
                yield break;
            }

            var localSide = IsLocalActor(actorId);
            var destination = localSide ? playerZone.position : opponentZone.position;
            var start = destination + Vector3.up * 4.8f + new Vector3(0f, 0f, localSide ? -3.5f : 3.5f);
            var view = VexforgeCardView.CreateRuntime(arenaRoot);
            if (view == null)
            {
                Debug.LogError(
                    "VEXFORGE battle card view could not be created: card_id=" + cardId,
                    this);
                yield break;
            }

            transientObjects.Add(view.gameObject);
            view.SetArtMode(CardArtMode.FullCardArtwork);
            view.Bind(card, null, false, true, false, artResolver, CardArtMode.FullCardArtwork);
            view.transform.position = start;
            view.transform.localScale = Vector3.one * 0.75f;
            view.transform.rotation = Quaternion.Euler(0f, localSide ? 180f : 0f, localSide ? -10f : 10f);

            var duration = 0.62f;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.unscaledDeltaTime / duration;
                var eased = EaseOutCubic(Mathf.Clamp01(t));
                var position = Vector3.Lerp(start, destination + Vector3.up * 1.05f, eased);
                position.y += Mathf.Sin(eased * Mathf.PI) * 0.8f;

                view.transform.position = position;
                view.transform.Rotate(0f, 24f * Time.unscaledDeltaTime, 0f, Space.Self);
                yield return null;
            }

            yield return CameraImpulse(0.20f, 0.085f);
            yield return PresentPulse(localSide);
            yield return PresentManifestation(view.transform, localSide);
            DestroyTransientObject(view.gameObject);
        }

        private IEnumerator PresentManifestation(Transform actor, bool localSide)
        {
            if (actor == null)
                yield break;

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
                yield return null;
            }

            actor.localScale = start;
            actor.position = startPosition;
            actor.rotation = startRotation;
        }

        private IEnumerator PresentImpact(string actorId, string targetId, bool hostile)
        {
            yield return new WaitForSecondsRealtime(0.14f);
            yield return CameraImpulse(0.16f, hostile ? 0.12f : 0.07f);
            yield return PresentPulse(!hostile);
        }

        private IEnumerator PresentShield(string actorId)
        {
            yield return new WaitForSecondsRealtime(0.38f);
        }

        private IEnumerator PresentDefeat(string targetId, string actorId)
        {
            yield return CameraImpulse(0.20f, 0.10f);
            yield return new WaitForSecondsRealtime(0.40f);
        }

        private IEnumerator PresentBossArrival(string bossId)
        {
            SetAtmosphere(new Color(0.43f, 0.20f, 0.78f, 1f), 5.0f);
            yield return PresentPulse(false);
            yield return CameraImpulse(0.34f, 0.14f);
            yield return new WaitForSecondsRealtime(0.42f);
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

            var renderers = impactCore.GetComponentsInChildren<Renderer>();
            if (renderers == null || renderers.Length == 0)
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
                for (var i = 0; i < renderers.Length; i++)
                {
                    var renderer = renderers[i];
                    if (renderer == null)
                        continue;

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
                }
                yield return null;
            }
            impactCore.localScale = baseScale;
            for (var i = 0; i < renderers.Length; i++)
            {
                if (renderers[i] != null)
                    renderers[i].SetPropertyBlock(null);
            }
        }

        private IEnumerator CameraImpulse(float duration, float amplitude)
        {
            if (targetCamera == null || reducedMotion)
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

        private IEnumerator PresentCameraShot(BattlePresentationKind kind)
        {
            if (targetCamera == null || reducedMotion)
                yield break;

            var zoom = BattlePresentationPolicy.CameraZoom(kind);
            if (zoom <= 1.001f)
                yield break;

            var duration = BattlePresentationPolicy.CameraDurationMs(kind) / 1000f;
            var original = targetCamera.orthographic
                ? targetCamera.orthographicSize
                : targetCamera.fieldOfView;
            var focused = original / zoom;
            var elapsed = 0f;
            var halfDuration = Mathf.Max(0.01f, duration * 0.5f);

            while (elapsed < halfDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                var t = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(elapsed / halfDuration));
                SetCameraLens(Mathf.Lerp(original, focused, t));
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                var t = Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(elapsed / halfDuration));
                SetCameraLens(Mathf.Lerp(focused, original, t));
                yield return null;
            }
            SetCameraLens(original);
        }

        private void SetCameraLens(float value)
        {
            if (targetCamera == null)
                return;
            if (targetCamera.orthographic)
                targetCamera.orthographicSize = Mathf.Max(0.01f, value);
            else
                targetCamera.fieldOfView = Mathf.Clamp(value, 1f, 179f);
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

        private bool TryGetSideAnchor(string participantId, out Vector3 position)
        {
            position = Vector3.zero;
            if (string.IsNullOrWhiteSpace(participantId))
                return false;

            var side = IsLocalActor(participantId) ? playerZone : opponentZone;
            if (side == null)
                return false;

            position = side.position + Vector3.up * 0.65f;
            return true;
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
                targetCamera.fieldOfView = cameraHomeFieldOfView;
                targetCamera.orthographicSize = cameraHomeOrthographicSize;
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

            transientObjects.Remove(obj);
            UnityEngine.Object.Destroy(obj);
        }

        private Material ResolveBattlefieldMeshMaterial(string importedName)
        {
            if (string.IsNullOrWhiteSpace(importedName))
            {
                throw new InvalidOperationException(
                    "VEXFORGE battlefield mesh contains an unnamed material.");
            }

            string palette;
            string textureId;
            Color color;
            float metallic;
            float smoothness;
            var emission = false;
            if (importedName.IndexOf("VEXFORGE_OBSIDIAN", StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_OBSIDIAN";
                textureId = "VF_NEXUS_OBSIDIAN_ALBEDO";
                color = new Color(0.68f, 0.63f, 0.78f, 1f);
                metallic = 0.28f;
                smoothness = 0.43f;
            }
            else if (importedName.IndexOf("VEXFORGE_IRON", StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_IRON";
                textureId = "VF_NEXUS_IRON_ALBEDO";
                color = new Color(0.74f, 0.78f, 0.84f, 1f);
                metallic = 0.72f;
                smoothness = 0.56f;
            }
            else if (importedName.IndexOf("VEXFORGE_BRASS", StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_BRASS";
                textureId = "VF_NEXUS_BRASS_ALBEDO";
                color = new Color(0.90f, 0.78f, 0.52f, 1f);
                metallic = 0.82f;
                smoothness = 0.64f;
            }
            else if (importedName.IndexOf("VEXFORGE_CYAN", StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_CYAN";
                textureId = "VF_NEXUS_CYAN_ALBEDO";
                color = new Color(0.66f, 0.88f, 0.96f, 1f);
                metallic = 0.32f;
                smoothness = 0.52f;
                emission = true;
            }
            else if (importedName.IndexOf("VEXFORGE_ACCENT", StringComparison.Ordinal) >= 0)
            {
                palette = "VEXFORGE_ACCENT";
                textureId = "VF_NEXUS_BRASS_ALBEDO";
                color = new Color(0.92f, 0.48f, 0.22f, 1f);
                metallic = 0.55f;
                smoothness = 0.48f;
                emission = true;
            }
            else
            {
                throw new InvalidOperationException(
                    "VEXFORGE battlefield material is not in the approved palette: " +
                    importedName);
            }

            Material cached;
            if (battlefieldMeshMaterials.TryGetValue(palette, out cached) && cached != null)
                return cached;

            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE battlefield requires the installed Universal Render Pipeline/Lit shader.");
            }

            var texture = Resources.Load<Texture2D>(
                "VexforgeTier1/Models/" + textureId);
            if (texture == null)
            {
                throw new InvalidOperationException(
                    "VEXFORGE battlefield material texture is missing: asset_id=" +
                    textureId);
            }

            var material = new Material(shader)
            {
                name = "VexforgeBattlefield_" + palette,
            };
            if (material.HasProperty("_BaseColor"))
                material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color"))
                material.SetColor("_Color", color);
            if (material.HasProperty("_BaseMap"))
                material.SetTexture("_BaseMap", texture);
            if (material.HasProperty("_Metallic"))
                material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Smoothness"))
                material.SetFloat("_Smoothness", smoothness);
            if (emission && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * 1.25f);
            }

            ownedMaterials.Add(material);
            battlefieldMeshMaterials.Add(palette, material);
            return material;
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

        private void OnDestroy()
        {
            StopAllCoroutines();
            atmosphereReturn = null;
            ResetTransientPresentation();
            if (impactCore != null)
            {
                var renderers = impactCore.GetComponentsInChildren<Renderer>();
                for (var i = 0; i < renderers.Length; i++)
                {
                    if (renderers[i] != null)
                        renderers[i].SetPropertyBlock(null);
                }
            }
            battlefieldMeshMaterials.Clear();
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
