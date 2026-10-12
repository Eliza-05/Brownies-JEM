import { Ban, Check, Clock, Minus, PackageCheck, Plus, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { STATUS_LABEL } from '../../data/products';
import type { OrderStatus } from '../../data/types';

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`demo-badge ${className}`} title="Prototipo académico: los datos son simulados y no hay autenticación real.">
      <span className="dot" aria-hidden />
      Modo demo
    </span>
  );
}

const STATUS_ICON: Record<OrderStatus, typeof Clock> = {
  pendiente: Clock,
  confirmado: Check,
  entregado: PackageCheck,
  cancelado: Ban,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`badge badge--${status}`}>
      <Icon size={14} strokeWidth={2.5} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

interface StepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

export function QuantityStepper({ value, min = 1, max, onChange, label }: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Quitar una unidad de ${label}`}>
        <Minus size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <output aria-live="polite" aria-label={`${value} unidades`}>
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Agregar una unidad de ${label}`}>
        <Plus size={16} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? '' : 'off'} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <EmptyPlate />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

/** Plato vacío con migas: ilustración para estados vacíos. */
function EmptyPlate() {
  return (
    <svg className="empty__art" viewBox="0 0 120 90" aria-hidden>
      <ellipse cx="60" cy="62" rx="52" ry="16" fill="#F2E4D2" />
      <ellipse cx="60" cy="58" rx="40" ry="11" fill="#FFFCF7" stroke="#CDB59B" strokeWidth="1.5" />
      <circle cx="44" cy="56" r="2.2" fill="#65402F" />
      <circle cx="70" cy="60" r="1.6" fill="#65402F" />
      <circle cx="62" cy="54" r="1.2" fill="#C56C3D" />
      <circle cx="78" cy="55" r="1.8" fill="#30201B" />
      <path d="M48 30c4-8 12-8 14-2 2-6 10-6 13 2" fill="none" stroke="#CDB59B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Línea ondulada de chocolate usada como separador editorial. */
export function ChocolateDrip({ color = 'var(--espresso)', className = '' }: { color?: string; className?: string }) {
  return (
    <svg className={`drip ${className}`} viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden>
      <path
        fill={color}
        d="M0 0h1440v22c-40 0-46 30-80 30s-34-30-74-30-38 44-76 44-30-44-70-44-44 24-86 24-40-24-82-24-34 38-72 38-36-38-78-38-40 18-80 18-42-18-84-18-40 40-80 40-40-40-80-40-44 26-84 26-38-26-80-26-36 34-76 34S106 22 66 22 20 40 0 40z"
      />
    </svg>
  );
}

/** Sello circular "Hechos artesanalmente". */
export function ArtisanStamp({ className = '' }: { className?: string }) {
  return (
    <svg className={`stamp ${className}`} viewBox="0 0 160 160" role="img" aria-label="Hechos artesanalmente en Bogotá">
      <defs>
        <path id="stamp-circle" d="M80 80m-60 0a60 60 0 1 1 120 0a60 60 0 1 1-120 0" />
      </defs>
      <circle cx="80" cy="80" r="78" fill="var(--espresso)" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="var(--caramelo)" strokeWidth="1.2" strokeDasharray="2 4" />
      <g className="stamp__ring">
        <text fontFamily="var(--font-ui)" fontSize="12.5" fontWeight="700" letterSpacing="3.2" fill="var(--crema)">
          <textPath href="#stamp-circle">HECHOS ARTESANALMENTE · BOGOTÁ ·</textPath>
        </text>
      </g>
      <text x="80" y="78" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="26" fill="var(--caramelo)">
        JEM
      </text>
      <text x="80" y="98" textAnchor="middle" fontFamily="var(--font-ui)" fontSize="9.5" fontWeight="700" letterSpacing="2" fill="var(--avena)">
        ENTRE CLASES
      </text>
    </svg>
  );
}
