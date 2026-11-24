import { apiFetch } from './client';
import { apiUpload } from './client';

export async function uploadImage(folder: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload(`/api/admin/uploads?folder=${folder}`, formData);
}

export async function deleteUpload(key: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/uploads?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ ok: boolean }>('/api/admin/account/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
}

export async function listSessions() {
  return apiFetch<{ items: Array<{ id: string; userAgent: string | null; ip: string | null; createdAt: Date; expiresAt: Date }> }>('/api/admin/account/sessions');
}

export async function revokeSession(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/account/sessions/${id}`, { method: 'DELETE' });
}

export async function getDashboard() {
  return apiFetch<{
    stats: { interestsToday: number; contactsToday: number; totalProducts: number; publishedProducts: number; activeDiscounts: number; totalInterests: number; totalContacts: number; totalBlogs: number; publishedBlogs: number };
    todayInterests: Array<{ id: string; reference: string; customerName: string; status: string; totalEstimate: number; createdAt: Date }>;
    chart: Array<{ date: string; count: number }>;
    needsAttention: Array<{ id: string; reference: string; customerName: string; status: string; reminderCount: number; lastRemindedAt: Date | null }>;
    activeDiscounts: any[];
  }>('/api/admin/dashboard');
}

export async function getCounts() {
  return apiFetch<{ interestsToday: number; contactsNew: number; pendingInterests: number }>('/api/admin/counts');
}

export async function sendEmailTest(template: string, to?: string) {
  return apiFetch<{ provider: string; messageId?: string }>('/api/admin/email-test', { method: 'POST', body: JSON.stringify({ template, to }) });
}
