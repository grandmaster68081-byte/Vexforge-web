# VE-MOB-4 — COLECCIÓN E INSPECTOR DE CARTAS

## Alcance

Portar a la aplicación Android la superficie de colección de cartas de VEXFORGE:

- catálogo activo completo desde `public.cards`;
- colección del jugador desde `public.player_cards` con relación al catálogo;
- búsqueda por nombre o código, filtros por rareza y facción, y orden por rareza, nombre o poder;
- inspector de carta con arte canónico, identidad, estadísticas, habilidades, sistemas, lore y supply;
- estados de carga, error, catálogo vacío y filtros sin coincidencias;
- compatibilidad con lector de pantalla, objetivos táctiles y reduced motion sin animaciones obligatorias.

## Fuentes canónicas

- Código de `main` y `src/routes/CardsRoute.tsx`.
- Repositorio `src/domains/cards/repository.ts` y `src/domains/inventory/repository.ts`.
- Supabase vivo: `cards`, `player_cards`, `players` y Storage público del manifiesto.
- `VEXFORGE_PROTOCOL_V2.md`, sección 0, regla Cero Genéricos y criterios transversales de `VE-MOB-0`.

## Criterios de aceptación

1. La pantalla consulta el catálogo activo real, no una lista local ni datos de demostración.
2. Con sesión normal, la pantalla consulta la colección del jugador mediante RLS y muestra cantidades, estado bloqueado/listado y porcentaje de colección.
3. Una carta puede abrirse desde la lista y mostrar detalle sin abandonar la pestaña.
4. El arte usa `image_url` del catálogo canónico; si no existe, el estado de fallback conserva lenguaje VEXFORGE mediante iconografía de la interfaz, sin emoji ni arte de stock.
5. Los filtros, la búsqueda, el orden y el cierre del inspector funcionan con interacción táctil.
6. Las rutas de carga, error, catálogo vacío y cero resultados no dejan un loader eterno.
7. No se modifica lógica autoritativa de combate, economía, recompensas, RLS ni RPCs.
8. La unidad se entrega con `mobile` typecheck/guardas cuando las dependencias están disponibles, guardas web sin regresión, workflow APK oficial exitoso y release correlativo publicado.

## Implementación

- `mobile/lib/supabase.ts`: tipos de carta/posesión, catálogo completo y lectura autenticada de `player_cards`.
- `mobile/context/GameContext.tsx`: estado compartido de catálogo, colección, sincronización y error.
- `mobile/app/(tabs)/collection.tsx`: superficie Android completa e inspector.
- `mobile/constants/colors.ts`: tokens semánticos de rarezas para mantener la identidad entre superficies.

## Estado y evidencia

- Estado inicial: `NOT_STARTED` según el inventario de port.
- Estado de implementación: `IMPLEMENTED_UNVERIFIED` hasta recibir recorrido funcional del operador sobre el APK.
- Nivel Q: Q2 actual / Q3 objetivo.
- Supabase: campos usados verificados en el catálogo vivo; la lectura pública de `cards` responde HTTP 200.
- Guardas locales: `verify:mobile-auth` 8/8; parseo TypeScript de los cuatro archivos modificados correcto; `git diff --check` correcto.
- Limitación local: `npm ci` móvil fue rechazado por el espejo del entorno para `npm-package-arg@11.0.3`; el typecheck completo queda delegado al workflow oficial.
- Deuda: QA funcional en dispositivo/emulador con sesión normal; completar evidencia del workflow y release después del push.

## Condición de reapertura

Reabrir si el contrato de `cards`/`player_cards` cambia, el catálogo deja de ser legible bajo RLS, una carta no abre el inspector, aparece arte genérico, hay regresión de accesibilidad/reduced motion, falla el workflow APK o el operador reporta un hallazgo sobre el release.

## Siguiente acción verificable

Confirmar el workflow `vexforge-android-apk.yml` sobre el commit de cierre, comprobar `app-release.apk` con bundle JS embebido y firma v2, entregar el enlace del release y solicitar al operador el recorrido de colección.