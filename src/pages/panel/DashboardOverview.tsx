import { motion } from 'motion/react';
import {
  ArrowRight,
  Ban,
  Boxes,
  Check,
  CircleDollarSign,
  ClipboardList,
  Cookie,
  Hourglass,
  MessageSquareText,
  PackageCheck,
  RotateCcw,
  Star,
  Store,
  TrendingUp,
  Wheat,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChartCard, SimpleBars } from '../../components/charts/Charts';
import { OrderActions } from '../../components/panel/OrderActions';
import { Card, PanelHeader, StatCard } from '../../components/panel/PanelBits';
import { EmptyState, StatusBadge } from '../../components/ui/Bits';
import { FLAVORS, PRODUCT_BY_ID, SLOT_BY_ID } from '../../data/products';
import type { ActivityKind } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { formatCOP, formatNumber, formatRelative, shortDayLabel } from '../../utils/format';
import { allStock, computeStats, isActive, orderUnits } from '../../utils/metrics';

const ACTIVITY_ICON: Record<ActivityKind, typeof Check> = {
  reserva: ClipboardList,
  confirmacion: Check,
  entrega: PackageCheck,
  cancelacion: Ban,
  inventario: Boxes,
  venta: Store,
  sugerencia: MessageSquareText,
  demo: RotateCcw,
};

export function DashboardOverview() {
  const data = useJemStore((s) => s.data);
  const { all, week, today, stock } = useMemo(
    () => ({ all: computeStats(data, 'todo'), week: computeStats(data, '7d'), today: computeStats(data, 'hoy'), stock: allStock(data) }),
    [data],
  );
  const pending = data.orders.filter((o) => o.status === 'pendiente').length;
  const active = data.orders.filter(isActive).sort((a, b) => a.slot.localeCompare(b.slot));
  const totalAvailable = FLAVORS.reduce((s, f) => s + stock[f].available, 0);

  const weekly = week.revenueByDay.map((d) => ({ dia: shortDayLabel(d.key), ingresos: d.revenue }));
  const prefs = FLAVORS.map((f) => ({ sabor: PRODUCT_BY_ID[f].shortName, unidades: all.unitsByFlavor[f], color: PRODUCT_BY_ID[f].color }));

  return (
    <>
      <PanelHeader eyebrow="Resumen" title="Hola, equipo JEM" subtitle="Así va el negocio hoy." />

      <div className="stats-grid">
        <StatCard
          label="Ingresos por ventas entregadas"
          value={formatCOP(all.revenue)}
          hint={<>Hoy: {formatCOP(today.revenue)}</>}
          icon={CircleDollarSign}
          tone="dark"
        />
        <StatCard label="Unidades vendidas" value={all.units} hint={<>Hoy: {today.units}</>} icon={TrendingUp} />
        <StatCard label="Reservas pendientes" value={pending} hint="Por confirmar" icon={Hourglass} tone="caramel" />
        <StatCard
          label="Sabor más vendido"
          value={all.topFlavor ? PRODUCT_BY_ID[all.topFlavor].shortName : '—'}
          hint={all.topFlavor ? `${all.unitsByFlavor[all.topFlavor]} unidades` : 'Aún sin ventas'}
          icon={Cookie}
        />
        <StatCard
          label="Inventario disponible"
          value={totalAvailable}
          hint={FLAVORS.map((f) => `${PRODUCT_BY_ID[f].shortName} ${stock[f].available}`).join(' · ')}
          icon={Boxes}
        />
        <StatCard
          label="Calificación promedio"
          value={all.avgRating ? formatNumber(all.avgRating) : '—'}
          hint={`${all.feedbackCount} opiniones`}
          icon={Star}
        />
      </div>
      <p className="panel-footnote">
        Los ingresos solo incluyen pedidos entregados y ventas directas registradas. Las reservas pendientes o confirmadas no
        cuentan como venta.
      </p>

      <div className="overview-grid">
        <ChartCard
          className="overview-grid__wide"
          title="Ventas de la semana"
          subtitle="Ingresos diarios de los últimos 7 días"
          summary={`Ingresos por día: ${weekly.map((w) => `${w.dia} ${formatCOP(w.ingresos)}`).join('; ')}.`}
          table={{ columns: ['Día', 'Ingresos'], rows: weekly.map((w) => [w.dia, formatCOP(w.ingresos)]) }}
        >
          <SimpleBars data={weekly} xKey="dia" yKey="ingresos" name="Ingresos" format={formatCOP} height={270} showLabels={false} />
        </ChartCard>

        <ChartCard
          title="Preferencias por sabor"
          subtitle="Unidades vendidas en todo el periodo"
          summary={prefs.map((p) => `${p.sabor}: ${p.unidades} unidades`).join('; ')}
          table={{ columns: ['Sabor', 'Unidades'], rows: prefs.map((p) => [p.sabor, p.unidades]) }}
        >
          <SimpleBars data={prefs} xKey="sabor" yKey="unidades" name="Unidades" colorKey="color" horizontal height={270} />
        </ChartCard>

        <Card
          title="Pedidos por atender"
          subtitle="Pendientes y confirmados, por franja"
          className="overview-grid__wide"
          action={
            <Link to="/panel/pedidos" className="link-btn">
              Ver todos <ArrowRight size={15} aria-hidden />
            </Link>
          }
        >
          {active.length === 0 ? (
            <EmptyState title="Todo al día">No hay reservas pendientes ni confirmadas.</EmptyState>
          ) : (
            <ul className="queue">
              {active.map((o) => (
                <motion.li key={o.id} layout className="queue__item">
                  <div className="queue__main">
                    <p>
                      <strong>{o.id}</strong> · {o.customer}
                      {o.origin === 'tienda' && <span className="badge badge--neutral queue__new">Desde la tienda</span>}
                    </p>
                    <p className="muted">
                      {o.items.map((i) => `${i.qty} ${PRODUCT_BY_ID[i.flavor].shortName}`).join(' · ')} · {SLOT_BY_ID[o.slot].short} ·{' '}
                      {orderUnits(o)} u. · {formatCOP(o.total)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <OrderActions order={o} compact />
                </motion.li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Movimientos recientes" subtitle="Registro de acciones">
          <ol className="activity">
            {data.activity.slice(0, 8).map((a) => {
              const Icon = ACTIVITY_ICON[a.kind];
              return (
                <li key={a.id} className={`activity__item activity__item--${a.kind}`}>
                  <span className="activity__icon" aria-hidden>
                    <Icon size={15} />
                  </span>
                  <span className="activity__text">{a.message}</span>
                  <time className="activity__time" dateTime={a.at}>
                    {formatRelative(a.at)}
                  </time>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <Link to="/panel/planificacion" className="plan-teaser">
        <Wheat size={22} aria-hidden />
        <span>
          <strong>Horneemos con intención.</strong> Revisa cuántas unidades sugiere el plan para la próxima tanda.
        </span>
        <ArrowRight size={18} aria-hidden />
      </Link>
    </>
  );
}
