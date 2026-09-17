# 20 — KNOWN UNKNOWNS

- `NO_VERIFICADO`: qué instalación física corresponde exactamente a `main` en `f43159e`.
- `NO_VERIFICADO`: resultado de un update OTA real para runtime `1.0.0` en un dispositivo limpio.
- `NO_VERIFICADO`: cobertura física de safe areas, legibilidad, haptics, audio, VFX y rendimiento.
- `NO_VERIFICADO`: estado operacional de cada una de las 345 rutinas live.
- `NO_VERIFICADO`: correspondencia completa entre las 49 migrations del repo y los 318 objetos live.
- `NO_VERIFICADO`: policies efectivas para cada consumer móvil y cada acción económica.
- `REFERENCIADO_PERO_NO_ENCONTRADO`: cualquier asset o RPC citado solo por documentación histórica sin consumer actual.
- `INFERIDO`: clasificación de algunos objetos como legacy/quarantine basada en nombres; requiere confirmar definición y uso live.
- `EVIDENCE_REQUIRED`: settlement y rewards de partidas competitivas en dispositivo real.

- `VERIFICADO_EN_CODIGO_NO_EN_APK`: Unity package/applicationId `com.vexforge.android`, versión `1.0.2`, versionCode `5`, ARM64 e IL2CPP.
- `NO_VERIFICADO`: APK Unity real del commit actual y su instalación física.
- `NO_VERIFICADO`: proveedor CI Unity definitivo; Unity Build Automation requiere Dashboard y las rutas GitHub Actions siguen en prueba.
- `NO_VERIFICADO`: versión exacta de paquetes del cliente C# de Supabase y estrategia de transporte compatible con contratos existentes.
- `VERIFICADO_EN_REPOSITORIO`: ubicación Foundation `unity/`; estrategia de Addressables para assets grandes/dinámicos no está decidida.
- `NO_VERIFICADO`: paridad de Auth, refresh, datos mínimos, runtimeVersion, OTA y rollback entre legado y Unity.
