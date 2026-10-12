import { MessageSquareText, Sparkles, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FlavorDot, PanelHeader, StatCard } from '../../components/panel/PanelBits';
import { EmptyState, Stars } from '../../components/ui/Bits';
import { FEEDBACK_TYPE_LABEL, PRODUCT_BY_ID } from '../../data/products';
import type { FeedbackType } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { formatDateTime, formatNumber } from '../../utils/format';

const TYPES: (FeedbackType | 'todos')[] = ['todos', 'producto', 'sabor', 'experiencia', 'otro'];

export function FeedbackPage() {
  const feedback = useJemStore((s) => s.data.feedback);
  const [type, setType] = useState<FeedbackType | 'todos'>('todos');
  const list = useMemo(
    () => [...feedback].sort((a, b) => b.at.localeCompare(a.at)).filter((f) => type === 'todos' || f.type === type),
    [feedback, type],
  );
  const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;
  const newFlavors = feedback.filter((f) => f.type === 'sabor').length;
  const fromStore = feedback.filter((f) => f.origin === 'tienda').length;

  return (
    <>
      <PanelHeader eyebrow="Opiniones" title="Lo que nos cuentan" subtitle="Sugerencias y calificaciones enviadas desde la tienda." />

      <div className="stats-grid stats-grid--3">
        <StatCard label="Calificación promedio" value={feedback.length ? formatNumber(avg) : '—'} hint={<Stars value={avg} />} icon={Star} tone="dark" />
        <StatCard label="Comentarios" value={feedback.length} hint={`${fromStore} enviados en esta sesión`} icon={MessageSquareText} />
        <StatCard label="Ideas de nuevos sabores" value={newFlavors} hint="Tipo «Nuevo sabor»" icon={Sparkles} tone="caramel" />
      </div>

      <div className="filter-chips" role="group" aria-label="Filtrar por tipo de comentario">
        {TYPES.map((t) => (
          <button key={t} type="button" className={`chip-btn${type === t ? ' is-on' : ''}`} aria-pressed={type === t} onClick={() => setType(t)}>
            {t === 'todos' ? 'Todos' : FEEDBACK_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Sin comentarios de este tipo">Cuando lleguen, aparecerán aquí.</EmptyState>
      ) : (
        <ul className="notes-wall">
          {list.map((f) => (
            <li key={f.id} className={`note-card${f.origin === 'tienda' ? ' is-new' : ''}`}>
              <div className="note-card__top">
                <Stars value={f.rating} />
                <span className="badge badge--neutral">{FEEDBACK_TYPE_LABEL[f.type]}</span>
              </div>
              <blockquote>{f.message}</blockquote>
              <div className="note-card__meta">
                <span>
                  <strong>{f.name ?? 'Anónimo'}</strong> · <FlavorDot color={PRODUCT_BY_ID[f.flavor].color} /> Favorito: {PRODUCT_BY_ID[f.flavor].shortName}
                </span>
                <span className="muted">{formatDateTime(f.at)}</span>
              </div>
              <p className="note-card__origin">{f.origin === 'tienda' ? 'Recibido desde la tienda' : 'Comentario de cliente'}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
