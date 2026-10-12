import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
  role?: 'dialog' | 'alertdialog';
}

export function Modal({ open, onClose, title, eyebrow, children, actions, wide, role = 'dialog' }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalInner onClose={onClose} title={title} eyebrow={eyebrow} actions={actions} wide={wide} role={role}>
          {children}
        </ModalInner>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalInner({ onClose, title, eyebrow, children, actions, wide, role }: Omit<ModalProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={ref}
        className={`modal${wide ? ' modal--wide' : ''}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Cerrar">
          <X size={20} aria-hidden />
        </button>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 id={titleId}>{title}</h2>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </motion.div>
    </motion.div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Volver', tone = 'primary', onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </button>
          <button type="button" className={`btn${tone === 'danger' ? ' btn--danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="muted">{description}</div>
    </Modal>
  );
}
