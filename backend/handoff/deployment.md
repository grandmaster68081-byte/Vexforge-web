# VEXFORGE — Cadena oficial de código y despliegue

## Fuentes de verdad

- GitHub es el único código fuente oficial: repositorio grandmaster68081-byte/Vexforge-web, rama main.
- Cloudflare Pages es el frontend publicado: https://vexforge-web.pages.dev, vinculado al repositorio oficial y con despliegue automático desde main.
- Supabase es backend, base de datos y Storage: proyecto rscuzqnfccqvltkdcdny, incluyendo PostgreSQL, RLS, RPCs, Auth, Storage y contratos autoritativos.

## Flujo obligatorio

1. Inspeccionar GitHub main, las fuentes vivas de Supabase y la URL pública.
2. Modificar el código fuente oficial directamente en GitHub.
3. Crear un commit descriptivo y hacer push a main.
4. Esperar el despliegue automático de Cloudflare Pages.
5. Revisar la URL pública y comprobar que refleja el commit de main.
6. Registrar evidencia, estado y deuda en CONTINUITY.md y en el documento activo de Supabase.

## Publicación automática obligatoria

- Al cerrar cada unidad completada, el commit en `main` debe activar la publicación automática vinculada de Cloudflare Pages.
- Esta publicación automática y su verificación pública no requieren autorización adicional: son parte obligatoria del flujo oficial.
- Si Cloudflare todavía no refleja `main`, registrar `PENDING_SOURCE` o `BLOCKED` por propagación automática y esperar/reintentar la comprobación; no crear un canal alternativo.

## Prohibiciones permanentes

- No editar código en Cloudflare.
- No ejecutar `wrangler pages deploy`, `npm run deploy` ni ninguna publicación manual o paralela.
- No usar el entorno local, Replit, mockups, previews, checkouts paralelos o réplicas como fuente de verdad del producto.
- No declarar una revisión local equivalente a la revisión de GitHub + Cloudflare + Supabase.

Las instrucciones históricas de publicación manual quedan SUPERSEDED por el Protocolo Maestro v2.5 y por esta guía.
