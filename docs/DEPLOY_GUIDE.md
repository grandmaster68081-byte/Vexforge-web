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
   comprobar `/build-manifest.json`, `index.html` y los hashes públicos contra el
   commit de main.
6. Registrar estado, evidencia, deuda y siguiente acción en CONTINUITY.md y Supabase.

## Lo que no se hace

- No se trabaja en una implementación local, réplica, mockup, preview o checkout paralelo.
- No se usa Replit como fuente de verdad del producto.
- No se edita Cloudflare ni se usa Wrangler para publicar.
- No se hace deploy manual desde una máquina o entorno alternativo.

Si la URL pública aún sirve un bundle anterior, se corrige la discrepancia en la
fuente/build de GitHub durante la misma sesión: se verifica la raíz del repositorio,
se regenera `dist/` y se vuelve a comprobar el manifiesto público. No se cierra con
`PENDING_SOURCE` ni se publica por un canal distinto.
