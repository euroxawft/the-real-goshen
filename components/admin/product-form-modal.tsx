'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Modal } from './modal';
import { createProduct, updateProduct } from '@/lib/api/products';
import { listAllCategories, type Category } from '@/lib/api/categories';
import { uploadImage } from '@/lib/api/account';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';

export type AdminProductFormValues = {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  availability: 'preorder' | 'ready_stock';
  leadTimeWeeksMin: number;
  leadTimeWeeksMax: number;
  stockStatus: 'in_stock' | 'limited' | 'out_of_stock';
  isPublished: boolean;
  isFeatured: boolean;
  imageKeys: string[];
};

export const emptyProductForm: AdminProductFormValues = {
  name: '', description: '', price: 0, categoryId: '', availability: 'preorder',
  leadTimeWeeksMin: 4, leadTimeWeeksMax: 8, stockStatus: 'in_stock',
  isPublished: false, isFeatured: false, imageKeys: [],
};

export function ProductFormModal({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AdminProductFormValues;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AdminProductFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => { if (open) setForm(initial); }, [open, initial]);
  useEffect(() => {
    if (!open || cats.length) return;
    listAllCategories().then((data) => setCats(data.items)).catch(() => setCats([]));
  }, [open, cats.length]);

  const set = <K extends keyof AdminProductFormValues>(key: K, value: AdminProductFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        categoryId: form.categoryId || null,
        availability: form.availability,
        leadTimeWeeksMin: form.availability === 'preorder' ? Number(form.leadTimeWeeksMin) : null,
        leadTimeWeeksMax: form.availability === 'preorder' ? Number(form.leadTimeWeeksMax) : null,
        stockStatus: form.availability === 'ready_stock' ? form.stockStatus : 'in_stock',
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        images: form.imageKeys,
      };
      if (form.id) await updateProduct(form.id, payload);
      else await createProduct(payload);
      toast.success(form.id ? 'Product updated' : 'Product created');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} wide title={form.id ? 'Edit product' : 'Create product'} description={form.id ? 'Update the details of this piece.' : 'Add a new piece to the collection.'}>
      <div className="field"><label>Name</label><input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
      <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} /></div>
      <div className="field"><label>Price (NGN)</label><input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} /></div>
      <div className="field">
        <label>Category</label>
        <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">Uncategorised</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Availability</label>
        <select value={form.availability} onChange={(e) => set('availability', e.target.value as AdminProductFormValues['availability'])}>
          <option value="preorder">Preorder</option>
          <option value="ready_stock">Ready stock</option>
        </select>
      </div>
      {form.availability === 'preorder' ? (
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Lead time min (weeks)</label><input type="number" min={0} value={form.leadTimeWeeksMin} onChange={(e) => set('leadTimeWeeksMin', Number(e.target.value))} /></div>
          <div className="field" style={{ flex: 1 }}><label>Lead time max (weeks)</label><input type="number" min={0} value={form.leadTimeWeeksMax} onChange={(e) => set('leadTimeWeeksMax', Number(e.target.value))} /></div>
        </div>
      ) : (
        <div className="field">
          <label>Stock status</label>
          <select value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value as AdminProductFormValues['stockStatus'])}>
            <option value="in_stock">In stock</option>
            <option value="limited">Limited</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </div>
      )}
      <div className="field" style={{ display: 'flex', gap: 20 }}>
        <label><input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /> Published</label>
        <label><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured</label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="button button-dark" onClick={save} disabled={saving || form.name.trim().length < 2}>{saving ? 'Saving...' : 'Save product'}</button>
        <button className="button" onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    </Modal>
  );
}

export function EditProductImagesModal({ open, onOpenChange, product, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; imageKeys: string[] } | null;
  onSaved: () => void;
}) {
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open && product) setKeys(product.imageKeys); }, [open, product]);

  async function handleUpload(files: FileList) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (keys.length >= 8) { toast.error('Up to 8 images per product'); break; }
        try {
          const result = await uploadImage('products', file);
          setKeys((prev) => [...prev, result.key]);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!product) return;
    setBusy(true);
    try {
      await updateProduct(product.id, { images: keys });
      toast.success('Images updated');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update images');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} wide title="Edit product images" description={product ? product.name : undefined}>
      <p className="helper">The first image is the cover. Up to 8 images.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {keys.map((key, i) => (
          <div key={key} style={{ position: 'relative', width: 96, height: 96 }}>
            <Image src={`/api/admin/uploads?preview=${encodeURIComponent(key)}`} alt={`Image ${i + 1}`} width={96} height={96} style={{ borderRadius: 8, objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
            {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 10, background: 'var(--gold-text)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>Cover</span>}
            <button
              onClick={() => setKeys((prev) => prev.filter((_, idx) => idx !== i))}
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Remove image"
            ><X size={12} /></button>
          </div>
        ))}
        {keys.length < 8 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: 96, height: 96, borderRadius: 8, border: '2px dashed var(--border)', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--muted)' }}
          >
            <Upload size={20} />
            <span style={{ fontSize: 11 }}>{busy ? 'Uploading…' : 'Upload'}</span>
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => e.target.files && handleUpload(e.target.files)} />

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="button button-dark" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save images'}</button>
        <button className="button" onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    </Modal>
  );
}
