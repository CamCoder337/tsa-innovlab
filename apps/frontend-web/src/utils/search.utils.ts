/**
 * Normalize text for search by removing accents and converting to lowercase
 * This allows searching "etagere" to match "étagère"
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .trim();
}

/**
 * Check if a search query matches any of the provided text fields
 * Uses accent-insensitive matching
 */
export function matchesSearchQuery(
  query: string,
  ...textFields: (string | undefined | null)[]
): boolean {
  if (!query.trim()) return true;

  const normalizedQuery = normalizeSearchText(query);

  return textFields.some((field) => {
    if (!field) return false;
    const normalizedField = normalizeSearchText(field);
    return normalizedField.includes(normalizedQuery);
  });
}
