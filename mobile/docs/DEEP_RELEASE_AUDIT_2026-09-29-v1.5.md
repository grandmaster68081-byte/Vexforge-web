# VEXFORGE 1.5.0 · DEEP RELEASE AUDIT

## Objetivo

Esta entrega es el runtime Expo oficial del videojuego móvil. El paquete está preparado como artefacto de implementación: las escenas, tiers, FX, audio, componentes y contratos de presentación que pertenecen al cliente están dentro del ZIP. El ensamblador no debe inventar contenido.

## Fuente externa revisada

El repositorio público de VEXFORGE se revisó el 2026-09-29. Su `CURRENT_SOURCE_OF_TRUTH.md` define V5.6 como autoridad visual, reserva Supabase Storage para artwork oficial de cartas y exige composición scene-first, profundidad cálida/fría y movimiento físico/restringido. La rama pública `mobile/package.json` sigue declarando Expo 54 pero versión 1.0.0; esta entrega 1.5.0 es la reconstrucción móvil que sustituye esa superficie.

## Correcciones de esta pasada

### Combate

El campo, actor actual, targets, eventos, FX y autoplay derivan de la misma `TacticalSession` en la Arena interactiva. PvP presenta el replay server-side como una secuencia sellada.

El motor determinista mantiene HP acotada, energía acotada, actor vivo, IDs únicos y replay reproducible. Boss phases se disparan una sola vez por umbral. `mend` y `ward` usan aliados vivos; `rally` y `summon` usan el actor; `summon` revive una unidad derrotada con HP acotada o sobrecarga al actor cuando no hay una caída.

Además se corrigió una inferencia TypeScript real en la fábrica de unidades del laboratorio: el retorno ahora declara `LabUnit[]`, evitando que `statuses` se reduzca a `{}` durante el chequeo semántico.

### Presentación

BattlefieldCanvas ya no decodifica una segunda copia full-screen del arena art detrás de la escena de mundo. Los tokens de combate muestran rol, facción, rareza, HP, escudo, energía y stacks de estado. Bosses llevan aura visual. BattleEffects recibe origen/destino y clasifica estados como burn/poison.

Las cinemáticas y el pack-opening consumen el tier de calidad actual, evitando fijar siempre la placa de mayor resolución. El calendario/temporada usa una placa `events` específica; no inventa datos de Live Ops.

### Arte oficial embebido

El release incluye 13 scene masters locales:
`nexus`, `arena`, `archive`, `forge`, `founders`, `missions`, `store`, `economy`, `world`, `social`, `meta`, `tutorial`, `events`.

Cada master tiene derivaciones `high`, `medium`, `low`: 39 derivados. Hay además 9 PNG runtime de soporte, 6 WAV runtime, 48 assets registrados y 7 assets canonical. El inventario de QA registra hashes SHA-256, dimensiones y bytes.

### Tutorial

El tutorial conserva 19 pasos y ahora conecta explícitamente Nexus, cuenta, cartas, formación, iniciativa, habilidades, PVE, bosses/raids, energía, economía, marketplace, tesorería, tienda/packs, fusión/evolución, social, ranked, lore, Live Ops y dominio. Los pasos de combate usan el mismo lenguaje de acciones del laboratorio y están aislados del settlement.

## Economía y ownership

El cliente conserva la autoridad del servidor para ownership, pack odds, marketplace y wallet settlement. Las auditorías locales verifican invariantes/formulas sin convertir al cliente en autoridad de liquidación. La tasa de fee probada por la auditoría local es 8%.

No se inventó un RPC de liquidación de bosses porque el contrato móvil suministrado no expone uno. La entrega marca ese punto como gate de backend, no como funcionalidad falsamente finalizada.

## Verificación ejecutada en el contenedor disponible

- `node scripts/verify.mjs`: PASS; 20 archivos requeridos, 31 fuentes TS/TSX en el alcance estático y 67 assets críticos verificados.
- `node --experimental-strip-types scripts/audit-battle.ts`: PASS; 2.500 runs, 0 fallos.
- `node --experimental-strip-types scripts/audit-interactive.ts`: PASS; 500 runs, 0 fallos.
- `node --experimental-strip-types scripts/audit-economy.ts`: PASS; 10.000 runs, 0 fallos.
- `node --experimental-strip-types scripts/audit-economy-policy.ts`: PASS.
- Chequeo semántico aislado del motor táctico: PASS con strict + `allowImportingTsExtensions`.
- Escaneo de secretos históricos/runtime: PASS.
- Resolución de imports locales: PASS.

## Gates que no se deben marcar como PASS desde este entorno

No hay `node_modules` instalados en la copia de auditoría y el contenedor no tiene acceso al registry para reconstruir el árbol completo; por eso el `tsc` completo del proyecto no se pudo verificar aquí. Tampoco hay toolchain Android/EAS disponible para producir una APK/AAB nativa. No se ejecutaron mutaciones contra Supabase de producción.

Eso no se oculta en el paquete: queda documentado en `OFFICIAL_ASSET_QA_1.5.0.json` y en `BUILD_MANIFEST.json`.

## Regla de ensamblaje

Replit debe copiar el contenido de `mobile/` tal cual, instalar las dependencias en el entorno objetivo, proporcionar `EXPO_PUBLIC_SUPABASE_ANON_KEY`, ejecutar las verificaciones y utilizar la configuración Expo/EAS existente. No debe regenerar arte, reinterpretar pantallas, inventar RPCs, alterar fórmulas, mover settlement al cliente ni crear un segundo estado de combate.
