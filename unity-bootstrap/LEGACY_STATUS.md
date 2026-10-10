# VEXFORGE — Unity Android Runtime

`unity/**` contiene el runtime Android del juego y se conserva intacto durante
la limpieza del repositorio.

- Unity es el runtime canónico del juego.
- No modificar el código Unity como parte de la limpieza.
- El workflow manual está en `.github/workflows/vexforge-unity-android-github.yml`.
- El modo `shard` usa 12 particiones y limita cada shard a 35.000 variantes.
- No iniciar builds ni despachar workflows sin autorización explícita.