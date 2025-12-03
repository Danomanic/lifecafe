// Client-side authentication utilities

const AUTH_KEY = 'lifecafe_auth';
const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;

  try {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return false;

    const { timestamp } = JSON.parse(authData);
    const now = Date.now();
    const elapsed = now - timestamp;

    // Check if 24 hours have passed
    if (elapsed > AUTH_DURATION) {
      // Session expired, clear it
      clearAuth();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

export function setAuth() {
  if (typeof window === 'undefined') return;

  const authData = {
    timestamp: Date.now(),
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthTimeRemaining() {
  if (typeof window === 'undefined') return 0;

  try {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return 0;

    const { timestamp } = JSON.parse(authData);
    const now = Date.now();
    const elapsed = now - timestamp;
    const remaining = AUTH_DURATION - elapsed;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Error getting auth time remaining:', error);
    return 0;
  }
}
