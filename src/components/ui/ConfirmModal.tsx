'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div 
        className="modal__backdrop"
        onClick={onCancel}
      />
      <div className="modal__content">
        <h2 className="modal__title">
          {title}
        </h2>
        <p className="modal__message">
          {message}
        </p>
        <div className="modal__actions">
          <button
            onClick={onCancel}
            className="modal__button modal__button--secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`modal__button ${variant === 'danger' ? 'modal__button--danger' : 'modal__button--primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

