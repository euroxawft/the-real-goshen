import { apiFetch } from './client';

export type DiscountEvent = {
  id: string;
  name: string;
  scope: 'all' | 'product';
  percentage: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  state?: string;
  product?: { id: string; name: string } | null;
  products: { id: string; name: string }[];
  productCount: number;
  createdAt: Date;
};

export async function listAdminDiscounts() {
  return apiFetch<{ items: DiscountEvent[] }>('/api/admin/discounts');
}

export async function createDiscount(data: { name: string; scope: 'all' | 'product'; productIds?: string[]; percentage: number; startsAt: string; endsAt: string; isActive?: boolean }) {
  return apiFetch<DiscountEvent>('/api/admin/discounts', { method: 'POST', body: JSON.stringify(data) });
}

export async function toggleDiscount(id: string) {
  return apiFetch<DiscountEvent>(`/api/admin/discounts/${id}/toggle`, { method: 'PATCH' });
}

export async function deleteDiscount(id: string) {
  return apiFetch<{ id: string }>(`/api/admin/discounts/${id}`, { method: 'DELETE' });
}
