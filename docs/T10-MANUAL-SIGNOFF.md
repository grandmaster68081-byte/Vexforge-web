# T10 — Manual de sign-off autenticado

## Estado

**READY FOR MANUAL SIGN-OFF** — el checkpoint de Battle Run está en GitHub
`main` y preparado para propagarse al frontend oficial y cerrar T10. La única
evidencia que el agente no puede producir es una sesión normal autenticada de
`pavilo20`; no se deben
inventar credenciales ni usar `service_role` para simularla.

El sign-off público sólo se puede marcar después de que todos los casos de la
matriz pasen.

## Preparación

1. Abre `https://vexforge-web.pages.dev` en una ventana normal, no incógnito.
2. Inicia sesión desde **Mi cuenta** con la cuenta QA autorizada.
3. Abre DevTools → **Network** y filtra por:
   - `start_battle_run`
   - `resolve_battle_run`
   - `abandon_battle_run`
   - `vexforge_attack_world_boss`
   - `vexforge_contribute_raid`
4. Para cada caso, anota la hora, la ruta (`/world-bosses` o `/raids`), el
   `battle_run_id` visible en la respuesta y el resultado observado.
5. Si se consulta Supabase, hacerlo con el SQL Editor autorizado. Nunca copiar
   tokens, cookies, contraseñas, correos ni claves al chat.

## Matriz

### 1. Doble clic — World Boss

1. Entra en **Jefes Mundiales**, elige un jefe activo y pulsa **Atacar**.
2. Selecciona una formación válida.
3. Haz doble clic rápido en confirmar.
4. Esperado:
   - una sola llamada `start_battle_run`;
   - un solo `battle_run_id`;
   - una sola llamada `resolve_battle_run`;
   - si vence, una sola llamada `vexforge_attack_world_boss`;
   - ningún daño o recompensa duplicado.

### 2. Doble clic — Raid

Repite el mismo caso en **Raids**. Espera una sola llamada a
`start_battle_run`, una sola resolución y, si vence, una sola llamada a
`vexforge_contribute_raid`.

### 3. Abandono explícito

1. Inicia un World Boss o Raid hasta que aparezca el tablero.
2. Pulsa **✕ Salir**.
3. Esperado:
   - una llamada `abandon_battle_run`;
   - el run termina en `abandoned`;
   - no se registra daño, contribución, recompensa ni settlement;
   - pulsar Salir repetidamente no crea otra acción terminal.

### 4. Refresh

1. Inicia un combate hasta que aparezca el tablero.
2. Recarga la página antes de terminarlo.
3. Vuelve a la ruta autenticado.
4. Esperado:
   - el run pendiente se cierra como `abandoned`;
   - aparece el aviso de combate recuperado o no queda ningún run en
     `started`;
   - no se registra resolución, daño ni recompensa.

### 5. Timeout de red

1. Abre un combate y, justo antes de confirmar la formación, cambia DevTools
   Network a **Offline**.
2. Espera al menos 16 segundos y vuelve a **Online**.
3. Recarga la ruta.
4. Esperado:
   - el cliente muestra un error de timeout, no un falso éxito;
   - si el servidor llegó a crear el run antes de perderse la respuesta, la
     respuesta tardía lo cierra mediante `abandon_battle_run`;
   - no queda ningún run propio en `started`.

### 6. Reconexión durante el tablero

1. Inicia un combate hasta que el tablero esté visible.
2. Cambia la red a **Offline** durante unos segundos y vuelve a **Online**,
   sin recargar la pestaña.
3. Termina el combate una sola vez.
4. Esperado:
   - el run activo de esa pestaña no se abandona prematuramente;
   - se ejecuta una sola resolución;
   - el settlement posterior ocurre como máximo una vez.

## Criterio de aprobación

T10 queda aprobado manualmente si los seis casos pasan tanto para World Boss
como para Raid cuando corresponda, no existe ningún run propio en `started`,
no hay doble settlement y los runs terminados sólo aparecen como
`completed`, `defeated` o `abandoned`.

Si un caso falla, conserva la respuesta de Network y la hora, no repitas
acciones sobre el mismo run y deja T10 en revisión.