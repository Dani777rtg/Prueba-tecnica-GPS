const TOKEN_KEY = 'fleet_gps_token';
export const UNAUTH_EVENT = 'fleet:unauthorized';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function notifyUnauthorized() {
  clearToken();
  window.dispatchEvent(new Event(UNAUTH_EVENT));
}

export function onUnauthorized(handler) {
  window.addEventListener(UNAUTH_EVENT, handler);
  return () => window.removeEventListener(UNAUTH_EVENT, handler);
}
