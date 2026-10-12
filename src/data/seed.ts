import { FLAVORS, SLOT_BY_ID, UNIT_PRICE } from './products';
import type {
  Activity,
  BusinessData,
  DirectSale,
  Feedback,
  FeedbackType,
  FlavorId,
  Order,
  OrderItem,
  OrderStatus,
  SlotId,
  StockMovement,
} from './types';

/**
 * Datos ficticios y deterministas para la demostración académica.
 * Las fechas se calculan relativas al momento en que se crea (o restablece)
 * la demostración, para que "Hoy" y "Últimos 7 días" siempre tengan datos.
 * No se usan números aleatorios: cada restablecimiento produce los mismos valores.
 */

/** Unidades disponibles al iniciar la demostración. */
export const INITIAL_AVAILABLE: Record<FlavorId, number> = { clasico: 24, oreo: 30, manjar: 18 };

type SeedOrder = {
  day: number;
  customer: string;
  contact: string;
  items: OrderItem[];
  slot: SlotId;
  status: OrderStatus;
  notes?: string;
};

const SEED_ORDERS: SeedOrder[] = [
  { day: -6, customer: 'Valentina R.', contact: 'Correo institucional', items: [{ flavor: 'oreo', qty: 2 }, { flavor: 'clasico', qty: 1 }], slot: 's2', status: 'entregado' },
  { day: -5, customer: 'Andrés M.', contact: 'WhatsApp', items: [{ flavor: 'clasico', qty: 2 }], slot: 's1', status: 'entregado' },
  { day: -4, customer: 'Laura P.', contact: 'WhatsApp', items: [{ flavor: 'manjar', qty: 2 }, { flavor: 'oreo', qty: 1 }], slot: 's3', status: 'entregado' },
  { day: -3, customer: 'Prof. Camilo T.', contact: 'Correo institucional', items: [{ flavor: 'oreo', qty: 3 }], slot: 's2', status: 'entregado', notes: 'Para compartir en la oficina.' },
  { day: -2, customer: 'Sofía G.', contact: 'Instagram', items: [{ flavor: 'manjar', qty: 1 }, { flavor: 'clasico', qty: 1 }], slot: 's4', status: 'entregado' },
  { day: -1, customer: 'Juan D.', contact: 'WhatsApp', items: [{ flavor: 'oreo', qty: 2 }], slot: 's2', status: 'entregado' },
  { day: -1, customer: 'Mariana L.', contact: 'Instagram', items: [{ flavor: 'clasico', qty: 1 }], slot: 's3', status: 'cancelado' },
  { day: 0, customer: 'Daniel C.', contact: 'WhatsApp', items: [{ flavor: 'clasico', qty: 2 }, { flavor: 'oreo', qty: 1 }], slot: 's1', status: 'entregado' },
  { day: 0, customer: 'Isabela V.', contact: 'Correo institucional', items: [{ flavor: 'oreo', qty: 2 }, { flavor: 'manjar', qty: 1 }], slot: 's2', status: 'confirmado' },
  { day: 0, customer: 'Tomás H.', contact: 'WhatsApp', items: [{ flavor: 'manjar', qty: 2 }], slot: 's3', status: 'pendiente', notes: 'Salgo de laboratorio a las 2:10 p. m.' },
  { day: 0, customer: 'Natalia B.', contact: 'Instagram', items: [{ flavor: 'clasico', qty: 1 }, { flavor: 'oreo', qty: 1 }], slot: 's4', status: 'pendiente' },
];

/** Ventas directas por jornada en el punto de venta: [día relativo, clásico, Oreo, manjar]. */
const SEED_DAILY_DIRECT: [number, number, number, number][] = [
  [-8, 20, 24, 13],
  [-7, 18, 27, 14],
  [-6, 21, 25, 15],
  [-5, 17, 28, 12],
  [-4, 22, 24, 16],
  [-3, 19, 26, 14],
  [-2, 21, 29, 13],
  [-1, 23, 27, 15],
];

/** Reparto fijo por franja (la de 11 a. m. – 12 m. concentra más demanda). */
const SLOT_WEIGHTS: [SlotId, number][] = [['s1', 0.25], ['s3', 0.2], ['s4', 0.15]];

function splitBySlot(day: number, flavor: FlavorId, total: number): [number, FlavorId, number, SlotId][] {
  const rows: [number, FlavorId, number, SlotId][] = [];
  let rest = total;
  for (const [slot, w] of SLOT_WEIGHTS) {
    const q = Math.round(total * w);
    rest -= q;
    if (q > 0) rows.push([day, flavor, q, slot]);
  }
  if (rest > 0) rows.push([day, flavor, rest, 's2']);
  return rows;
}

/** [día relativo, sabor, unidades, franja] — ventas directas simuladas. */
const SEED_DIRECT: [number, FlavorId, number, SlotId][] = [
  ...SEED_DAILY_DIRECT.flatMap(([day, c, o, m]) => [
    ...splitBySlot(day, 'clasico', c),
    ...splitBySlot(day, 'oreo', o),
    ...splitBySlot(day, 'manjar', m),
  ]),
  [0, 'clasico', 4, 's1'],
  [0, 'oreo', 5, 's1'],
  [0, 'manjar', 2, 's1'],
];

/** [día relativo, sabor, unidades] — sobrantes retirados al cierre. */
const SEED_WASTE: [number, FlavorId, number][] = [
  [-8, 'clasico', 2], [-6, 'manjar', 1], [-4, 'oreo', 1], [-2, 'manjar', 2], [-1, 'clasico', 1],
];

const SEED_FEEDBACK: { day: number; name?: string; type: FeedbackType; flavor: FlavorId; rating: number; message: string }[] = [
  { day: -6, name: 'Valentina R.', type: 'producto', flavor: 'oreo', rating: 5, message: 'Me encantó que la galleta se mantuviera crujiente.' },
  { day: -4, type: 'sabor', flavor: 'manjar', rating: 4, message: '¿Podrían probar una versión con arequipe y coco?' },
  { day: -3, name: 'Prof. Camilo T.', type: 'experiencia', flavor: 'oreo', rating: 5, message: 'Reservar antes de la reunión fue muy práctico.' },
  { day: -2, name: 'Sofía G.', type: 'experiencia', flavor: 'clasico', rating: 3, message: 'Me gustaría saber con más claridad dónde recoger el pedido.' },
  { day: -1, type: 'producto', flavor: 'clasico', rating: 4, message: 'Muy buen sabor, el centro estaba húmedo como me gusta.' },
];

function atDay(base: Date, day: number, hour: number, minute = 0): string {
  const d = new Date(base);
  d.setDate(d.getDate() + day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Para eventos de hoy: nunca en el futuro respecto al momento de la demo. */
function todayAt(base: Date, hour: number, minute = 0): string {
  const planned = new Date(base);
  planned.setHours(hour, minute, 0, 0);
  const latest = new Date(base.getTime() - 5 * 60_000);
  return (planned.getTime() > latest.getTime() ? latest : planned).toISOString();
}

function minus(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() - minutes * 60_000).toISOString();
}

export function buildSeed(now: Date = new Date()): BusinessData {
  let seq = 1;
  const id = (prefix: string) => `${prefix}-${seq++}`;
  const time = (day: number, hour: number, minute = 0) =>
    day === 0 ? todayAt(now, hour, minute) : atDay(now, day, hour, minute);

  const orders: Order[] = [];
  const activity: Activity[] = [];
  const log = (kind: Activity['kind'], message: string, at: string) =>
    activity.push({ id: id('act'), kind, message, at });

  let orderNumber = 1001;
  for (const s of SEED_ORDERS) {
    const slotHour = SLOT_BY_ID[s.slot].startHour;
    const createdAt = minus(time(s.day, slotHour - 2, 15), 0);
    const history: Order['history'] = [{ status: 'pendiente', at: createdAt }];
    const orderId = `JEM-${orderNumber++}`;
    log('reserva', `Reserva ${orderId} creada por ${s.customer}`, createdAt);
    if (s.status === 'confirmado' || s.status === 'entregado') {
      const at = time(s.day, slotHour - 1, 30);
      history.push({ status: 'confirmado', at });
      log('confirmacion', `Pedido ${orderId} confirmado`, at);
    }
    if (s.status === 'entregado') {
      const at = time(s.day, slotHour, 20);
      history.push({ status: 'entregado', at });
      log('entrega', `Pedido ${orderId} entregado`, at);
    }
    if (s.status === 'cancelado') {
      const at = time(s.day, slotHour - 1, 10);
      history.push({ status: 'cancelado', at });
      log('cancelacion', `Reserva ${orderId} cancelada`, at);
    }
    orders.push({
      id: orderId,
      customer: s.customer,
      contact: s.contact,
      items: s.items,
      total: s.items.reduce((sum, i) => sum + i.qty * UNIT_PRICE, 0),
      slot: s.slot,
      notes: s.notes,
      status: s.status,
      createdAt,
      origin: 'demo',
      history,
    });
  }

  const directSales: DirectSale[] = SEED_DIRECT.map(([day, flavor, qty, slot]) => ({
    id: id('vd'),
    flavor,
    qty,
    slot,
    at: time(day, SLOT_BY_ID[slot].startHour, 35),
  }));

  // Producción coherente: en días anteriores se horneó exactamente lo vendido + lo retirado.
  // Hoy se horneó lo necesario para que la disponibilidad inicial sea 24 / 30 / 18.
  const movements: StockMovement[] = [];
  const days = Array.from({ length: 9 }, (_, i) => i - 8);
  for (const day of days) {
    for (const flavor of FLAVORS) {
      const soldOrders = SEED_ORDERS.filter((o) => o.day === day && o.status === 'entregado')
        .flatMap((o) => o.items)
        .filter((i) => i.flavor === flavor)
        .reduce((s, i) => s + i.qty, 0);
      const soldDirect = SEED_DIRECT.filter(([d, f]) => d === day && f === flavor).reduce((s, [, , q]) => s + q, 0);
      const waste = SEED_WASTE.filter(([d, f]) => d === day && f === flavor).reduce((s, [, , q]) => s + q, 0);
      let produced = soldOrders + soldDirect + waste;
      if (day === 0) {
        const reserved = SEED_ORDERS.filter((o) => o.day === 0 && (o.status === 'pendiente' || o.status === 'confirmado'))
          .flatMap((o) => o.items)
          .filter((i) => i.flavor === flavor)
          .reduce((s, i) => s + i.qty, 0);
        produced += INITIAL_AVAILABLE[flavor] + reserved;
      }
      if (produced > 0) {
        const at = time(day, 6, 30);
        movements.push({ id: id('mov'), flavor, type: 'produccion', qty: produced, at, note: 'Tanda del día' });
      }
      if (waste > 0) {
        movements.push({ id: id('mov'), flavor, type: 'no_apto', qty: waste, at: time(day, 17, 0), note: 'Sobrante al cierre de la jornada' });
      }
    }
  }
  log('inventario', 'Tanda del día registrada: 24 clásicos, 30 Oreo y 18 de manjar disponibles', time(0, 6, 30));

  const feedback: Feedback[] = SEED_FEEDBACK.map((f) => {
    const at = time(f.day, 16, 10);
    log('sugerencia', `Nueva opinión: ${f.rating}/5`, at);
    return { id: id('op'), name: f.name, type: f.type, flavor: f.flavor, rating: f.rating, message: f.message, at, origin: 'demo' };
  });

  activity.sort((a, b) => b.at.localeCompare(a.at));

  return {
    orders,
    movements,
    directSales,
    feedback,
    activity: activity.slice(0, 40),
    nextOrderNumber: orderNumber,
    seq,
    seededAt: now.toISOString(),
  };
}
