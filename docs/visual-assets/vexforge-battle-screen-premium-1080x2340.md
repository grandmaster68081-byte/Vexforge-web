# VEXFORGE — Battlefield premium visual reference

- **Estado:** `CANON_ACTIVE / IMPLEMENTED_UNVERIFIED`
- **Dominio:** Arena / Battlefield
- **Ruta objetivo:** `/(tabs)/battle`
- **Rol semántico:** arte aprobado de escena dentro del viewport nativo de Battlefield
- **Dimensiones:** `1080 × 2340 px`
- **Formato:** PNG
- **SHA-256:** `784c01ad38ebbfccc101713bfb11d07b8bf5fd58cc238d34f1fe2a9a0753a1f1`
- **Fuente de identidad:** `mobile/assets/images/home-reference-scene.png` como Home master reference
- **Perfil del protocolo:** `cyan vs ember`; formaciones, Champion, mano, Reserve, target legal, evento y resultado
- **Archivo:** `docs/visual-assets/vexforge-battle-screen-premium-1080x2340.png`

## Alcance autorizado

La pieza conserva la citadel dimensional, obsidiana, metal, oro/ámbar, cyan, violeta arcano y profundidad por capas de VEXFORGE. Su composición deja superficies oscuras para recibir datos reales de Battle Run / ForgeFormation, arte de cartas inscrito y controles nativos.

No contiene nombres, estadísticas, cartas, HP, daño, resultados, recompensas, botones ni estados inventados. No es una fuente de reglas ni un motor paralelo.

## Implementación Android

La referencia está activa como `CANONICAL_BACKGROUNDS.pvp` dentro de
`ForgeBattlefield`. El runtime no monta la imagen como captura: añade sobre el
arte una escena nativa con formaciones reales, Champion, Vanguard, Sentinel,
Reserve, HUD de turno, señales honestas de Hand/Command, carril de evento,
lectura de daño y resultado. La capa visual usa movimiento ambiental reducido,
iluminación cyan/ember y viñeta; no crea gameplay, cartas, datos ni acciones
fuera de los contratos vivos.

## Gate de activación

La activación del consumidor Android queda registrada en `main`, pero no se
declara `VERIFIED`, `TIER1_READY` u `OPERATIONAL`. El cierre requiere APK
autorizada, evidencia física de touch/safe area/legibilidad/rendimiento y
actualización de la matriz de aceptación. El asset no se sube a Storage porque
la política activa conserva Storage sólo para `cards/*`.
