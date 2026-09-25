# VEXFORGE — Official Portal V3 Tier 1 / Implementation Specification

## 1. Producto

La web es un portal editorial y de distribución. No es una segunda implementación del juego.

La referencia estructural son los portales oficiales de videojuegos: una portada con identidad fuerte, navegación corta, contenido visual, archivo de cartas, mundo, noticias/media, soporte y una puerta de descarga. La referencia visual no se copia: se traduce al lenguaje VEXFORGE.

## 2. Dirección visual

El portal debe sentirse como una pieza editorial de un videojuego premium:

- negro profundo y azul nocturno como campo base;
- oro/ember como señal de jerarquía;
- violeta arcano y azul frío solo como iluminación ambiental;
- tipografía de display `Cinzel`/`Cinzel Decorative` y texto funcional `Rajdhani`/`IBM Plex Mono`;
- imágenes a sangre, recortes angulares, líneas de precisión, jerarquía asimétrica y espacios de respiración;
- profundidad mediante gradientes, viñetas, máscaras, capas y desplazamientos muy sutiles;
- nada de grids de SaaS, glassmorphism indiscriminado, partículas decorativas, métricas falsas, iconografía juguetona o exceso de componentes.

## 3. Rutas

`/` `/game` `/cards` `/world` `/news` `/media` `/download` `/download/android` `/support` `/privacy` `/terms` y fallback 404.

## 4. Descarga

`DOWNLOAD_TARGETS.googlePlay` y `DOWNLOAD_TARGETS.directAndroid` deben permanecer vacíos hasta disponer de URLs reales.

El UI debe comunicar `PRÓXIMAMENTE`. No abrir enlaces falsos ni iniciar descargas automáticas.

## 5. Assets

Usar las rutas existentes de Supabase Storage documentadas en `src/lib/assets.ts`.

No convertir la galería web en una copia local de los assets. Esto mantiene el repositorio pequeño y respeta la fuente canónica de arte.

## 6. Cartas

La consulta pública de `cards` solo recupera los campos necesarios para la vitrina. Solo se usa `image_url` cuando empieza por la ruta pública oficial de `vexforge-assets/cards/`.

## 7. Limpieza de la web antigua

La implementación nueva no debe conservar rutas o superficies del antiguo dashboard. No existe `AuthProvider`, `ProtectedAdminRoute`, ni llamadas de sesión. No se crean páginas informativas que reintroduzcan operaciones antiguas como mercado, depósitos, inventario o administración.

La retirada de objetos exclusivos de la aplicación anterior en Supabase se gestiona por auditoría y no por borrado automático.

## 8. Performance

- `loading=eager` únicamente para la hero principal cuando aporta valor;
- el resto de imágenes usa `lazy` + `decoding=async`;
- animaciones solo con `transform`/`opacity` en elementos revelados;
- no dependencias de animación de terceros;
- `prefers-reduced-motion` respetado;
- no se descarga un segundo sistema de imágenes locales.

## 9. Responsive

El diseño está pensado primero para pantallas móviles estrechas y después escala a desktop. La navegación móvil conserva la misma jerarquía visual del desktop sin crear un menú genérico distinto.

## 10. Definición de acabado

El criterio de aceptación no es “hay muchas cosas”. Debe sentirse como una web oficial de videojuego: fuerte en la portada, editorial en los interiores, visualmente controlada y breve.
