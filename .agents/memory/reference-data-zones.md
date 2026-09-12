---
name: Reference data zones
description: Regla para conectar datos reales a composiciones Android estáticas sin romper la procedencia ni la geometría visual.
---

Las composiciones PNG Android son arte de referencia fijo; los datos dinámicos deben montarse como overlays proporcionales, recortados y ubicados sólo en las zonas funcionales que el arte define. Los textos genéricos ya dibujados en el PNG no son datos persistidos.

**Why:** El producto exige conservar el arte oficial sin regenerarlo, pero una capa dinámica mal ubicada puede mostrar cartas, identidad o recursos en un panel que no les corresponde.

**How to apply:** Antes de añadir un dato a Cartas, Mazos o Perfil, identificar su campo canónico y su zona visible en la referencia; si el campo no existe, mostrar ausencia explícita o dejar la zona estática, nunca inventar un nombre, facción, Nick o métrica.