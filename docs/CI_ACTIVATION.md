# Activar CI (`verify`) — VEXFORGE

Estado actual: **BLOCKED por scope del token**, no por el codigo.
El workflow ya esta escrito y probado en local; solo falta colocarlo bajo
`.github/workflows/`.

## Por que esta bloqueado

GitHub protege la ruta `.github/workflows/`. Un token sin el scope
`workflow` recibe `404 Not Found` al intentar crear o actualizar cualquier
archivo ahi (comprobado el 2026-08-21 con el token de automatizacion:
`PUT /repos/.../contents/.github/workflows/verify.yml` -> `404`).

## Opcion A (30 segundos, sin tocar tokens) — recomendada

1. Abrir el repo en GitHub: `grandmaster68081-byte/Vexforge-web`.
2. `Add file` -> `Create new file`.
3. Nombre exacto del archivo: `.github/workflows/verify.yml`.
4. Pegar el contenido de `ci/verify.workflow.yml` de este repo, sin el bloque
   de comentarios inicial si se prefiere.
5. `Commit directly to the main branch`.
6. Comprobar en la pestana `Actions` que la ejecucion `verify` arranca y
   termina en verde.

Un commit hecho desde la web de GitHub usa la identidad de la sesion del
usuario, asi que el limite del scope `workflow` no aplica.

## Opcion B (desbloquear la automatizacion)

1. GitHub -> `Settings` -> `Developer settings` -> `Personal access tokens`.
2. Token clasico: crear uno nuevo con `repo` **y** `workflow`.
   Token fine-grained: permisos del repo con `Contents: Read and write` **y**
   `Workflows: Read and write`.
3. Guardar el token nuevo como secreto `GITHUB_PAT` en el entorno de trabajo
   (reemplaza el actual; nunca pegarlo en el chat ni en el repo).
4. A partir de ahi la automatizacion puede escribir `.github/workflows/*` y
   mantener el CI sola.

## Que valida el CI

`npm ci --ignore-scripts`, `tsc --noEmit` y `npm run verify:all`
(typecheck, build, ui-identity, identity-data, artes, manifest, assets,
auth-guard, table-docs, column-docs, support-column-docs).

Solo necesita valores publicos (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`), ya incluidos como respaldo en el workflow; se
pueden sobreescribir con *Repository variables* del mismo nombre.
**Nunca** anadir `service_role` ni el PAT de Management a este workflow.
