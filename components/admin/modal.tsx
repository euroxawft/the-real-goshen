'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Modal({ open, onOpenChange, title, description, children, wide }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[88vh] overflow-y-auto`}
        style={{ background: '#fff', color: '#1a1714', borderRadius: 14 }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1a1714' }}>{title}</DialogTitle>
          {description ? <DialogDescription style={{ color: '#6f655b' }}>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
