import { Clock, Cookie, Lightbulb, Star, TriangleAlert, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChartCard, Donut, GroupedBars, SERIES_AVAILABLE, SERIES_SOLD, SimpleBars } from '../../components/charts/Charts';
import { PanelHeader, StatCard } from '../../components/panel/PanelBits';
import { FLAVORS, PRODUCT_BY_ID, SLOT_BY_ID, STATUS_COLOR, STATUS_LABEL } from '../../data/products';
import { useJemStore } from '../../store/useJemStore';
import { formatCOP, formatNumber, shortDayLabel } from '../../utils/format';
import { allStock, computeStats, lowStockFlavors, RANGE_LABEL, type Range } from '../../utils/metrics';

const RANGES: Range[] = ['hoy', '7d', 'todo'];

export function Statistics() {
  const data = useJemStore((s) => s.data);
  const [range, setRange] = useState<Range>('7d');
  const stats = useMemo(() => computeStats(data, range), [data, range]);
  const stock = useMemo(() => allStock(data), [data]);
  const low = useMemo(() => lowStockFlavors(data), [data]);

  const byFlavor = FLAVORS.map((f) => ({ sabor: PRODUCT_BY_ID[f].shortName, unidades: stats.unitsByFlavor[f], color: PRODUCT_BY_ID[f].color }));
  const byDay = stats.revenueByDay.map((d) => ({ dia: shortDayLabel(d.key), ingresos: d.revenue }));
  const bySlot = stats.reservationsBySlot.map((s) => ({ franja: s.label, reservas: s.reservas }));
  const byStatus = stats.ordersByStatus.map((s) => ({ name: STATUS_LABEL[s.status], value: s.count, color: STATUS_COLOR[s.status] }));
  const stockVsSold = FLAVORS.map((f) => ({ sabor: PRODUCT_BY_ID[f].shortName, disponible: stock[f].available, vendido: stats.unitsByFlavor[f] }));
  const ratings = stats.ratings.map((r) => ({ estrellas: `${r.rating} ★`, opiniones: r.count }));

  const findings = useMemo(() => {
    const list: { icon: typeof Cookie; text: string }[] = [];
    if (stats.topFlavor) {
      const share = Math.round((stats.unitsByFlavor[stats.topFlavor] / stats.units) * 100);
      list.push({
        icon: Cookie,
        text: `${PRODUCT_BY_ID[stats.topFlavor].name} es el sabor con mayor demanda: ${stats.unitsByFlavor[stats.topFlavor]} de ${stats.units} unidades vendidas (${share} %).`,
      });
    } else {
      list.push({ icon: Cookie, text: 'Todavía no hay ventas registradas en este periodo.' });
    }
    if (stats.topSlot) {
      const s = stats.reservationsBySlot.find((x) => x.slot === stats.topSlot)!;
      list.push({ icon: Clock, text: `La franja más solicitada para recoger es ${SLOT_BY_ID[stats.topSlot].label}, con ${s.reservas} ${s.reservas === 1 ? 'reserva' : 'reservas'}.` });
    } else {
      list.push({ icon: Clock, text: 'No hay reservas activas o entregadas en este periodo para comparar franjas.' });
    }
    if (low.length) {
      list.push({
        icon: TriangleAlert,
        text: `Pocas existencias de ${low.map((f) => `${PRODUCT_BY_ID[f].shortName} (${stock[f].available})`).join(' y ')}. Conviene revisarlo en Planificación.`,
      });
    } else {
      const minF = FLAVORS.reduce((a, b) => (stock[b].available < stock[a].available ? b : a));
      list.push({ icon: TriangleAlert, text: `Ningún sabor está en nivel crítico. El de menor disponibilidad es ${PRODUCT_BY_ID[minF].shortName}, con ${stock[minF].available} unidades.` });
    }
    if (stats.avgRating) {
      list.push({ icon: Star, text: `La calificación promedio es ${formatNumber(stats.avgRating)} de 5, con ${stats.feedbackCount} ${stats.feedbackCount === 1 ? 'opinión' : 'opiniones'}.` });
    }
    return list;
  }, [stats, low, stock]);

  return (
    <>
      <PanelHeader eyebrow="Estadísticas" title="Cómo se mueven los brownies" subtitle="Todas las cifras salen de los mismos pedidos, ventas e inventario del sistema.">
        <div className="segmented" role="group" aria-label="Periodo">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </PanelHeader>

      <p className="sr-only" aria-live="polite">
        Mostrando: {RANGE_LABEL[range]}
      </p>

      <div className="stats-grid stats-grid--4">
        <StatCard label="Ingresos" value={formatCOP(stats.revenue)} hint={RANGE_LABEL[range]} icon={TrendingUp} tone="dark" />
        <StatCard label="Unidades vendidas" value={stats.units} hint="Entregas + ventas directas" icon={Cookie} />
        <StatCard label="Reservas registradas" value={stats.orderCount} hint="Todos los estados" icon={Clock} />
        <StatCard label="Calificación" value={stats.avgRating ? formatNumber(stats.avgRating) : '—'} hint={`${stats.feedbackCount} opiniones`} icon={Star} />
      </div>

      <section className="findings" aria-labelledby="findings-title">
        <h2 id="findings-title">
          <Lightbulb size={22} aria-hidden /> Lo que nos dicen los datos.
        </h2>
        <ul>
          {findings.map((f, i) => (
            <li key={i}>
              <f.icon size={18} aria-hidden />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="charts-grid">
        <ChartCard
          title="Ventas por sabor"
          subtitle="Unidades vendidas"
          summary={byFlavor.map((b) => `${b.sabor}: ${b.unidades}`).join('; ')}
          table={{ columns: ['Sabor', 'Unidades'], rows: byFlavor.map((b) => [b.sabor, b.unidades]) }}
        >
          <SimpleBars data={byFlavor} xKey="sabor" yKey="unidades" name="Unidades" colorKey="color" horizontal height={240} />
        </ChartCard>

        <ChartCard
          title="Ingresos por día"
          subtitle="Pedidos entregados + ventas directas"
          summary={byDay.map((d) => `${d.dia}: ${formatCOP(d.ingresos)}`).join('; ')}
          table={{ columns: ['Día', 'Ingresos'], rows: byDay.map((d) => [d.dia, formatCOP(d.ingresos)]) }}
        >
          <SimpleBars data={byDay} xKey="dia" yKey="ingresos" name="Ingresos" format={formatCOP} height={240} showLabels={false} />
        </ChartCard>

        <ChartCard
          title="Reservas por franja horaria"
          subtitle="Sin contar cancelaciones"
          summary={bySlot.map((s) => `${s.franja}: ${s.reservas}`).join('; ')}
          table={{ columns: ['Franja', 'Reservas'], rows: bySlot.map((s) => [s.franja, s.reservas]) }}
        >
          <SimpleBars data={bySlot} xKey="franja" yKey="reservas" name="Reservas" height={240} />
        </ChartCard>

        <ChartCard
          title="Pedidos por estado"
          subtitle="Distribución de reservas"
          summary={byStatus.map((s) => `${s.name}: ${s.value}`).join('; ')}
          table={{ columns: ['Estado', 'Pedidos'], rows: byStatus.map((s) => [s.name, s.value]) }}
        >
          <Donut data={byStatus} centerLabel="pedidos" />
        </ChartCard>

        <ChartCard
          title="Disponibles y vendidas"
          subtitle="Existencias actuales vs. vendidas en el periodo"
          summary={stockVsSold.map((s) => `${s.sabor}: ${s.disponible} disponibles, ${s.vendido} vendidas`).join('; ')}
          table={{ columns: ['Sabor', 'Disponibles', 'Vendidas'], rows: stockVsSold.map((s) => [s.sabor, s.disponible, s.vendido]) }}
        >
          <GroupedBars
            data={stockVsSold}
            xKey="sabor"
            series={[
              { key: 'disponible', name: 'Disponibles', color: SERIES_AVAILABLE },
              { key: 'vendido', name: 'Vendidas', color: SERIES_SOLD },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Calificaciones de clientes"
          subtitle="Número de opiniones por puntaje"
          summary={ratings.map((r) => `${r.estrellas}: ${r.opiniones}`).join('; ')}
          table={{ columns: ['Puntaje', 'Opiniones'], rows: ratings.map((r) => [r.estrellas, r.opiniones]) }}
        >
          <SimpleBars data={ratings} xKey="estrellas" yKey="opiniones" name="Opiniones" color="#C56C3D" height={240} />
        </ChartCard>
      </div>
    </>
  );
}
