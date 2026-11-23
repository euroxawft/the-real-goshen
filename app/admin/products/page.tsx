'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { ProductFormModal, EditProductImagesModal, emptyProductForm, type AdminProductFormValues } from '@/components/admin/product-form-modal';
import { listAdminProducts, publishProduct, deleteProduct, duplicateProduct, type AdminProduct } from '@/lib/api/products';
import { formatNaira } from '@/lib/format';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';

const PAGE_SIZE = 12;

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [imagesProduct, setImagesProduct] = useState<AdminProduct | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => listAdminProducts({ q: search, page, limit: PAGE_SIZE }),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => publishProduct(id, isPublished),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { invalidate(); toast.success('Product deleted'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateProduct,
    onSuccess: () => { invalidate(); toast.success('Product duplicated'); },
  });

  const editInitial: AdminProductFormValues = editProduct
    ? {
        id: editProduct.id,
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
        categoryId: editProduct.categoryId ?? '',
        availability: editProduct.availability,
        leadTimeWeeksMin: editProduct.leadTimeWeeksMin ?? 4,
        leadTimeWeeksMax: editProduct.leadTimeWeeksMax ?? 8,
        stockStatus: editProduct.stockStatus,
        isPublished: editProduct.isPublished,
        isFeatured: editProduct.isFeatured,
        imageKeys: editProduct.imageKeys ?? [],
      }
    : emptyProductForm;

  return (
    <AdminLayout title="Products" eyebrow="Keep your collection fresh and easy to browse">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <form
          className="search-box"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }}
          style={{ maxWidth: 320 }}
        >
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
        </form>
        <button className="button button-dark" onClick={() => setCreateOpen(true)}><Plus size={16} /> New product</button>
      </div>

      <section className="admin-card">
        {isLoading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        ) : data?.items.length ? (
          data.items.map((product) => (
            <div className="admin-row" key={product.id}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {product.coverImage && <img src={product.coverImage} alt={product.name} width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover' }} />}
                <div>
                  <strong>{product.name}</strong>
                  <div className="helper">{product.category?.name ?? 'Uncategorised'} · {formatNaira(product.price)} · {product.availability === 'preorder' ? 'Preorder' : 'Ready stock'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className={`status-chip ${product.isPublished ? 'green' : ''}`}
                  style={{ border: 'none', cursor: 'pointer', background: 'none' }}
                  onClick={() => publishMutation.mutate({ id: product.id, isPublished: !product.isPublished })}
                >
                  {product.isPublished ? 'Published' : 'Draft'}
                </button>
                <Link href={`/admin/products/${product.id}`} className="text-link">Details</Link>
                <button onClick={() => setEditProduct(product)} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => setImagesProduct(product)} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Images</button>
                <button onClick={() => { if (confirm(`Duplicate "${product.name}"?`)) duplicateMutation.mutate(product.id); }} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Duplicate</button>
                <button onClick={() => { if (confirm(`Delete "${product.name}"? This cannot be undone.`)) deleteMutation.mutate(product.id); }} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state"><h2>No products yet</h2><p>Create your first product to start selling.</p><button className="button button-dark" onClick={() => setCreateOpen(true)}><Plus size={16} /> New product</button></div>
        )}
      </section>

      <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} onChange={setPage} />

      <ProductFormModal open={createOpen} onOpenChange={setCreateOpen} initial={emptyProductForm} onSaved={invalidate} />
      {editProduct && (
        <ProductFormModal
          key={`edit-${editProduct.id}`}
          open={Boolean(editProduct)}
          onOpenChange={(open) => { if (!open) setEditProduct(null); }}
          initial={editInitial}
          onSaved={invalidate}
        />
      )}
      {imagesProduct && (
        <EditProductImagesModal
          key={`images-${imagesProduct.id}`}
          open={Boolean(imagesProduct)}
          onOpenChange={(open) => { if (!open) setImagesProduct(null); }}
          product={{ id: imagesProduct.id, name: imagesProduct.name, imageKeys: imagesProduct.imageKeys ?? [] }}
          onSaved={invalidate}
        />
      )}
    </AdminLayout>
  );
}
