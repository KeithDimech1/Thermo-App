/**
 * Extract paper title from full citation
 *
 * Example citation:
 * "McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A. (2024).
 *  4D fault evolution revealed by footwall exhumation modelling: A natural
 *  experiment in the Malawi rift. Journal of Structural Geology, 187, 105196."
 *
 * Returns: "4D fault evolution revealed by footwall exhumation modelling:
 *           A natural experiment in the Malawi rift"
 */
export function extractPaperTitle(fullCitation: string | null | undefined): string | null {
  if (!fullCitation) return null;

  // Pattern: text between "). " and the first ". " after that
  // This captures the title between year and journal name
  const match = fullCitation.match(/\)\.\s+([^.]+(?:\.[^.]*?)*?)\.\s+(?:[A-Z][^,]*,|[A-Z][^,]*\d)/);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: try simpler pattern for citations without clear journal marker
  const simpleMatch = fullCitation.match(/\(\d{4}\)\.\s+(.+?)\.\s+[A-Z]/);

  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim();
  }

  return null;
}
