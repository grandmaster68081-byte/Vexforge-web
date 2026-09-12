# VEXFORGE — DIAGNÓSTICO DE LAS CAPTURAS ACTUALES

## Conclusión
Las capturas actuales demuestran bastante funcionalidad, pero la capa de experiencia tiene patrones de panel administrativo:
- Muchas funciones están representadas como tarjetas/containers repetidos.
- Existen numerosos chips de filtros y pestañas que dominan la jerarquía.
- Hay bloques de estados vacíos y registros que se perciben más como CRUD/QA que como juego.
- Los fondos son temáticos, pero la escena no gobierna la interacción.
- La información técnica o de sistema ocupa un lugar visual comparable al gameplay.
- La navegación inferior está clara, pero se siente como navegación de aplicación y no como parte del mundo.

## Lo que NO debe eliminarse
La funcionalidad existente es valiosa: filtros, búsqueda, estados, datos reales, economía, misiones, sistemas, perfil, deck, cartas, arena. El objetivo no es borrar esa base, sino cambiar la forma en que el jugador la encuentra y la percibe.

## FOJA actual
La captura muestra una home funcional con métricas, eventos, cartas, misiones y sistemas. Debe evolucionar hacia una escena vertical viva donde estos elementos existan como contexto y no como una sucesión de paneles.

## BATALLA actual
La pantalla expone ForgeFormation, motor de combate, carga de configuración y un área de búsqueda. Esto es útil para validar el backend pero no es una presentación de jugador final. Hay que conservar la lógica y reimaginar la presentación como Arena.

## CARTAS actual
Hay una colección razonablemente funcional: búsqueda, filtros, rarezas, facciones, cards y detalle. El salto es convertirla en una colección de alto valor percibido: arte primero, metadatos después, descubrimiento, estados de nueva/no obtenida, y transición natural a mazo.

## MAZO actual
El constructor ya contiene métricas y selección. Debe convertirse en una operación estratégica de "forja": el deck como objeto central, validaciones visibles, sinergias y feedback inmediato.

## PERFIL actual
La pantalla ya concentra identidad, rango, nivel y recursos. Debe convertirse en un "Legado" que cuente la trayectoria del jugador, reduciendo la sensación de ficha administrativa.

## Regla de oro para la nueva arquitectura
No hacer cinco "reskins" independientes. Crear un sistema coherente de lenguaje visual, motion, transiciones, navegación y feedback, y después especializar cada dominio.
