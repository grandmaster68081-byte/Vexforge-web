# VEXFORGE — Content / Asset Map

The portal does not ship raster art locally. It references the existing official Supabase Storage assets already used by VEXFORGE.

| Surface | Source | Role |
| --- | --- | --- |
| Home hero | `cover/main.jpg` | primary world key art |
| Game hero | `lobby/main.jpg` | game entry atmosphere |
| Cards hero | `lobby/main.jpg` | collection backdrop |
| Game scene | `regions/region_forge_core.jpg` | forge/preparation atmosphere |
| News visual | `regions/region_shadow_fracture.jpg` | quiet editorial image |
| Support visual | `regions/region_iron_veins.jpg` | support atmosphere |
| Download panel | `regions/region_forge_core.jpg` | download gate visual |
| World hero | `regions/region_forge_core.jpg` | regional atmosphere |
| News hero | `misc/IMG_20260619_122314.jpg` | editorial backdrop |
| Media hero | `cover/main.jpg` | visual archive backdrop |
| Support hero | `misc/IMG_20260619_122314.jpg` | support atmosphere |
| Factions | `factions/*` | official faction backgrounds + icons |
| Regions | `regions/*` | official regional images |
| Cards | Supabase `cards.image_url` | official Mythic/Legendary artwork only |

The map intentionally reuses existing artwork rather than creating or storing new raster files in the web repository.

If a remote asset returns an error, the portal shows a controlled VEXFORGE fallback rather than inventing replacement artwork.
