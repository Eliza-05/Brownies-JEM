import { useReducedMotion } from 'motion/react';
import { Table2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';

/** Tokens de gráfico: tinta para texto, grilla recesiva. */
export const INK = '#30201B';
export const INK_MUTED = '#76675D';
export const GRID = '#E6D5C1';
export const SERIES_SOLD = '#65402F';
export const SERIES_AVAILABLE = '#D8973C';

export interface TableSpec {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Resumen textual para lectores de pantalla. */
  summary: string;
  table: TableSpec;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

/** Contenedor de gráfico con resumen accesible y vista de tabla alternativa. */
export function ChartCard({ title, subtitle, summary, table, children, className = '', action }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const id = useId();
  return (
    <figure className={`chart-card ${className}`} aria-labelledby={`${id}-t`}>
      <div className="chart-card__head">
        <div>
          <h3 id={`${id}-t`}>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="chart-card__tools">
          {action}
          <button
            type="button"
            className={`chip-btn${showTable ? ' is-on' : ''}`}
            aria-pressed={showTable}
            onClick={() => setShowTable((v) => !v)}
          >
            <Table2 size={15} aria-hidden />
            {showTable ? 'Ver gráfico' : 'Ver tabla'}
          </button>
        </div>
      </div>
      {showTable ? (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-card__plot" aria-hidden>
          {children}
        </div>
      )}
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

export function ChartTooltip({ active, payload, label, format }: TooltipProps<number, string> & { format?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      {label !== undefined && <p className="chart-tip__label">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey) + p.name} className="chart-tip__row">
          <i style={{ background: (p.payload?.fill as string) ?? p.color }} aria-hidden />
          <span>{p.name}</span>
          <strong>{format ? format(Number(p.value)) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

const axisProps = {
  tick: { fill: INK_MUTED, fontSize: 13 },
  axisLine: { stroke: GRID },
  tickLine: false,
};

/**
 * La animación interna de Recharts oculta las etiquetas hasta que termina y,
 * en modo estricto, a veces no termina. Las barras crecen con CSS (ver panel.css)
 * y aquí solo se anima el anillo.
 */
export function useAnimate() {
  return !useReducedMotion();
}

interface SimpleBarsProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  colorKey?: string;
  format?: (v: number) => string;
  height?: number;
  horizontal?: boolean;
  showLabels?: boolean;
}

/** Barras de una sola serie (verticales u horizontales) con etiquetas directas selectivas. */
export function SimpleBars({ data, xKey, yKey, name, color = SERIES_SOLD, colorKey, format, height = 260, horizontal, showLabels = true }: SimpleBarsProps) {
  const fmt = format ?? ((v: number) => String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart className={horizontal ? 'bars-h' : 'bars-v'} data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 22, right: horizontal ? 64 : 8, left: horizontal ? 8 : -8, bottom: 0 }} barCategoryGap={horizontal ? '28%' : '22%'}>
        <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={(v) => (format ? compact(v) : v)} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={78} tick={{ fill: INK, fontSize: 14, fontWeight: 600 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} interval={data.length > 8 ? 1 : 0} />
            <YAxis {...axisProps} allowDecimals={false} tickFormatter={(v) => (format ? compact(v) : v)} width={format ? 74 : 44} />
          </>
        )}
        <Tooltip cursor={{ fill: 'rgba(101,64,47,0.07)' }} content={<ChartTooltip format={fmt} />} />
        <Bar dataKey={yKey} name={name} fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false} stroke="#FFFCF7" strokeWidth={2}>
          {colorKey && data.map((d, i) => <Cell key={i} fill={String(d[colorKey])} />)}
          {showLabels && (
            <LabelList dataKey={yKey} position={horizontal ? 'right' : 'top'} formatter={(v: number) => (v ? fmt(v) : '')} fill={INK} fontSize={13} fontWeight={600} />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barras agrupadas: dos medidas por categoría (p. ej. disponible vs. vendido). */
export function GroupedBars({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart className="bars-v" data={data} margin={{ top: 22, right: 8, left: -8, bottom: 0 }} barGap={4} barCategoryGap="26%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={52} />
        <Tooltip cursor={{ fill: 'rgba(101,64,47,0.07)' }} content={<ChartTooltip />} />
        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13, top: -4 }} formatter={(value) => <span style={{ color: INK }}>{value}</span>} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} isAnimationActive={false} stroke="#FFFCF7" strokeWidth={2}>
            <LabelList dataKey={s.key} position="top" fill={INK} fontSize={12} fontWeight={600} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Anillo de distribución con total al centro y leyenda con etiquetas. */
export function Donut({ data, centerLabel, height = 240 }: { data: { name: string; value: number; color: string }[]; centerLabel: string; height?: number }) {
  const animate = useAnimate();
  const total = data.reduce((s, d) => s + d.value, 0);
  const visible = data.filter((d) => d.value > 0);
  return (
    <div className="donut">
      <div className="donut__chart">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie data={visible.length ? visible : [{ name: 'Sin datos', value: 1, color: GRID }]} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={visible.length > 1 ? 2 : 0} stroke="#FFFCF7" strokeWidth={2} isAnimationActive={animate}>
              {(visible.length ? visible : [{ color: GRID }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut__center">
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="donut__legend">
        {data.map((d) => (
          <li key={d.name}>
            <i style={{ background: d.color }} aria-hidden />
            <span>{d.name}</span>
            <strong>{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function compact(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (v >= 1000) return `$${Math.round(v / 1000)} mil`;
  return `$${v}`;
}
