/** Centralized env access for the SPA */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

export const IS_DEV = Boolean(import.meta.env.DEV);
