'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Modal } from '@/components/admin/modal';
import { listAdminBlog, createBlogPost, updateBlogPost, deleteBlogPost, type BlogPost } from '@/lib/api/blog';
import { uploadImage } from '@/lib/api/account';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { useRef } from 'react';
import { Upload, X } from 'lucide-react';

function toLocalInput(value: Date | string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BlogFormModal({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: (Partial<BlogPost> & { id?: string }) | null;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [publishedAt, setPublishedAt] = useState(toLocalInput(initial?.publishedAt ?? null));
  const [coverKey, setCoverKey] = useState<string | null>(initial?.coverImageKey ?? null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList) {
    setBusy(true);
    try {
      const result = await uploadImage('blog', files[0]);
      setCoverKey(result.key);
    } catch {
      toast.error('Failed to upload cover image');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        title,
        excerpt,
        content,
        isPublished,
        coverImageKey: coverKey,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      };
      if (isEdit) await updateBlogPost(initial!.id!, payload);
      else await createBlogPost(payload);
      toast.success(isEdit ? 'Story updated' : 'Story created');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save story');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} wide title={isEdit ? 'Edit story' : 'Create story'} description={isEdit ? 'Update this journal entry.' : 'Write a new journal entry.'}>
      <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to style your favourite bag" /></div>
      <div className="field"><label>Excerpt</label><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="A short teaser shown on cards" /></div>
      <div className="field"><label>Content</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Write the story…" /></div>
      <div className="field">
        <label>Cover image</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {coverKey && (
            <div style={{ position: 'relative', width: 96, height: 72 }}>
              <Image src={`/api/admin/uploads?preview=${encodeURIComponent(coverKey)}`} alt="Cover preview" width={96} height={72} style={{ borderRadius: 8, objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
              <button
                onClick={() => setCoverKey(null)}
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Remove cover"
              ><X size={12} /></button>
            </div>
          )}
          {!coverKey && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 96, height: 72, borderRadius: 8, border: '2px dashed var(--border)', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--muted)' }}
            >
              <Upload size={18} />
              <span style={{ fontSize: 11 }}>{busy ? 'Uploading…' : 'Upload'}</span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.length && handleUpload(e.target.files)} />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Publish date</label>
          <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
        </div>
        <div className="field" style={{ display: 'flex', alignItems: 'center' }}>
          <label><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="button button-dark" onClick={save} disabled={busy || title.trim().length < 2}>{busy ? 'Saving...' : 'Save story'}</button>
        <button className="button" onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    </Modal>
  );
}

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['admin-blog'], queryFn: listAdminBlog, retry: false });

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-blog'] }); toast.success('Story deleted'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete'),
  });

  const posts = data?.items ?? [];

  return (
    <AdminLayout title="Journal" eyebrow="Stories that sell the lifestyle">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="button button-dark" onClick={() => setCreateOpen(true)}><Plus size={16} /> New story</button>
      </div>

      <section className="admin-card">
        {isLoading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        ) : posts.length ? (
          posts.map((post) => (
            <div className="admin-row" key={post.id}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} width={56} height={42} style={{ borderRadius: 6, objectFit: 'cover' }} />}
                <div>
                  <strong>{post.title}</strong>
                  <div className="helper">{post.isPublished ? `Published · ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}` : 'Draft'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setEditPost(post)} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => { if (confirm(`Delete "${post.title}"? This cannot be undone.`)) deleteMutation.mutate(post.id); }} className="text-link" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state"><h2>No stories yet</h2><p>Write your first journal entry to draw customers in.</p><button className="button button-dark" onClick={() => setCreateOpen(true)}><Plus size={16} /> New story</button></div>
        )}
      </section>

      <BlogFormModal key="create" open={createOpen} onOpenChange={setCreateOpen} initial={null} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-blog'] })} />
      {editPost && (
        <BlogFormModal
          key={`edit-${editPost.id}`}
          open={Boolean(editPost)}
          onOpenChange={(open) => { if (!open) setEditPost(null); }}
          initial={editPost}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-blog'] })}
        />
      )}
    </AdminLayout>
  );
}
