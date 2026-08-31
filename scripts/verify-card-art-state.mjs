/** VE-3-PILOT — official card art must fail explicitly, never silently or diegetically. */
import { readFileSync } from "node:fs";

const web = readFileSync("src/routes/CardsRoute.tsx", "utf8");
const mobile = readFileSync("mobile/app/(tabs)/collection.tsx", "utf8");
const checks = {
  webLoadingState: web.includes("Cargando arte oficial") && web.includes('setArtState("ready")'),
  webErrorState: web.includes("Arte oficial no disponible") && web.includes('name="warning"'),
  webImageFailureIsExplicit: web.includes('onError={() => setArtState("error")}') && !web.includes('style.display = "none"'),
  mobileLoadingState: mobile.includes("Cargando arte oficial") && mobile.includes("setArtState('ready')"),
  mobileErrorState: mobile.includes("Arte oficial no disponible") && mobile.includes('name="warning"'),
  mobileImageFailureIsExplicit: mobile.includes("onError={() => setArtState('error')}") && !mobile.includes("artFallback"),
};
console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some((value) => !value)) {
  throw new Error("El contrato de estado explícito de arte oficial está incompleto.");
}
console.log("Card art state verified: loading/error are explicit on web and Android collection.");
