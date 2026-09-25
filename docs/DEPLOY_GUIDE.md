# VEXFORGE — Guía de flujo oficial

> Esta guía sustituye cualquier guía histórica de deploy manual. El código fuente canónico es GitHub y Cloudflare despliega automáticamente desde allí.

## Arquitectura oficial

| Capa | Fuente oficial | Responsabilidad |
|---|---|---|
| Código fuente | GitHub grandmaster68081-byte/Vexforge-web, rama main | Todo el frontend y el código del proyecto |
| Frontend publicado | Cloudflare Pages, https://vexforge-web.pages.dev | Sirve automáticamente el código de GitHub main |
| Backend, base de datos y Storage | Supabase rscuzqnfccqvltkdcdny | PostgreSQL, RLS, RPCs, Auth, Storage y contratos autoritativos |

## Cómo se refleja un cambio

1. Leer y reconciliar GitHub main, Supabase y el deploy público.
2. Actualizar directamente el código fuente oficial en GitHub.
3. Crear un commit descriptivo y hacer push a main.
4. Dejar que Cloudflare Pages despliegue automáticamente.
5. Ejecutar `npm run verify:build` antes del push y, tras la propagación,
   comprobar el estado de Cloudflare Pages para el SHA exacto de `main`, además
   de `index.html` y los hashes de los recursos públicos.
6. Registrar estado, evidencia, deuda y siguiente acción en CONTINUITY.md y Supabase.

### Reglas que evitan despliegues desfasados

- No incluir `[CI Skip]`, `[Skip CI]`, `[CI-Skip]`, `[Skip-CI]` ni
  `[CF-Pages-Skip]` en el prefijo del mensaje de un commit web que deba publicarse.
  Cloudflare Pages interpreta esas marcas como una orden para omitir el despliegue.
- Mantener todos los `resolved` de `package-lock.json` en el registro público
  `https://registry.npmjs.org/`. Las URLs internas de Replit no son accesibles
  desde GitHub Actions ni desde el builder de Cloudflare.
- Un commit presente en `main` no demuestra que esté publicado. Confirmar el
  check/deploy de Pages asociado a ese mismo SHA y comparar el `index.html` y
  los recursos con fingerprint que sirve el dominio público.

## Lo que no se hace

- No se trabaja en una implementación local, réplica, mockup, preview o checkout paralelo.
- No se usa Replit como fuente de verdad del producto.
- No se edita Cloudflare ni se usa Wrangler para publicar.
- No se hace deploy manual desde una máquina o entorno alternativo.

Si la URL pública aún sirve un bundle anterior, se corrige la discrepancia en la
fuente/build de GitHub durante la misma sesión: se verifica la raíz del repositorio,
se regenera `dist/` y se vuelve a comprobar el manifiesto público. No se cierra con
`PENDING_SOURCE` ni se publica por un canal distinto.
