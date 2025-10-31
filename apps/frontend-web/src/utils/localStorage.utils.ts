/**
 * Utility functions for localStorage management
 */

/**
 * Efficiently clears all localStorage items whose keys start with the specified prefix
 * @param prefix - The prefix to match (e.g., 'tsa_')
 * @returns number of items cleared
 */
export function clearLocalStorageByPrefix(prefix: string): number {
  const keysToRemove: string[] = getLocalStorageKeysByPrefix(prefix);

  // Remove the collected keys
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log(`Cleared ${keysToRemove.length} localStorage items with prefix '${prefix}'`);
  return keysToRemove.length;
}

/**
 * Gets all localStorage keys that start with the specified prefix
 * @param prefix - The prefix to match
 * @returns array of matching keys
 */
export function getLocalStorageKeysByPrefix(prefix: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const matchingKeys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      matchingKeys.push(key);
    }
  }

  return matchingKeys;
}

/**
 * Clears all TSA-specific localStorage items
 * @returns number of items cleared
 */
export function clearTSALocalStorage(): number {
  return clearLocalStorageByPrefix('tsa_');
}
