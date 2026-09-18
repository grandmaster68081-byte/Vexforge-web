# 01 — PROJECT IDENTITY

| Campo | Evidencia |
|---|---|
| Nombre | VEXFORGE |
| Producto activo | Juego digital TCG para Android |
| Cliente | `unity/**` |
| Web | `src/**`, congelada/no activa como cliente |
| Repositorio | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Commit auditado | `201ee0330529c8e085afd1143cf066e18de3bc8a` |
| Plataforma | Android; Unity 6.3 LTS (`6000.3.0f1`) |
| Android package | `com.vexforge.android` |
| App version / versionCode | `1.0.1` / `4` |
| Backend | Supabase project reference `rscuzqnfccqvltkdcdny` |
| Build | GitHub Actions `vexforge-android-apk.yml` |
| Storage | Supabase Storage para superficies live; assets locales en `mobile/assets/` |
| Estado | IMPLEMENTED_UNVERIFIED en varias superficies; evidencia física pendiente |

El ownership de la regla backend no reside en el cliente: Android presenta, captura input y consume contratos; Supabase conserva la autoridad live.

## Runtime decision

- Current runtime: Unity Android in `unity/**`.
- Active runtime: Unity Android in `unity/**`.
- Legacy: Expo / React Native in `mobile/**`, preserved as historical reference
  and rollback material only.
- Migration status: Unity Presentation Foundation implemented but Editor,
  Android build and device evidence remain pending.
