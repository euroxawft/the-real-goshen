'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductFormModal, EditProductImagesModal, emptyProductForm } from '@/components/admin/product-form-modal';
import { getAdminProduct, publishProduct, deleteProduct, type AdminProduct } from '@/lib/api/products';
import { formatNaira } from '@/lib/format';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [editOpen, setEditOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => getAdminProduct(id),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-product', id] });

  const publishMutation = useMutation({
    mutationFn: ({ isPublished }: { isPublished: boolean }) => publishProduct(id, isPublished),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
      router.push('/admin/products');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
  });

  if (isLoading) {
    return <AdminLayout title="Product" eyebrow="Loading"><div className="skeleton" style={{ height: 400, borderRadius: 12 }} /></AdminLayout>;
  }

  if (!product) {
    return (
      <AdminLayout title="Product" eyebrow="Not found">
        <div className="empty-state"><h2>Product not found</h2><p>It may have been deleted.</p></div>
      </AdminLayout>
    );
  }

  const p = product as AdminProduct;

  return (
    <AdminLayout title={p.name} eyebrow="Product details">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className="button button-dark" onClick={() => setEditOpen(true)}>Edit details</button>
        <button className="button" onClick={() => setImagesOpen(true)}>Edit images</button>
        <button className="button" onClick={() => publishMutation.mutate({ isPublished: !p.isPublished })}>
          {p.isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          className="button"
          style={{ color: 'var(--danger)' }}
          onClick={() => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteMutation.mutate(); }}
        >
          Delete
        </button>
      </div>

      <div className="admin-columns">
        <section className="admin-card">
          <h2>Details</h2>
          <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Name</span><strong style={{ display: 'block' }}>{p.name}</strong></div></div>
          <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Price</span><strong style={{ display: 'block' }}>{formatNaira(p.price)}</strong></div></div>
          <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Category</span><strong style={{ display: 'block' }}>{p.category?.name ?? 'Uncategorised'}</strong></div></div>
          <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Availability</span><strong style={{ display: 'block' }}>{p.availability === 'preorder' ? 'Preorder' : 'Ready stock'}</strong></div></div>
          {p.availability === 'preorder' && p.leadTime && (
            <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Lead time</span><strong style={{ display: 'block' }}>{p.leadTime.text}</strong></div></div>
          )}
          {p.availability === 'ready_stock' && (
            <div className="admin-row" style={{ cursor: 'default' }}><div><span className="helper">Stock status</span><strong style={{ display: 'block' }}>{p.stockStatus.replace(/_/g, ' ')}</strong></div></div>
          )}
          <div className="admin-row" style={{ cursor: 'default' }}>
            <div><span className="helper">Status</span></div>
            <span className={`status-chip ${p.isPublished ? 'green' : ''}`}>{p.isPublished ? 'Published' : 'Draft'}</span>
            {p.isFeatured && <span className="badge">Featured</span>}
          </div>
          {p.effectiveDiscount && (
            <div className="admin-row" style={{ cursor: 'default' }}>
              <div><span className="helper">Discount</span><strong style={{ display: 'block' }}>{p.effectiveDiscount.eventName} · −{p.effectiveDiscount.percentage}%</strong></div>
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <span className="helper">Description</span>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{p.description || 'No description yet.'}</p>
          </div>
        </section>

        <section className="admin-card">
          <h2>Images</h2>
          {p.images.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12, marginTop: 12 }}>
              {p.images.map((src, i) => (
                <div key={src} style={{ position: 'relative' }}>
                  <Image src={src} alt={`${p.name} image ${i + 1}`} width={110} height={110} style={{ borderRadius: 10, objectFit: 'cover', width: '100%', height: 110 }} unoptimized />
                  {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, background: 'var(--gold-text)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>Cover</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="helper" style={{ marginTop: 10 }}>No images yet. Use “Edit images” to upload some.</p>
          )}
        </section>
      </div>

      <ProductFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={p ? {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: p.categoryId ?? '',
          availability: p.availability,
          leadTimeWeeksMin: p.leadTimeWeeksMin ?? 4,
          leadTimeWeeksMax: p.leadTimeWeeksMax ?? 8,
          stockStatus: p.stockStatus,
          isPublished: p.isPublished,
          isFeatured: p.isFeatured,
          imageKeys: p.imageKeys ?? [],
        } : emptyProductForm}
        onSaved={invalidate}
      />
      <EditProductImagesModal
        open={imagesOpen}
        onOpenChange={setImagesOpen}
        product={{ id: p.id, name: p.name, imageKeys: p.imageKeys ?? [] }}
        onSaved={invalidate}
      />
    </AdminLayout>
  );
}
