import { AnimatePresence, motion } from 'motion/react';
import { Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, StatusBadge } from '../../components/ui/Bits';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PRODUCT_BY_ID, SLOT_BY_ID } from '../../data/products';
import type { Order } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { formatCOP, formatDateTime } from '../../utils/format';
import { isActive, orderUnits } from '../../utils/metrics';

const STATUS_TEXT: Record<Order['status'], string> = {
  pendiente: 'Esperando confirmación del equipo JEM.',
  confirmado: 'Confirmado. Te esperamos en la franja elegida.',
  entregado: 'Entregado. ¡Que lo disfrutes!',
  cancelado: 'Reserva cancelada. Las unidades volvieron al inventario.',
};

export function MyReservations() {
  const orders = useJemStore((s) => s.data.orders);
  const cancelOrder = useJemStore((s) => s.cancelOrder);
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const mine = orders.filter((o) => o.origin === 'tienda');

  return (
    <section className="container reservations" aria-labelledby="res-title">
      <header className="section-head section-head--left">
        <span className="eyebrow">Mis reservas</span>
        <h1 id="res-title">Tus antojos reservados</h1>
        <p className="muted">
          Aquí aparecen las reservas que has hecho. El estado cambia cuando el equipo JEM las confirma
          o entrega.
        </p>
      </header>

      {mine.length === 0 ? (
        <div className="checkout__panel">
          <EmptyState
            title="Todavía no tienes reservas"
            action={
              <Link to="/" state={{ scrollTo: 'sabores' }} className="btn">
                Reservar un brownie
              </Link>
            }
          >
            Cuando reserves, podrás seguir su estado desde aquí.
          </EmptyState>
        </div>
      ) : (
        <ul className="res-list">
          <AnimatePresence initial={false}>
            {mine.map((o) => (
              <motion.li key={o.id} layout className={`res-card res-card--${o.status}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="res-card__head">
                  <div>
                    <p className="res-card__id">{o.id}</p>
                    <p className="muted res-card__date">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <ul className="res-card__items">
                  {o.items.map((i) => (
                    <li key={i.flavor}>
                      <span>
                        {i.qty} × {PRODUCT_BY_ID[i.flavor].name}
                      </span>
                      <span>{formatCOP(i.qty * PRODUCT_BY_ID[i.flavor].price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="res-card__meta">
                  <span>
                    <Clock size={16} aria-hidden /> {SLOT_BY_ID[o.slot].label}
                  </span>
                  <span>
                    <MapPin size={16} aria-hidden /> Punto por confirmar
                  </span>
                </div>
                <p className="res-card__status">{STATUS_TEXT[o.status]}</p>
                <div className="res-card__foot">
                  <p>
                    <span className="muted">{orderUnits(o)} brownies · </span>
                    <strong>{formatCOP(o.total)}</strong>
                  </p>
                  {isActive(o) && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setToCancel(o)}>
                      Cancelar reserva
                    </button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ConfirmDialog
        open={!!toCancel}
        title={`¿Cancelar la reserva ${toCancel?.id ?? ''}?`}
        description="Las unidades que apartaste volverán a estar disponibles para otras personas. Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        cancelLabel="Mantener reserva"
        tone="danger"
        onCancel={() => setToCancel(null)}
        onConfirm={() => {
          if (!toCancel) return;
          const r = cancelOrder(toCancel.id, 'cliente');
          if (r.ok) toast.success('Reserva cancelada', 'Las unidades volvieron al inventario.');
          else toast.error('No se pudo cancelar', r.message);
          setToCancel(null);
        }}
      />
    </section>
  );
}
