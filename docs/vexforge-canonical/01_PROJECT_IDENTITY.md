# 01 — PROJECT IDENTITY

| Campo | Evidencia |
|---|---|
| Nombre | VEXFORGE |
| Producto activo | Juego digital TCG para Android |
| Cliente | `unity/**` |
| Web | `src/**`, congelada/no activa como cliente |
| Repositorio | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Baseline de migración auditado | `10dddb68262f5a0301e177ac764784ab4cec11b7` |
| Plataforma | Android; Unity 6.3 LTS (`6000.3.0f1`) |
| Android package | `com.vexforge.android` |
| App version / versionCode | `1.0.1` / `4` |
| Backend | Supabase project reference `rscuzqnfccqvltkdcdny` |
| Build workflow | GitHub Actions manual en `.github/workflows/vexforge-unity-android-github.yml`; restaurado, no ejecutado |
| Storage | Supabase Storage para superficies live; assets de cliente bajo `unity/Assets/` |
| Estado | IMPLEMENTED_UNVERIFIED en varias superficies; evidencia física pendiente |

El ownership de la regla backend no reside en el cliente: Android presenta, captura input y consume contratos; Supabase conserva la autoridad live.

## Runtime decision

- Current runtime: Unity Android in `unity/**`.
- Active runtime: Unity Android in `unity/**`.
- Migration status: Unity Presentation Foundation implemented but Editor,
  Android device and workflow-run evidence remain pending.
