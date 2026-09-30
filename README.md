# VEXFORGE — repositorio principal

## Autoridad actual

El runtime canónico del videojuego es **Expo / React Native en `mobile/**`**.
Usa estos documentos como autoridad operativa:

1. `mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md`
2. `mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`
3. `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`
4. `mobile/docs/SESSION_CHECKPOINT.md`

El estado de Expo es el del código y la evidencia registrados allí; no implica
que exista una build Android, APK/AAB o QA física verificada.

## Clasificación de los árboles

- `mobile/**` — runtime activo de VEXFORGE.
- `unity/**` — runtime Unity legado, conservado como referencia/rollback; no es
  destino de trabajo nuevo.
- `src/**` y `public/**` — portal web VEXFORGE histórico, fuera del runtime del
  juego.
- `faucet/**` — producto Kivora independiente, fuera del alcance de VEXFORGE.
  Mantén su código, assets y migraciones separados; no los ejecutes como parte
  de Expo ni los borres como parte de esta reorganización.
- `supabase/migrations/*kivora*` — historial de migraciones Kivora; no aplicarlo
  como migraciones VEXFORGE.

No se encontró contenido importado de Epic/Fab ni identificadores de listings.
La adquisición de Fab no forma parte de la ruta actual. La rareza de carta
`epic` es terminología del juego y no contenido de Epic Games/Fab.

## Ejecutar y verificar Expo

Desde `mobile/`:

- `npm install`
- `npm run dev`
- `npm run verify`
- `npm run typecheck`
- `npm run doctor`

No iniciar EAS, APK/AAB, despliegues ni builds de producción sin autorización
explícita del gate correspondiente.
