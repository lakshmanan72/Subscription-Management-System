import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className={`p-3 rounded-full shrink-0 ${variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

