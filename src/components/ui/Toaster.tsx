import { AnimatePresence, motion } from 'motion/react';
import { Check, Info, TriangleAlert, X } from 'lucide-react';
import { useToast } from '../../store/useToast';

const ICON = { success: Check, error: TriangleAlert, info: Info };

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              className={`toast toast--${t.tone}`}
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            >
              <span className="toast__icon" aria-hidden>
                <Icon size={16} strokeWidth={2.6} />
              </span>
              <div>
                <strong>{t.title}</strong>
                {t.description && <p>{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
                <X size={16} aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
