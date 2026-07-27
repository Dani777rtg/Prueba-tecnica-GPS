import { apiJson } from './client.js';
import { setToken } from '../auth/tokenStorage.js';

export async function loginRequest(email, password) {
  const body = await apiJson('/auth/login', {
    method: 'POST',
    auth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  setToken(body.access_token);
  return body;
}

export async function fetchCurrentUser() {
  return apiJson('/auth/me');
}
