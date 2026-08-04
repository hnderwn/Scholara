import React, { useRef, useEffect } from 'react';
import Button from './Button';

const RedRule = ({ opacity = 1 }) => (
  <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />
);

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmVariant = 'primary',
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,36,99,0.35)', backdropFilter: 'blur(2px)' }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-sm overflow-hidden shadow-2xl transition-all scale-100 flex flex-col max-h-[95vh] outline-none"
        style={{ background: '#FAF6EC', border: '1px solid #C9A84C' }}
      >
        {/* Top Accent line */}
        <RedRule />

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#C8B99A]/40 flex-shrink-0">
          <h3
            className="font-bold text-xl leading-tight text-[#0A2463]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h3>
        </div>

        {/* Message Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[60vh] flex-1">
          <p
            className="text-sm text-[#2C1F0E] font-medium leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {message}
          </p>
        </div>

        {/* Footer actions */}
        <div
          className="px-6 py-4 flex gap-3 border-t border-[#C8B99A]/40 flex-shrink-0"
          style={{ background: '#EDE4CC' }}
        >
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>

        {/* Bottom Accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
      </div>
    </div>
  );
};

export default ConfirmModal;
