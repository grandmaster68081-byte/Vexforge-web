# 17 — CURRENT BLOCK

## CURRENT ACTIVE BLOCK

`ENGINE-DECISION-CANONICALIZATION`

### Objetivo
Persistir la decisión de migrar el runtime final Android de Expo/React Native a Unity 6.3 LTS + URP + C#, manteniendo `mobile/**` intacto como cliente legado y rollback.

### Estado

La decisión está registrada. No existe todavía un proyecto Unity en el repositorio auditado. No se creó código Unity, no se cambió Supabase, no se compiló APK y no se avanzó a una etapa de producto.

### Siguiente bloque

`ETAPA 1 — FOUNDATION / UNITY MIGRATION`, entregada como un único paquete operativo. Debe incluir árbol exacto, archivos completos/parches, comandos, verificadores, criterios de compilación, APK, instalación, backend real, aceptación, errores, finalización y prohibición explícita de avanzar.

### No tocar

`mobile/**`, `src/**`, `supabase/**`, `contracts/**`, `scripts/**`, assets, dependencias, build Expo existente y releases previos. No eliminar React Native hasta un APK Unity validado y rollback disponible.

### Criterios de cierre de Foundation

Unity 6.3 LTS funcional; Android reproducible; package/applicationId canónico; Supabase real; Auth y sesión persistente; GameShell; datos mínimos reales; CI reproducible; APK standalone; trazabilidad commit → build → APK; instalación y rollback del cliente legado.
