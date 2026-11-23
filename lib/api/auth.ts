import { apiFetch } from './client';

export async function getSetupStatus() {
  return apiFetch<{ needsSetup: boolean }>('/api/admin/auth/setup-status');
}

export async function setup(data: { name: string; email: string; password: string; setupSecret: string }) {
  return apiFetch<{ admin: { id: string; name: string; email: string } }>('/api/admin/auth/setup', { method: 'POST', body: JSON.stringify(data) });
}

export async function login(email: string, password: string) {
  return apiFetch<{ admin: { id: string; name: string; email: string } }>('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function logout() {
  return apiFetch<{ ok: boolean }>('/api/admin/auth/logout', { method: 'POST' });
}

export async function logoutAll() {
  return apiFetch<{ ok: boolean }>('/api/admin/auth/logout-all', { method: 'POST' });
}

export async function getMe() {
  return apiFetch<{ id: string; name: string; email: string }>('/api/admin/auth/me');
}
