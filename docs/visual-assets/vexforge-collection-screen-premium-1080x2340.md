# VEXFORGE — Collection / Archivo premium visual reference

- **Estado:** `IMPLEMENTED_UNVERIFIED / NO APK / NO RELEASE`
- **Dominio:** Collection / Archivo
- **Ruta objetivo:** `/(tabs)/collection`
- **Rol semántico:** referencia visual de escena para la futura superficie de Cartas
- **Dimensiones:** `1080 × 2340 px`
- **Formato:** PNG
- **SHA-256:** `232280411aa29614e58d324ae98799ec118317ed87a4303fc088e890cb268edd`
- **Fuente de identidad:** referencia entregada por el operador, registrada byte a byte en `mobile/assets/images/collection-reference-scene.png`
- **Perfil del protocolo:** violeta + plata; unidades, cartas, artefactos, rareza, facción, lore, procedencia y mastery
- **Archivo runtime:** `mobile/assets/images/collection-reference-scene.png`

## Alcance autorizado

La pieza conserva la citadel dimensional, obsidiana, metal, plata, oro controlado, violeta arcano y profundidad por capas de VEXFORGE. Su composición deja marcos y superficies vacías para recibir arte de cartas y datos vivos de Collection / Archivo.

No contiene nombres, estadísticas, totales de colección, rarezas, facciones, lore, mastery, filtros ni estados inventados. No es una fuente de datos ni sustituye el arte real entregado por `cards.image_url`.

## Gate de activación

La referencia se consume únicamente como arte de escena dentro de `ForgeArchiveScene`; no se monta como captura. El runtime reconstruye nativamente el portal, núcleo, iluminación, parallax limitado, encabezado, búsqueda, filtros, orden, cartas, estados, detalle y acciones. `collection.tsx` conserva los flujos reales de catálogo, ownership, refresh, fusión, logros y navegación.

La unidad queda `IMPLEMENTED_UNVERIFIED`: no se declara `VERIFIED`, `TIER1_READY` u `OPERATIONAL` porque la medición física en Android requiere una APK autorizada. No se compiló APK ni se publicó release.
