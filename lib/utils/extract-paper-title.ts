/**
 * Extract paper title from full citation
 *
 * Example citations:
 * 1. "McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A. (2024).
 *     4D fault evolution revealed by footwall exhumation modelling: A natural
 *     experiment in the Malawi rift. Journal of Structural Geology, 187, 105196."
 * 2. "Ault, A. K., Gautheron, C., & King, G. E. (2019). Innovations in (U–Th)/He,
 *     fission track, and trapped charge thermochronometry. *Tectonics*, *38*, 3705-3739."
 *
 * Returns: Paper title (text between year and journal)
 */
export function extractPaperTitle(fullCitation: string | null | undefined): string | null {
  if (!fullCitation) return null;

  // Remove markdown italics to simplify matching
  const cleanedCitation = fullCitation.replace(/\*/g, '');

  // Pattern 1: Comma-based citation (common in AGU journals like Tectonics)
  // Format: Author (YEAR), Title here, Journal
  // Handles: (2012), Title, Tectonics
  const pattern1 = /\(\d{4}\),\s+(.+?),\s+(?:[A-Z][a-z]+(?:\s+[a-z]+)*)/;
  const match1 = cleanedCitation.match(pattern1);

  if (match1 && match1[1]) {
    let title = match1[1].trim();
    // Remove trailing colons that are part of subtitles
    title = title.replace(/:\s*$/, '');
    return title;
  }

  // Pattern 2: Period-based citation (common in most journals)
  // Format: Author (YEAR). Title here. Journal
  // Handles: (2019). Title. Journal
  const pattern2 = /\)\.\s+(.+?)\.\s+(?:[A-Z][a-z]+(?:\s+[a-z]+)*(?:\s+[A-Z][a-z]+)*)/;
  const match2 = cleanedCitation.match(pattern2);

  if (match2 && match2[1]) {
    let title = match2[1].trim();
    title = title.replace(/[,;]\s*$/, '');
    return title;
  }

  // Pattern 3: Simpler fallback - text between (YEAR). and next period
  // Handles edge cases where journal name pattern doesn't match
  const pattern3 = /\(\d{4}\)\.\s+(.+?)\./;
  const match3 = cleanedCitation.match(pattern3);

  if (match3 && match3[1]) {
    let title = match3[1].trim();
    // Make sure we didn't capture the journal name by checking length and capitals
    // Journal names are usually short and title-cased
    const words = title.split(/\s+/);
    const capitalWords = words.filter(w => /^[A-Z]/.test(w));

    // If more than 70% of words are capitalized AND title is short, probably caught journal
    // In that case, return null to trigger manual extraction
    if (capitalWords.length / words.length > 0.7 && words.length < 5) {
      return null;
    }

    title = title.replace(/[,;]\s*$/, '');
    return title;
  }

  return null;
}
