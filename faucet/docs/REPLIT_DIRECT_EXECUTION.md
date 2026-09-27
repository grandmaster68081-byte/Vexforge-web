# KIVORA 5.0 — DIRECT EXECUTION ORDER

Realiza exactamente esta implementación y no dejes el trabajo en ningún entorno local; todo el trabajo realizado debe quedar reflejado aquí:
https://kivora-rewards.pages.dev/

URL Github: https://github.com/grandmaster68081-byte/Vexforge-web.git

Supabase URL : https://rscuzqnfccqvltkdcdny.supabase.co

No uses conectores para esto.

## SOURCE OF TRUTH

Usa este paquete como fuente de verdad visual/productual y conserva el backend económico v2.1 que ya está desplegado.

NO diseñes otra interfaz.
NO inventes otra arquitectura.
NO cambies VEXFORGE.
NO hagas onboarding de BitcoTasks en esta fase.
NO pidas BitcoTasks credentials.
NO pidas SUPABASE_DB_PASSWORD para npm build.
NO pongas secrets en Git/frontend.

## EXECUTE

1. Integrar `faucet/src/kivora/KivoraFinalWorld.tsx` como experiencia principal autenticada.
2. Integrar `faucet/src/styles.css` final.
3. Copiar todos los assets de `faucet/public/kivora/identity/` y `faucet/public/kivora/ui/`.
4. Sustituir `faucet/src/App.tsx` por el incluido.
5. Sustituir `faucet/src/lib/types.ts` y `faucet/src/lib/api.ts` por los incluidos.
6. Aplicar los endpoints incluidos bajo `faucet/functions/api/` sin sobrescribir otras funciones de VEXFORGE.
7. Mantener las migraciones v2.1 ya aplicadas en Supabase; NO ejecutar migraciones antiguas del paquete anterior.
8. Verificar que `request_withdrawal_v2`, `settle_due_rewards_v2`, `admin_summary_v2`, `admin_update_withdrawal_v2` y `apply_bitcotasks_postback_v2` existen en el proyecto remoto. Si alguna no existe, NO improvisar: detenerse y reportar el nombre exacto faltante.
9. Provider absent behavior: `providerConfigured=false`, UI usable, no crash, no fake rewards.

## BUILD — NO BLOQUEAR

Usar `npm install` (NO `npm ci`; este paquete deliberadamente no depende de un lockfile nuevo).

Después ejecutar:

npm test
npm run typecheck
npm run build

El build NO debe requerir:
- BITCOTASKS_API_KEY
- BITCOTASKS_BEARER_TOKEN
- BITCOTASKS_SECRET_KEY
- SUPABASE_DB_PASSWORD

Cloudflare Pages debe seguir:
main → faucet → npm run build → dist

## VISUAL ACCEPTANCE

RECHAZAR si el resultado vuelve a ser un dashboard de tarjetas con un gradiente.

Debe aparecer en producción:
- escena completa
- Kivora Engine como objeto central
- Opportunity Field espacial
- Vault como objeto/estado
- Chronicle como memoria visual
- Settlement Terminal como proceso
- navegación de escenas
- motion de estado
- experiencia móvil propia

## QA EVIDENCE

Entregar antes de cerrar:
- commit hash
- archivos modificados
- npm test result
- npm run typecheck result
- npm run build result
- Cloudflare deployment id/commit
- URL final
- confirmación de providerConfigured=false si BitcoTasks sigue sin credentials

NO declarar terminado si el deployment no refleja la nueva experiencia en `https://kivora-rewards.pages.dev/`.
