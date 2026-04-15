import { useEffect, useRef } from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ModalType = 'error' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const icons = {
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />
  };

  const borderColors = {
    error: 'border-red-200',
    warning: 'border-yellow-200',
    success: 'border-green-200',
    info: 'border-blue-200'
  };

  const bgColors = {
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    success: 'bg-green-50',
    info: 'bg-blue-50'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className={`relative glass-card max-w-sm w-full mx-4 p-6 animate-page-in border ${borderColors[type]}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-xl ${bgColors[type]}`}>
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
            <p className="text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100/50 text-gray-700 font-medium hover:bg-gray-200/50 transition-all backdrop-blur-sm"
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-white shadow-lg transition-all ${
                type === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25'
                  : type === 'warning'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-yellow-500/25'
                  : type === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/25'
                  : 'bg-gradient-to-r from-primary to-accent hover:shadow-primary/25'
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}