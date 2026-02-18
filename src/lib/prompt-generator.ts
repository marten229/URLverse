import { getFlavorById, DEFAULT_FLAVOR_ID, type PromptFlavor } from './prompt-flavors';

/**
 * Returns the base system prompt for the given flavor, falling back to the
 * default flavor if the requested ID is not found.
 *
 * @param flavorId - The flavor identifier to look up.
 * @returns The base prompt string for the resolved flavor.
 */
export function createBasePrompt(flavorId: string = DEFAULT_FLAVOR_ID): string {
  const flavor = getFlavorById(flavorId);
  return flavor.basePrompt;
}

/**
 * Assembles the complete prompt sent to the Gemini API for a given URL.
 *
 * The prompt combines the flavor's base instructions with the target URL and
 * any additional parameter context so the model has all the information it
 * needs to generate a contextually appropriate page.
 *
 * @param query            - The URL path segment(s) to generate a page for.
 * @param parameterContext - A formatted string of URL query parameters to
 *                           include as additional generation instructions.
 * @param flavorId         - The flavor that determines the visual style and
 *                           tone of the generated page.
 * @returns The complete prompt string ready to send to the API.
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
 * Variant of `createPromptForUrl` that accepts a pre-resolved `PromptFlavor`
 * object instead of a flavor ID. Avoids a redundant lookup when the caller
 * already holds the flavor object.
 *
 * @param query            - The URL path segment(s) to generate a page for.
 * @param parameterContext - A formatted string of URL query parameters.
 * @param flavor           - The fully resolved flavor object.
 * @returns The complete prompt string ready to send to the API.
 */
export function createPromptWithFlavor(
  query: string,
  parameterContext: string,
  flavor: PromptFlavor
): string {
  return `${flavor.basePrompt}

URL: ${query} Zusatz:${parameterContext}`;
}
