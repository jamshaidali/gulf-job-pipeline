/**
 * Serialises structured data for an inline <script type="application/ld+json"> tag.
 *
 * JSON.stringify does not escape "<", so scraped text containing "</script>" would close the
 * tag early and let attacker-controlled HTML/JS run. Escaping "<", ">" and "&" (plus the
 * U+2028/U+2029 line separators) as \uXXXX keeps the JSON valid and inert.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
