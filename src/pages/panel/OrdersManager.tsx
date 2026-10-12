import { Eye, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OrderActions } from '../../components/panel/OrderActions';
import { Card, PanelHeader } from '../../components/panel/PanelBits';
import { EmptyState, StatusBadge } from '../../components/ui/Bits';
import { Modal } from '../../components/ui/Modal';
import { PRODUCT_BY_ID, SLOTS, SLOT_BY_ID, STATUS_LABEL } from '../../data/products';
import type { OrderStatus, SlotId } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { formatCOP, formatDateTime } from '../../utils/format';
import { orderUnits } from '../../utils/metrics';

const FILTERS: (OrderStatus | 'todos')[] = ['todos', 'pendiente', 'confirmado', 'entregado', 'cancelado'];

export function OrdersManager() {
  const orders = useJemStore((s) => s.data.orders);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'todos'>('todos');
  const [slot, setSlot] = useState<SlotId | 'todas'>('todas');
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = orders.find((o) => o.id === detailId) ?? null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((o) => (status === 'todos' ? true : o.status === status))
      .filter((o) => (slot === 'todas' ? true : o.slot === slot))
      .filter((o) =>
        !q
          ? true
          : o.id.toLowerCase().includes(q) ||
            o.customer.toLowerCase().includes(q) ||
            o.items.some((i) => PRODUCT_BY_ID[i.flavor].name.toLowerCase().includes(q)),
      );
  }, [orders, query, status, slot]);

  return (
    <>
      <PanelHeader eyebrow="Pedidos" title="Reservas y entregas" subtitle="Confirma, entrega o cancela. Cada cambio actualiza el inventario y las ventas." />

      <Card>
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <label htmlFor="order-search" className="sr-only">
              Buscar pedidos
            </label>
            <input
              id="order-search"
              type="search"
              className="input"
              placeholder="Buscar por ID, cliente o sabor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="field field--inline">
            <label htmlFor="slot-filter">Franja</label>
            <select id="slot-filter" className="select" value={slot} onChange={(e) => setSlot(e.target.value as SlotId | 'todas')}>
              <option value="todas">Todas</option>
              {SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-chips" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`chip-btn${status === f ? ' is-on' : ''}`} aria-pressed={status === f} onClick={() => setStatus(f)}>
              {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
              <span className="chip-btn__count">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {filtered.length} pedidos mostrados
        </p>

        {filtered.length === 0 ? (
          <EmptyState title="Sin resultados">Prueba con otra búsqueda o cambia los filtros.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="orders-table">
              <caption className="sr-only">Pedidos de Brownies JEM</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Productos</th>
                  <th scope="col" className="num">
                    Cant.
                  </th>
                  <th scope="col" className="num">
                    Total
                  </th>
                  <th scope="col">Franja</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className={o.origin === 'tienda' ? 'is-new' : undefined}>
                    <th scope="row" data-label="ID">
                      <button type="button" className="link-btn" onClick={() => setDetailId(o.id)}>
                        {o.id}
                      </button>
                    </th>
                    <td data-label="Cliente">
                      {o.customer}
                      {o.origin === 'tienda' && <span className="badge badge--neutral orders-table__tag">Tienda</span>}
                    </td>
                    <td data-label="Productos">{o.items.map((i) => `${i.qty} ${PRODUCT_BY_ID[i.flavor].shortName}`).join(', ')}</td>
                    <td data-label="Cantidad" className="num">
                      {orderUnits(o)}
                    </td>
                    <td data-label="Total" className="num">
                      {formatCOP(o.total)}
                    </td>
                    <td data-label="Franja">{SLOT_BY_ID[o.slot].short}</td>
                    <td data-label="Estado">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="orders-table__actions">
                      <button type="button" className="icon-btn icon-btn--quiet" onClick={() => setDetailId(o.id)} aria-label={`Ver detalle de ${o.id}`}>
                        <Eye size={18} aria-hidden />
                      </button>
                      <OrderActions order={o} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} eyebrow="Detalle del pedido" title={detail ? `${detail.id} · ${detail.customer}` : ''} wide>
        {detail && (
          <div className="order-detail">
            <div className="order-detail__row">
              <StatusBadge status={detail.status} />
              <span className="muted">Creado {formatDateTime(detail.createdAt)}</span>
            </div>
            <dl className="order-detail__facts">
              <div>
                <dt>Contacto</dt>
                <dd>{detail.contact}</dd>
              </div>
              <div>
                <dt>Franja</dt>
                <dd>{SLOT_BY_ID[detail.slot].label}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatCOP(detail.total)}</dd>
              </div>
              <div>
                <dt>Origen</dt>
                <dd>{detail.origin === 'tienda' ? 'Reserva desde la tienda' : 'Reserva directa'}</dd>
              </div>
            </dl>
            <ul className="order-detail__items">
              {detail.items.map((i) => (
                <li key={i.flavor}>
                  <span>
                    {i.qty} × {PRODUCT_BY_ID[i.flavor].name}
                  </span>
                  <span>{formatCOP(i.qty * PRODUCT_BY_ID[i.flavor].price)}</span>
                </li>
              ))}
            </ul>
            {detail.notes && (
              <p className="order-detail__notes">
                <strong>Observaciones:</strong> {detail.notes}
              </p>
            )}
            <h3 className="order-detail__h">Historial</h3>
            <ol className="timeline">
              {detail.history.map((h, i) => (
                <li key={i}>
                  <StatusBadge status={h.status} />
                  <span className="muted">{formatDateTime(h.at)}</span>
                </li>
              ))}
            </ol>
            <div className="modal__actions">
              <OrderActions order={detail} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
