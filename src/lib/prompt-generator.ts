import { getFlavorById, DEFAULT_FLAVOR_ID, type PromptFlavor } from './prompt-flavors';

/**
 * Generiert den Basis-Prompt für die AI-Generierung mit spezifischem Flavor
 */
export function createBasePrompt(flavorId: string = DEFAULT_FLAVOR_ID): string {
  const flavor = getFlavorById(flavorId);
  return flavor.basePrompt;
}

/**
 * Erstellt den vollständigen Prompt für eine spezifische URL mit Flavor
 */
export function createPromptForUrl(
  query: string, 
  parameterContext: string, 
  flavorId: string = DEFAULT_FLAVOR_ID
): string {
  const basePrompt = createBasePrompt(flavorId);
  return `${basePrompt}

URL: ${query} Zusatz:${parameterContext}`;
}

/**
 * Erstellt den vollständigen Prompt mit explizitem Flavor-Objekt
 */
export function createPromptWithFlavor(
  query: string, 
  parameterContext: string, 
  flavor: PromptFlavor
): string {
  return `${flavor.basePrompt}

URL: ${query} Zusatz:${parameterContext}`;
}
