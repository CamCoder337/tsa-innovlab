// cookie.utils.ts

interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

/**
 * Set a cookie + store its expiration timestamp in localStorage
 * (so we can reliably know when it expires)
 */
export function setCookie(
  name: string,
  value: string | null,
  options: CookieOptions = {},
  expiresIn?: number // seconds
) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const { days = 7, path = '/', sameSite = isHttps ? 'Strict' : 'Lax', secure = isHttps } = options;

  // Remove cookie case (value = null)
  if (value === null) {
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
    localStorage.removeItem(`cookie:${name}:expires`);
    return;
  }

  let expiresSeconds: number;

  if (expiresIn !== undefined) {
    expiresSeconds = expiresIn;
  } else {
    expiresSeconds = days * 24 * 60 * 60;
  }

  const expiresDate = new Date(Date.now() + expiresSeconds * 1000);

  // Prefer Max-Age (modern, more reliable than expires=)
  const cookieString = [
    `${name}=${encodeURIComponent(value)}`,
    `path=${path}`,
    `Max-Age=${expiresSeconds}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  document.cookie = cookieString;

  // Store expiration timestamp for easy access later
  localStorage.setItem(`cookie:${name}:expires`, expiresDate.getTime().toString());
}

/**
 * Get raw cookie value
 */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get expiration Date of the cookie (Date object)
 * Returns null if not set or expired
 */
export function getCookieExpiry(name: string): Date | null {
  const timestampStr = localStorage.getItem(`cookie:${name}:expires`);
  if (!timestampStr) return null;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  const date = new Date(timestamp);
  return date.getTime() > Date.now() ? date : null;
}

/**
 * Check if cookie is expired
 */
export function isCookieExpired(name: string): boolean {
  return getCookieExpiry(name) === null;
}

/**
 * Get seconds remaining until cookie expires
 */
export function getCookieSecondsRemaining(name: string): number {
  const expiry = getCookieExpiry(name);
  if (!expiry) return 0;
  return Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
}

/**
 * Delete cookie + clean localStorage
 */
export function deleteCookie(name: string) {
  setCookie(name, null);
}
