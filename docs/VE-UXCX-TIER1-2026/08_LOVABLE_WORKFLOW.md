# VEXFORGE — LOVABLE WORKFLOW / UX-CX EXECUTION NOTES

## Por qué este paquete existe

Este paquete es un complemento del protocolo maestro. Lovable es especialmente útil aquí como entorno para convertir la intención de diseño en prototipos funcionales, estados y código real, no solo imágenes. Sus herramientas actuales incluyen control visual, React/Tailwind, temas, GitHub y conexión con Supabase.

## Flujo recomendado

1. Leer el protocolo maestro de VEXFORGE.
2. Leer `00_LOVABLE_MASTER_DIRECTIVE.md`.
3. Abrir las referencias visuales.
4. Auditar las rutas y componentes reales.
5. Construir primero el sistema visual común.
6. Implementar FOJA como patrón.
7. Extender el lenguaje a los cuatro dominios restantes.
8. Realizar pruebas de estados y navegación.
9. Revisar responsive/mobile y performance.
10. Sincronizar cambios/handoff mediante GitHub cuando corresponda.

## Regla para Supabase

Usar el Supabase existente como autoridad de datos si el proyecto ya está conectado. No crear un segundo modelo de negocio paralelo solo para facilitar el prototipo.

## Regla para assets

Primero reutilizar assets canónicos. Si falta una pieza, crear una propuesta visual coherente y marcarla claramente como nueva pieza de diseño.

## Regla para handoff

La solución debe poder ser entendida por otro desarrollador. Evitar componentes monolíticos, lógica duplicada y estilos aislados por pantalla.
