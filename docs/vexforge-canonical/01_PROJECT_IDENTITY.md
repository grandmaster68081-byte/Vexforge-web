# 01 — PROJECT IDENTITY

| Campo | Evidencia |
|---|---|
| Nombre | VEXFORGE |
| Producto activo | Juego digital TCG para Android |
| Cliente | `mobile/**` |
| Web | `src/**`, congelada/no activa como cliente |
| Repositorio | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Commit auditado | `f43159ecee63b610bb71c295238327ecea3feeb6` |
| Plataforma | Android; Expo SDK 54 / React Native 0.81.5 |
| Android package | `com.vexforge.android` |
| App version / versionCode | `1.0.1` / `4` |
| Backend | Supabase project reference `rscuzqnfccqvltkdcdny` |
| Build | GitHub Actions `vexforge-android-apk.yml` |
| Storage | Supabase Storage para superficies live; assets locales en `mobile/assets/` |
| Estado | IMPLEMENTED_UNVERIFIED en varias superficies; evidencia física pendiente |

El ownership de la regla backend no reside en el cliente: Android presenta, captura input y consume contratos; Supabase conserva la autoridad live.
