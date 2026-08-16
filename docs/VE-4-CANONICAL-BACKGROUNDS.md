# VE-4-CANONICAL-BACKGROUNDS — Procedencia de los fondos propios

Unidad: VE-ASSET. Fecha: 2026-08-16. Cierra la deuda `PENDING_SOURCE_BACKGROUNDS`
declarada en VE-3-ASSET-REF-INTEGRITY.

Fuente canónica de destino: bucket público `vexforge-assets` del proyecto
Supabase oficial `rscuzqnfccqvltkdcdny`, carpeta `backgrounds/`.

Lenguaje visual de referencia (diagnóstico previo): `backgrounds/bg_pvp.jpg`,
`bg_missions.jpg`, `bg_clans.jpg` — pintura digital, arquitectura gótica de
forja, paleta azul noche profundo + naranja fundido, brasas en suspensión,
sin personajes protagonistas en primer plano y sin texto.

## Assets publicados

| Superficie | Ruta en Storage | Formato | Dimensiones | Peso | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| achievements | `backgrounds/bg_achievements.jpg` | JPEG progresivo q86 | 1024x1024 | 186566 B | `472cf636a0680a29019318eeb651d7095919f13aa37bcc3938c0a0082ba837da` |
| leaderboard (`/season-rankings`) | `backgrounds/bg_leaderboard.jpg` | JPEG progresivo q86 | 1024x1024 | 185046 B | `30f7929a81e8c62ef5e5b7dd711362a24ec169af3a8d36a6df7ef258367b3a69` |
| raids + world-bosses | `backgrounds/bg_bosses.jpg` | JPEG progresivo q86 | 1024x1024 | 124611 B | `48abf9123c3777480125438a8a07c93bcdd1fe416ee4c0ba8455828a55319aea` |

Procedencia: generación dirigida para VEXFORGE a partir del brief canónico
registrado en `PENDING_SOURCE_BACKGROUNDS` (VE-3), no es arte de stock ni
material de terceros. Licencia: uso propio del proyecto VEXFORGE. Versión: v1.
No sustituyen ningún asset previo: las tres rutas no existían en el bucket.

## Prompts

- `bg_achievements.jpg`: "Dark fantasy painterly game background, VEXFORGE forge
  aesthetic: a colossal hall of achievements inside a volcanic forge fortress —
  towering walls of engraved bronze and iron commemorative plaques, ornate gothic
  arches, hanging chains, cold shafts of pale cyan light falling from a high
  oculus, molten orange lava channels glowing along the floor, drifting embers,
  deep navy blue shadows, no characters, no text, no letters, cinematic, highly
  detailed digital painting".
- `bg_leaderboard.jpg`: "Dark fantasy painterly game background, VEXFORGE forge
  aesthetic: the empty tiered stands of a colossal season arena at night — curved
  stone galleries with ornate ironwork, tall hanging rank banners in deep crimson
  and gold, braziers and molten lava veins casting orange glow, dark navy stormy
  sky, floating embers, no characters, no text, no letters, cinematic, highly
  detailed digital painting".
- `bg_bosses.jpg`: "Dark fantasy painterly game background, VEXFORGE forge
  aesthetic: the threshold of a raid — a colossal jagged rift torn across a ruined
  war zone sky, blackened fortress ruins and broken siege chains in the foreground,
  molten orange fissures splitting the scorched ground, storm of embers and ash,
  deep navy and ember-orange palette, ominous scale, no characters, no text, no
  letters, cinematic, highly detailed digital painting".

Restricciones aplicadas como negative brief en cada prompt: sin texto ni letras,
sin personajes protagonistas, sin iconografía genérica y sin elementos ajenos al
lenguaje de VEXFORGE.

## Consumidores

- `src/lib/assetManifest.ts` (`VERIFIED_ASSETS`, `SURFACE_BACKGROUND`).
- `src/routes/AchievementsRoute.tsx` → `surfaceBackground("achievements")`.
- `src/routes/SeasonRankingsRoute.tsx` → `surfaceBackground("leaderboard")`.
- `src/routes/RaidsRoute.tsx` → `surfaceBackground("raids")`.
- `src/routes/WorldBossesRoute.tsx` → `surfaceBackground("world-bosses")`.

## Reversión

Las rutas no tenían asset previo, por lo que la reversión consiste en devolver
la entrada de la superficie a `null` en `SURFACE_BACKGROUND`, reponer su registro
en `PENDING_SOURCE_BACKGROUNDS` y retirar la ruta de `VERIFIED_ASSETS`. Los
objetos de Storage pueden conservarse sin afectar a la UI.

## Deuda restante

- `vexforge_official_asset_manifest` sigue registrando sólo ZIPs y no archivos
  individuales; estos tres fondos no quedan inscritos allí (unidad de datos
  futura).
- Sin variantes responsive dedicadas: se sirve el mismo JPEG 1024x1024 en móvil,
  con el mismo tratamiento de capa que el resto de fondos existentes.
