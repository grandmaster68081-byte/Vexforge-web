## 2026-08-21 — VE-DOC-5-SUPPORT-COLUMN-COMMENTS — OPERATIONAL

- Tipo de sesion: higiene documental de columnas de soporte interno. Solo metadatos: sin cambios de esquema, datos, RLS, grants, RPCs, economia autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente accion verificable declarada en VE-DOC-4 (extender la cobertura documental de columnas a las tablas de soporte interno `vexforge_*` con dependencia en funciones o vistas del catalogo vivo). CI sigue BLOCKED por `GITHUB_PAT` sin scope `workflow`.
- Estado previo medido en vivo: 24 tablas `vexforge_*` con dependencia en funciones o vistas; 17 de ellas con 181 columnas sin `col_description`.
- Cambios: `supabase/migrations/0027_ve_doc_5_support_column_comments.sql` (181 `comment on column` generados desde evidencia real del catalogo: tipo, clave primaria, referencia foranea, obligatoriedad y valor por defecto), `scripts/verify-support-column-docs.mjs` (nuevo, alcance declarado por el repositorio: toda tabla `vexforge_*` con `comment on column` en `supabase/migrations/`, leido contra la sonda `vexforge_column_doc_coverage` con el rol anon) y `package.json` (`verify:support-column-docs` encadenado en `verify:all`).
- Aplicacion: migracion aplicada contra `rscuzqnfccqvltkdcdny` via Management API. Reutiliza la sonda existente; no se creo ninguna funcion nueva.
- Evidencia: recuento en vivo => 24/24 tablas de soporte con 0 columnas sin describir. `npm run verify:all` verde de extremo a extremo, incluido `verify:support-column-docs — OK: 287/287 columnas documentadas en 28 tabla(s) de soporte interno`, `verify:column-docs — OK: 536/536` y `verify:table-docs — OK: 216/216`.
- Estado: NOT_STARTED -> OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada `BLOCKED` sin sesion normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; cron/logica temporal autoritativa en servidor; artes duplicados del bucket pendientes de autorizacion de listado; columnas de tablas de soporte sin dependencia detectada en funciones o vistas todavia sin describir.
- Condicion de reapertura: nueva columna en las tablas `vexforge_*` de alcance sin `comment on column`, o revocacion del `execute` de la sonda a `anon`.
- Siguiente accion verificable: completar la cobertura documental de las columnas publicas restantes fuera de alcance (tablas de soporte sin consumidor ni dependencia detectada) y volver a medir `1900` columnas del catalogo publico.

---

