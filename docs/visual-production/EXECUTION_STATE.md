# VEXFORGE — estado de producción visual

## Estado actual

- HEAD de implementación: `0011b6d9eb29d5c49e2526575948d4acd1c8dc39` (`main`, publicado en GitHub).
- Bloque actual: **1 — arreglo crítico de inicialización**, código implementado; validación de Unity bloqueada.
- El commit de este estado es sólo seguimiento; no cambia el HEAD de implementación indicado arriba.

## Fingerprint de una pasada

- HEAD antes del Bloque 1: `ed30df473ba9474902059ea79dac0ad594ed7f00`; rama `main`; árbol limpio y coincidente con `origin/main`.
- Unity declarado: `6000.3.0f1`; URP `17.3.0`; Input System `1.20.0`; UGUI `2.0.0`.
- Escena habilitada en Build Settings: `Assets/Scenes/VexforgeBootstrap.unity`.
- Supabase Management API confirmó el proyecto activo. Este bloque no modificó datos, esquema, RPC ni configuración de Supabase.
- En el código vivo, el Bootstrap buscaba `GameShellController` durante hasta 600 frames y las validaciones comparaban componentes persistentes con la escena activa. El acceso al resolver ya era directo; no se encontró reflexión de campo privado en el Bootstrap.

## Bloque 1

- **Implementado:** Bootstrap único como componente de `VexforgeApp`; inicialización después de la inicialización de la app; enlace explícito desde `GameShellController` después de inicializar el director y el escenario.
- **Implementado:** validación contra la escena propietaria persistente, reintento directo mediante el `GameShellController` dueño y respuesta de error de 15 segundos sin búsqueda periódica.
- **Implementado:** registro de fases para App, GameShell, director, escenario, Bootstrap y Battle Gate; el Gate escucha cambios de readiness y no deja una pantalla de espera después de un reintento exitoso.
- **Prueba ejecutada:** `node unity/verify-battle-presentation-lifecycle.mjs` — `PASS` para las conexiones y transiciones estáticas de fuente.
- **Comprobación ejecutada:** `git diff --check` — `PASS`; no hay búsqueda por `FindObjectsByType`, coroutine de enlace ni `Update` de polling en el Bootstrap.
- **Commit de código:** `0011b6d9eb29d5c49e2526575948d4acd1c8dc39`, `fix(unity): bind canonical battle presentation from app owner`.
- **No ejecutado:** compilación C# de Unity, Play Mode, prueba runtime del Battle Gate y captura Game View. No se encontró Unity Editor/Hub ni compilador C# en el entorno.
- **No ejecutado:** build Android; requiere autorización nueva según las instrucciones vigentes del proyecto.

## Assets y escenas

- Assets visuales nuevos integrados: ninguno.
- Escenas de producción completadas: ninguna.
- El manifiesto aún no está validado contra todos los archivos importados; el valor `known_count: 127` no se considera verificado contra el catálogo vivo.
- No se generaron ni integraron modelos GLB: no hay Blender ni Unity Editor para conversión/importación y prueba. No se declara ningún recurso como `production`.

## Gates

| Gate | Estado | Evidencia / motivo |
|---|---|---|
| Sincronización GitHub `main` | PASS | Push confirmado; `origin/main` coincidía con el commit de código. |
| Prueba estática del ciclo canónico | PASS | `unity/verify-battle-presentation-lifecycle.mjs`. |
| Diff limpio | PASS | `git diff --check`. |
| Compilación del Editor Unity | NOT_RUN | Unity Editor no está instalado en este entorno. |
| Prueba Play Mode `not initialized → initialized → bound → battle gate discover` | BLOCKED | Requiere Unity Editor `6000.3.0f1`; no se sustituye por la prueba estática. |
| Importación, escenas y captura Android portrait | NOT_RUN | Requiere Editor y runtime Android. |
| Bloques 2–8 | NOT_RUN | El Bloque 1 aún necesita validación en Unity; los siguientes requieren importación y comprobación real de assets/escenas. |

## Bloqueador real y siguiente acción exacta

Abrir este `unity/` en un entorno con Unity Editor licenciado `6000.3.0f1`, compilar los scripts y ejecutar Play Mode. Confirmar en logs el recorrido `VexforgeApp → Bootstrap Initializing → GameShellController → director/escenario inicializados → Bootstrap Ready → Battle Gate descubre`; comprobar también el timeout de error y el reintento. Corregir cualquier fallo y actualizar este único estado antes de iniciar el Bloque 2. No iniciar un build Android antes de la autorización requerida.
