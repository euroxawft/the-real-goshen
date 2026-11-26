'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { listAdminDiscounts, createDiscount, toggleDiscount, deleteDiscount } from '@/lib/api/discounts';
import { listAdminProducts } from '@/lib/api/products';
import { formatNaira } from '@/lib/format';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { Search, Check, ArrowRight, ArrowLeft, ImageIcon } from 'lucide-react';

const PAGE_SIZE = 12;

type Product = { id: string; name: string; price: number; coverImage: string | null };

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', scope: 'all' as 'all' | 'product', percentage: 10, startsAt: '', endsAt: '' });
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const discountsQuery = useQuery({ queryKey: ['admin-discounts'], queryFn: listAdminDiscounts, retry: false });
  const productsQuery = useQuery({
    queryKey: ['admin-products-picker', searchQuery, page],
    queryFn: () => listAdminProducts({ q: searchQuery, page, limit: PAGE_SIZE }),
    enabled: showForm && step === 2,
    retry: false,
  });

  const products: Product[] = productsQuery.data?.items ?? [];
  const pickedSet = useMemo(() => new Set(picked), [picked]);

  const resetForm = () => { setShowForm(false); setStep(1); setForm({ name: '', scope: 'all', percentage: 10, startsAt: '', endsAt: '' }); setPicked([]); setSearch(''); setSearchQuery(''); setPage(1); };

  const createMutation = useMutation({
    mutationFn: () => createDiscount({
      name: form.name,
      scope: form.scope,
      productIds: form.scope === 'product' ? picked : undefined,
      percentage: form.percentage,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      isActive: true,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-discounts'] }); toast.success('Discount created'); resetForm(); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create discount'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleDiscount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-discounts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-discounts'] }); toast.success('Discount deleted'); },
  });

  const goNext = () => {
    if (!form.name || !form.startsAt || !form.endsAt) { toast.error('Fill in the name, start and end time first'); return; }
    setPage(1); setSearch(''); setSearchQuery(''); setStep(2);
  };

  const submit = () => {
    if (form.scope === 'product' && picked.length === 0) { toast.error('Mark at least one product for this discount'); return; }
    createMutation.mutate();
  };

  const togglePick = (id: string) => setPicked((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  return (
    <AdminLayout title="Discounts" eyebrow="Run sales on everything or chosen products">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="button button-dark" onClick={() => { setShowForm(true); setStep(1); }}>New discount</button>
      </div>

      {showForm && step === 1 && (
        <section className="admin-card" style={{ marginBottom: 18 }}>
          <h2>Create discount</h2>
          <p className="helper" style={{ marginBottom: 16 }}>Step 1 of 2 — discount details{form.scope === 'product' ? ', then you will pick the products' : ''}.</p>
          <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Weekend sale" /></div>
          <div className="field">
            <label>Applies to</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className={`chip ${form.scope === 'all' ? 'active' : ''}`} onClick={() => setForm({ ...form, scope: 'all' })}>General — all products</button>
              <button type="button" className={`chip ${form.scope === 'product' ? 'active' : ''}`} onClick={() => setForm({ ...form, scope: 'product' })}>Specific products</button>
            </div>
          </div>
          <div className="field"><label>Percentage (1-90)</label><input type="number" min={1} max={90} value={form.percentage} onChange={(e) => setForm({ ...form, percentage: parseInt(e.target.value) || 1 })} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>Starts at</label><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Ends at</label><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {form.scope === 'all' ? (
              <button className="button button-dark" onClick={submit} disabled={createMutation.isPending}>Create discount</button>
            ) : (
              <button className="button button-dark" onClick={goNext}>Next: pick products <ArrowRight size={16} /></button>
            )}
            <button className="button button-light-outline" onClick={resetForm}>Cancel</button>
          </div>
        </section>
      )}

      {showForm && step === 2 && (
        <section className="admin-card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>Pick products for “{form.name}”</h2>
              <p className="helper">{picked.length} marked · {form.percentage}% off each when the sale runs</p>
            </div>
            <form className="search-box" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearchQuery(search); }} style={{ maxWidth: 280 }}>
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" />
            </form>
          </div>

          {productsQuery.isLoading ? (
            <div className="loading-skeleton" style={{ height: 240 }} />
          ) : productsQuery.isError ? (
            <div className="error-state"><h2>Could not load products</h2><p>Please try again.</p><button className="retry-button" onClick={() => productsQuery.refetch()}>Try again</button></div>
          ) : products.length === 0 ? (
            <div className="empty-state"><h2>No products match</h2><p>Try a different search.</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginTop: 18 }}>
              {products.map((p) => {
                const isPicked = pickedSet.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePick(p.id)}
                    aria-pressed={isPicked}
                    className="picker-card"
                    style={{ borderColor: isPicked ? 'var(--gold)' : 'var(--border)', boxShadow: isPicked ? '0 0 0 2px var(--gold)' : 'none' }}
                  >
                    <div className="picker-thumb">
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImage} alt="" />
                      ) : (
                        <ImageIcon size={22} style={{ color: 'var(--muted)' }} />
                      )}
                      {isPicked && <span className="picker-check"><Check size={13} /></span>}
                    </div>
                    <strong className="picker-name">{p.name}</strong>
                    <span className="helper">{formatNaira(p.price)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <Pagination page={productsQuery.data?.page ?? page} totalPages={productsQuery.data?.totalPages ?? 1} onChange={setPage} />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="button button-dark" onClick={submit} disabled={createMutation.isPending || picked.length === 0}>
              Create discount ({picked.length})
            </button>
            <button className="button button-light-outline" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
          </div>
        </section>
      )}

      <section className="admin-card">
        <h2 style={{ marginBottom: 16 }}>All discounts</h2>
        {discountsQuery.isLoading ? (
          <div className="loading-skeleton" style={{ height: 160 }} />
        ) : discountsQuery.isError ? (
          <div className="error-state"><h2>Could not load discounts</h2><p>Please try again.</p><button className="retry-button" onClick={() => discountsQuery.refetch()}>Try again</button></div>
        ) : discountsQuery.data?.items.length ? (
          discountsQuery.data.items.map((d) => (
            <div className="admin-row" key={d.id}>
              <div>
                <strong>{d.name}</strong>
                <div className="helper">
                  {d.scope === 'all' ? 'All products' : `${d.productCount} product${d.productCount === 1 ? '' : 's'}${d.products.length ? ` · ${d.products.slice(0, 3).map((p) => p.name).join(', ')}${d.products.length > 3 ? '…' : ''}` : ''}`}
                </div>
              </div>
              <span className="badge discount">−{d.percentage}%</span>
              <span className={`status-chip ${d.state === 'running' ? 'green' : ''}`}>{d.state}</span>
              <button className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => toggleMutation.mutate(d.id)}>{d.isActive ? 'Disable' : 'Enable'}</button>
              <button className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => { if (confirm(`Delete "${d.name}"?`)) deleteMutation.mutate(d.id); }}>Delete</button>
            </div>
          ))
        ) : (
          <div className="empty-state"><h2>No discounts yet</h2><p>Create a discount to run a sale.</p></div>
        )}
      </section>
    </AdminLayout>
  );
}
