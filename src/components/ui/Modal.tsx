'use client';

import { forwardRef, HTMLAttributes, Fragment, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open, onClose, title, description, size = 'md', closeOnOverlayClick = true, closeOnEscape = true, children, ...props }, ref) => {
    if (!open) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-4xl',
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    return (
      <Fragment>
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={ref}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in',
            className
          )}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div
            className={cn(
              'glass-card-elevated w-full rounded-2xl overflow-hidden',
              sizeClasses[size]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || description) && (
              <div className="flex items-start justify-between p-6 border-b border-border">
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-heading-md text-text-primary">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="mt-1 text-body-sm text-text-muted">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="btn-ghost btn-icon-sm text-text-muted hover:text-text-primary"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className={cn(!title && !description ? 'p-6' : 'p-6 pt-0')}>
              {children}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
);

Modal.displayName = 'Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-body text-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}