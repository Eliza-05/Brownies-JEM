import { FLAVORS, LOW_STOCK_THRESHOLD, PRODUCT_BY_ID, SLOTS, UNIT_PRICE } from '../data/products';
import type { BusinessData, CartLine, FlavorId, Order, OrderStatus, SlotId } from '../data/types';
import { dayKey } from './format';

/**
 * Todas las cifras del sistema se derivan de los mismos registros
 * (pedidos, movimientos de inventario y ventas directas). Así no existen
 * copias independientes que puedan desincronizarse ni descuentos dobles.
 */

export interface FlavorStock {
  flavor: FlavorId;
  /** Unidades horneadas (nuevas producciones). */
  produced: number;
  /** Suma de correcciones manuales (puede ser negativa). */
  adjusted: number;
  /** Total preparado = producido + correcciones. */
  prepared: number;
  reserved: number;
  sold: number;
  wasted: number;
  available: number;
}

export const ACTIVE_STATUSES: OrderStatus[] = ['pendiente', 'confirmado'];

export function isActive(order: Order): boolean {
  return ACTIVE_STATUSES.includes(order.status);
}

export function orderUnits(order: Order): number {
  return order.items.reduce((s, i) => s + i.qty, 0);
}

export function deliveredAt(order: Order): string | undefined {
  return order.history.find((h) => h.status === 'entregado')?.at;
}

export function stockFor(data: BusinessData, flavor: FlavorId): FlavorStock {
  let produced = 0;
  let adjusted = 0;
  let wasted = 0;
  for (const m of data.movements) {
    if (m.flavor !== flavor) continue;
    if (m.type === 'produccion') produced += m.qty;
    else if (m.type === 'correccion') adjusted += m.qty;
    else wasted += m.qty;
  }
  let reserved = 0;
  let sold = 0;
  for (const o of data.orders) {
    const qty = o.items.filter((i) => i.flavor === flavor).reduce((s, i) => s + i.qty, 0);
    if (!qty) continue;
    if (isActive(o)) reserved += qty;
    else if (o.status === 'entregado') sold += qty;
  }
  for (const v of data.directSales) if (v.flavor === flavor) sold += v.qty;
  const prepared = produced + adjusted;
  return {
    flavor,
    produced,
    adjusted,
    prepared,
    reserved,
    sold,
    wasted,
    available: Math.max(0, prepared - wasted - reserved - sold),
  };
}

export function allStock(data: BusinessData): Record<FlavorId, FlavorStock> {
  return Object.fromEntries(FLAVORS.map((f) => [f, stockFor(data, f)])) as Record<FlavorId, FlavorStock>;
}

/** Valida que las líneas del carrito no superen lo disponible. */
export function cartProblems(data: BusinessData, lines: CartLine[]): string[] {
  const stock = allStock(data);
  return lines
    .filter((l) => l.qty > stock[l.flavor].available)
    .map((l) =>
      stock[l.flavor].available === 0
        ? `${PRODUCT_BY_ID[l.flavor].name} se agotó.`
        : `Solo quedan ${stock[l.flavor].available} de ${PRODUCT_BY_ID[l.flavor].name}.`,
    );
}

// ─── Ventas (solo entregas y ventas directas) ────────────────────────────

export interface SaleEvent {
  flavor: FlavorId;
  qty: number;
  amount: number;
  at: string;
  slot: SlotId;
  source: 'pedido' | 'directa';
}

export function saleEvents(data: BusinessData): SaleEvent[] {
  const events: SaleEvent[] = [];
  for (const o of data.orders) {
    if (o.status !== 'entregado') continue;
    const at = deliveredAt(o) ?? o.createdAt;
    for (const i of o.items) events.push({ flavor: i.flavor, qty: i.qty, amount: i.qty * UNIT_PRICE, at, slot: o.slot, source: 'pedido' });
  }
  for (const v of data.directSales) {
    events.push({ flavor: v.flavor, qty: v.qty, amount: v.qty * UNIT_PRICE, at: v.at, slot: v.slot, source: 'directa' });
  }
  return events;
}

// ─── Periodos ────────────────────────────────────────────────────────────

export type Range = 'hoy' | '7d' | 'todo';

export const RANGE_LABEL: Record<Range, string> = {
  hoy: 'Hoy',
  '7d': 'Últimos 7 días',
  todo: 'Periodo completo',
};

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function rangeStart(range: Range, data: BusinessData, now = new Date()): Date {
  if (range === 'hoy') return startOfDay(now);
  if (range === '7d') {
    const d = startOfDay(now);
    d.setDate(d.getDate() - 6);
    return d;
  }
  const all = [
    ...data.orders.map((o) => o.createdAt),
    ...data.directSales.map((v) => v.at),
    ...data.movements.map((m) => m.at),
  ];
  const min = all.reduce((a, b) => (a < b ? a : b), now.toISOString());
  return startOfDay(new Date(min));
}

export function inRange(iso: string, start: Date): boolean {
  return new Date(iso).getTime() >= start.getTime();
}

export function dayKeysFrom(start: Date, now = new Date()): string[] {
  const keys: string[] = [];
  const d = startOfDay(start);
  const end = startOfDay(now);
  while (d.getTime() <= end.getTime()) {
    keys.push(dayKey(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

// ─── Estadísticas agregadas ──────────────────────────────────────────────

export interface Stats {
  revenue: number;
  units: number;
  unitsByFlavor: Record<FlavorId, number>;
  revenueByDay: { key: string; revenue: number; units: number }[];
  reservationsBySlot: { slot: SlotId; label: string; reservas: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  ratings: { rating: number; count: number }[];
  avgRating: number | null;
  feedbackCount: number;
  topFlavor: FlavorId | null;
  topSlot: SlotId | null;
  orderCount: number;
}

export function computeStats(data: BusinessData, range: Range, now = new Date()): Stats {
  const start = rangeStart(range, data, now);
  const sales = saleEvents(data).filter((s) => inRange(s.at, start));

  const unitsByFlavor = { clasico: 0, oreo: 0, manjar: 0 } as Record<FlavorId, number>;
  let revenue = 0;
  let units = 0;
  for (const s of sales) {
    unitsByFlavor[s.flavor] += s.qty;
    revenue += s.amount;
    units += s.qty;
  }

  const byDay = new Map<string, { revenue: number; units: number }>();
  for (const key of dayKeysFrom(start, now)) byDay.set(key, { revenue: 0, units: 0 });
  for (const s of sales) {
    const k = dayKey(s.at);
    const cur = byDay.get(k);
    if (cur) {
      cur.revenue += s.amount;
      cur.units += s.qty;
    }
  }

  const orders = data.orders.filter((o) => inRange(o.createdAt, start));
  const reservationsBySlot = SLOTS.map((slot) => ({
    slot: slot.id,
    label: slot.short,
    reservas: orders.filter((o) => o.slot === slot.id && o.status !== 'cancelado').length,
  }));
  const ordersByStatus = (['pendiente', 'confirmado', 'entregado', 'cancelado'] as OrderStatus[]).map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const feedback = data.feedback.filter((f) => inRange(f.at, start));
  const ratings = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: feedback.filter((f) => f.rating === rating).length }));
  const avgRating = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : null;

  const topFlavor = units ? (FLAVORS.reduce((a, b) => (unitsByFlavor[b] > unitsByFlavor[a] ? b : a)) as FlavorId) : null;
  const maxSlot = reservationsBySlot.reduce((a, b) => (b.reservas > a.reservas ? b : a));
  const topSlot = maxSlot.reservas > 0 ? maxSlot.slot : null;

  return {
    revenue,
    units,
    unitsByFlavor,
    revenueByDay: [...byDay.entries()].map(([key, v]) => ({ key, ...v })),
    reservationsBySlot,
    ordersByStatus,
    ratings,
    avgRating,
    feedbackCount: feedback.length,
    topFlavor,
    topSlot,
    orderCount: orders.length,
  };
}

export function lowStockFlavors(data: BusinessData): FlavorId[] {
  const stock = allStock(data);
  return FLAVORS.filter((f) => stock[f].available <= LOW_STOCK_THRESHOLD);
}

// ─── Planificación de producción ─────────────────────────────────────────

export const PLAN_WINDOW_DAYS = 7;

export interface PlanRow {
  flavor: FlavorId;
  /** Unidades vendidas en las últimas 7 jornadas completas. */
  recentSold: number;
  avgDaily: number;
  /** Demanda observada redondeada hacia arriba. */
  expectedDemand: number;
  soldToday: number;
  pendingReservations: number;
  available: number;
  remainingToday: number;
  possibleLeftover: number;
  suggested: number;
}

/**
 * Regla transparente para la próxima tanda (sin IA, solo aritmética):
 * 1. Promedio diario = unidades vendidas en las últimas 7 jornadas completas ÷ 7.
 * 2. Demanda observada = ⌈promedio diario⌉.
 * 3. Demanda que falta hoy = máx(0, demanda observada − vendidas hoy − reservas activas).
 * 4. Posible sobrante al cierre = máx(0, disponibles − demanda que falta hoy).
 * 5. Sugerido para la próxima tanda = máx(0, demanda observada − posible sobrante).
 */
export function productionPlan(data: BusinessData, now = new Date()): PlanRow[] {
  const today = startOfDay(now);
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - PLAN_WINDOW_DAYS);
  const sales = saleEvents(data);
  const stock = allStock(data);
  return FLAVORS.map((flavor) => {
    const own = sales.filter((s) => s.flavor === flavor);
    const recentSold = own
      .filter((s) => inRange(s.at, windowStart) && !inRange(s.at, today))
      .reduce((sum, s) => sum + s.qty, 0);
    const soldToday = own.filter((s) => inRange(s.at, today)).reduce((sum, s) => sum + s.qty, 0);
    const avgDaily = recentSold / PLAN_WINDOW_DAYS;
    const expectedDemand = Math.ceil(avgDaily);
    const pendingReservations = stock[flavor].reserved;
    const available = stock[flavor].available;
    const remainingToday = Math.max(0, expectedDemand - soldToday - pendingReservations);
    const possibleLeftover = Math.max(0, available - remainingToday);
    return {
      flavor,
      recentSold,
      avgDaily,
      expectedDemand,
      soldToday,
      pendingReservations,
      available,
      remainingToday,
      possibleLeftover,
      suggested: Math.max(0, expectedDemand - possibleLeftover),
    };
  });
}

export function totalWasted(data: BusinessData, start?: Date): number {
  return data.movements
    .filter((m) => m.type === 'no_apto' && (!start || inRange(m.at, start)))
    .reduce((s, m) => s + m.qty, 0);
}
