import { useState } from 'react';
import type { FlavorId } from '../../data/types';

/** Wordmark tipográfico provisional de Brownies JEM. */
export function Wordmark({ tone = 'dark', compact = false }: { tone?: 'dark' | 'light'; compact?: boolean }) {
  return (
    <span className={`wordmark wordmark--${tone}${compact ? ' wordmark--compact' : ''}`}>
      <span className="wordmark__seal" aria-hidden>
        <svg viewBox="0 0 40 40">
          <rect x="1" y="1" width="38" height="38" rx="11" fill="currentColor" />
          <path d="M8 15h24v14a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="var(--seal-body)" />
          <path d="M8 15h24v3.5c-2.6 0-2.6 3.4-5.3 3.4S24 18.5 21.4 18.5s-2.7 4.6-5.4 4.6-2.6-4.6-5.3-4.6S8 20 8 20z" fill="var(--caramelo)" />
        </svg>
      </span>
      <span className="wordmark__text">
        <span className="wordmark__brownies">Brownies</span>
        <span className="wordmark__jem">JEM</span>
      </span>
    </span>
  );
}

/**
 * Ilustración vectorial de respaldo cuando una fotografía no carga.
 * Cada sabor tiene detalles propios (galleta, capa de manjar o corteza).
 */
export function BrownieIllustration({ flavor }: { flavor: FlavorId }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="300" fill="#F2E4D2" />
      <ellipse cx="200" cy="232" rx="150" ry="34" fill="#E6D5C1" />
      <ellipse cx="200" cy="222" rx="128" ry="24" fill="#FFFCF7" stroke="#CDB59B" />
      <path d="M110 120 L290 120 L300 212 Q200 228 100 212 Z" fill="#4A2E24" />
      <path d="M110 120 L290 120 L280 104 Q200 92 120 104 Z" fill="#65402F" />
      {flavor === 'manjar' && <path d="M104 168 Q200 182 296 168 L298 184 Q200 198 102 184 Z" fill="#C56C3D" />}
      {flavor === 'clasico' && (
        <path d="M130 108 l20 6 l18 -5 M190 104 l14 8 l22 -6 M240 106 l18 6" stroke="#8A5A3C" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {flavor === 'oreo' && (
        <g>
          <circle cx="160" cy="104" r="20" fill="#24282C" />
          <circle cx="160" cy="104" r="14" fill="none" stroke="#3A4045" strokeWidth="2" />
          <circle cx="236" cy="106" r="17" fill="#24282C" />
          <path d="M150 150 l10 4 M220 160 l12 -3 M180 190 l10 2" stroke="#F5EFE6" strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

interface ProductImageProps {
  src: string;
  alt: string;
  flavor: FlavorId;
  className?: string;
  eager?: boolean;
}

export function ProductImage({ src, alt, flavor, className = '', eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`product-img ${className}`}>
      {failed ? (
        <>
          <BrownieIllustration flavor={flavor} />
          <span className="sr-only">{alt}</span>
        </>
      ) : (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
