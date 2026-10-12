import { AnimatePresence, motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { longToday } from '../../utils/format';

export function PanelHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="panel-header">
      <div>
        <p className="panel-header__meta">
          <span className="eyebrow">{eyebrow}</span>
          <span className="panel-header__date">{longToday()}</span>
        </p>
        <h1>{title}</h1>
        {subtitle && <p className="panel-header__sub">{subtitle}</p>}
      </div>
      {children && <div className="panel-header__tools">{children}</div>}
    </header>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: 'default' | 'dark' | 'caramel' | 'olive';
}

/** Indicador con animación suave cuando el valor cambia. */
export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        <span className="stat__icon" aria-hidden>
          <Icon size={18} />
        </span>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.strong
          key={String(value)}
          className="stat__value"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          {value}
        </motion.strong>
      </AnimatePresence>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}

export function Card({ title, subtitle, children, action, className = '' }: { title?: string; subtitle?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card__head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function FlavorDot({ color }: { color: string }) {
  return <i className="flavor-dot" style={{ background: color }} aria-hidden />;
}
