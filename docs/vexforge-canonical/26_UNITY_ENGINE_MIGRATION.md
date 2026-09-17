# 26 — UNITY ENGINE MIGRATION

## Decisión

El cliente final Android de VEXFORGE migrará a **Unity 6.3 LTS**, **URP** y **C#**. Android permanece como plataforma activa; Supabase permanece como backend autoritativo; la web permanece congelada.

## Estado actual versus objetivo

| Capa | Estado |
|---|---|
| Cliente Expo/React Native | Implementación Android actual; legado protegido durante migración |
| Proyecto Unity | No existe en el commit auditado |
| Unity Foundation | PLANNED / BLOCKED hasta paquete operativo |
| Supabase | Autoridad sin cambio |
| APK Unity | No existe |
| Cliente Unity activo | No alcanzado |

## Responsabilidades Unity

Presentación, UI, navegación, animación, VFX, audio, cámara, input, Timeline, renderizado de cartas, battlefield, feedback, caché no autoritativa y reproducción de snapshots/eventos del backend.

## Prohibiciones

No duplicar reglas backend en C#. No introducir otra base de datos o backend. No inventar datos, assets, estadísticas, rewards, estados o reglas. No eliminar `mobile/**`. No iniciar Etapa 2 antes de cerrar Foundation.

## Cinco etapas

1. Foundation / Unity Migration.
2. World / Nexus.
3. Cards / Archive / Deck.
4. Battle.
5. Missions / Economy / Profile / Polish.

Cada etapa necesita compilación, verificadores, APK, instalación, recorrido funcional, backend real cuando aplique, coherencia visual, ausencia de datos inventados, ausencia de errores críticos y evidencia. Replit no decide el avance; la siguiente etapa solo se autoriza después de revisión del resultado.

## Foundation mínimo

- Unity 6.3 LTS funcional.
- Proyecto Android reproducible.
- Identidad de build y applicationId canónico.
- Supabase real conectado.
- Auth y refresh de sesión.
- GameShell Unity.
- Datos reales mínimos.
- CI reproducible.
- APK standalone.
- Commit → build → APK.
- Instalación y rollback al cliente legado.
