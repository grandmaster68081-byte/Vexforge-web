# VE-MOB-7 — FORMACIÓN FINAL EN EL RESULTADO DE ARENA

## Alcance

El resultado Android de una resolución PvP oficial conserva ahora la formación
final que devuelve Supabase y la presenta como evidencia del combate. El cambio
mantiene el resultado dentro del lenguaje de Arena en lugar de cerrar el flujo
con un panel genérico de victoria o derrota.

## Fuente de verdad

- `BattleResult.final_units` recibido desde la resolución oficial.
- `BattleResult.turns` para identificar el último evento del replay.
- `ForgeBattlefield` para representar Vanguardia, Campeón, Centinela, Reserva,
  arte canónico disponible, HP y estado final.

No se crean unidades, nombres, estadísticas, cartas, MMR ni recompensas en el
cliente. La formación sólo se muestra cuando la respuesta oficial trae unidades
finales verificables. La práctica `client_ai_v1` conserva su etiqueta de
entrenamiento y no afirma una formación oficial.

## Cambio visual y funcional

- El resultado oficial expone `FORMACIÓN FINAL VERIFICADA`.
- La formación usa el mismo campo de batalla de la lectura de turnos.
- El último turno recibido se conserva como contexto del estado final.
- `reduceMotion` se respeta también en la formación del resultado.
- El botón `VOLVER A LA ARENA` y el flujo de cierre permanecen sin cambios.

## Límites

- No se modifica el motor de combate.
- No se simula PvP en Android.
- No se modifican Supabase, RPCs, RLS, economía, Auth ni contratos.
- No se inicia workflow Android, no se compila APK y no se genera release en
  este bloque, por instrucción del operador.

## Verificación local

- `verify:mobile-battle` debe cubrir la presencia de la formación final
  autoritativa.
- `typecheck` móvil queda pendiente de ejecutarse si las dependencias locales
  no están disponibles en el clon.
- El bloque permanece `IMPLEMENTED_UNVERIFIED` hasta la QA visual/táctil en una
  APK instalada y el release correspondiente.