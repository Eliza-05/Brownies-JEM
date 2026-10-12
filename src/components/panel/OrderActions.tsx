import { Ban, Check, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import type { Order } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { formatCOP } from '../../utils/format';
import { ConfirmDialog } from '../ui/Modal';

/** Acciones válidas según el estado: Pendiente → Confirmado → Entregado; Pendiente/Confirmado → Cancelado. */
export function OrderActions({ order, compact = false }: { order: Order; compact?: boolean }) {
  const confirmOrder = useJemStore((s) => s.confirmOrder);
  const deliverOrder = useJemStore((s) => s.deliverOrder);
  const cancelOrder = useJemStore((s) => s.cancelOrder);
  const [askCancel, setAskCancel] = useState(false);

  const run = (fn: () => { ok: boolean; message: string }, success: string, detail?: string) => {
    const r = fn();
    if (r.ok) toast.success(success, detail);
    else toast.error('Acción no permitida', r.message);
  };

  if (order.status === 'entregado' || order.status === 'cancelado') {
    return <span className="muted order-actions__done">{order.status === 'entregado' ? 'Venta registrada' : 'Sin acciones'}</span>;
  }

  return (
    <div className={`order-actions${compact ? ' order-actions--compact' : ''}`}>
      {order.status === 'pendiente' && (
        <button type="button" className="btn btn--sm" onClick={() => run(() => confirmOrder(order.id), `Pedido ${order.id} confirmado`)}>
          <Check size={16} aria-hidden />
          Confirmar<span className="sr-only"> pedido {order.id}</span>
        </button>
      )}
      {order.status === 'confirmado' && (
        <button
          type="button"
          className="btn btn--dark btn--sm"
          onClick={() => run(() => deliverOrder(order.id), `Pedido ${order.id} entregado`, `Ingreso registrado: ${formatCOP(order.total)}`)}
        >
          <PackageCheck size={16} aria-hidden />
          Entregar<span className="sr-only"> pedido {order.id}</span>
        </button>
      )}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAskCancel(true)} aria-label={`Cancelar pedido ${order.id}`}>
        <Ban size={16} aria-hidden />
        {!compact && 'Cancelar'}
      </button>
      <ConfirmDialog
        open={askCancel}
        title={`¿Cancelar el pedido ${order.id}?`}
        description={`Las unidades reservadas por ${order.customer} volverán al inventario disponible. No se contará como venta.`}
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        tone="danger"
        onCancel={() => setAskCancel(false)}
        onConfirm={() => {
          setAskCancel(false);
          run(() => cancelOrder(order.id, 'equipo'), `Pedido ${order.id} cancelado`, 'Las unidades volvieron al inventario.');
        }}
      />
    </div>
  );
}
