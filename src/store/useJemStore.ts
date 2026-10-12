import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PRODUCT_BY_ID, SLOT_BY_ID, UNIT_PRICE } from '../data/products';
import { buildSeed } from '../data/seed';
import type {
  Activity,
  BusinessData,
  CartLine,
  Feedback,
  FlavorId,
  MovementType,
  Order,
  OrderStatus,
  SlotId,
} from '../data/types';
import { cartProblems, stockFor } from '../utils/metrics';
import { formatUnits } from '../utils/format';

export interface Result<T = undefined> {
  ok: boolean;
  message: string;
  value?: T;
}

export interface ReservationInput {
  customer: string;
  contact: string;
  slot: SlotId;
  notes?: string;
}

export interface FeedbackInput {
  name?: string;
  type: Feedback['type'];
  flavor: FlavorId;
  rating: number;
  message: string;
}

interface JemState {
  data: BusinessData;
  cart: CartLine[];
  planOverrides: Partial<Record<FlavorId, number>>;

  // Carrito
  addToCart: (flavor: FlavorId, qty: number) => Result;
  setCartQty: (flavor: FlavorId, qty: number) => Result;
  removeFromCart: (flavor: FlavorId) => void;
  clearCart: () => void;

  // Pedidos
  createReservation: (input: ReservationInput) => Result<Order>;
  confirmOrder: (id: string) => Result;
  deliverOrder: (id: string) => Result;
  cancelOrder: (id: string, by: 'cliente' | 'equipo') => Result;

  // Inventario y ventas
  registerProduction: (flavor: FlavorId, qty: number, note?: string) => Result;
  adjustStock: (flavor: FlavorId, delta: number, note?: string) => Result;
  registerWaste: (flavor: FlavorId, qty: number, note?: string) => Result;
  registerDirectSale: (flavor: FlavorId, qty: number, slot: SlotId) => Result;

  // Opiniones y planificación
  addFeedback: (input: FeedbackInput) => Result;
  setPlanOverride: (flavor: FlavorId, qty: number | null) => void;

  resetDemo: () => void;
}

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

function nextId(data: BusinessData, prefix: string): [string, number] {
  return [`${prefix}-${data.seq}`, data.seq + 1];
}

function withActivity(data: BusinessData, kind: Activity['kind'], message: string): BusinessData {
  const [id, seq] = nextId(data, 'act');
  const entry: Activity = { id, kind, message, at: new Date().toISOString() };
  return { ...data, seq, activity: [entry, ...data.activity].slice(0, 60) };
}

export const useJemStore = create<JemState>()(
  persist(
    (set, get) => {
      /** Cambia el estado de un pedido respetando el flujo permitido. */
      const transition = (id: string, to: OrderStatus, message: (o: Order) => string, kind: Activity['kind']): Result => {
        const { data } = get();
        const order = data.orders.find((o) => o.id === id);
        if (!order) return { ok: false, message: 'No encontramos ese pedido.' };
        if (!ALLOWED[order.status].includes(to)) {
          const reason =
            order.status === 'entregado'
              ? 'Este pedido ya fue entregado.'
              : order.status === 'cancelado'
                ? 'Este pedido está cancelado.'
                : 'Primero hay que confirmar el pedido.';
          return { ok: false, message: reason };
        }
        const at = new Date().toISOString();
        const updated: Order = { ...order, status: to, history: [...order.history, { status: to, at }] };
        const next = { ...data, orders: data.orders.map((o) => (o.id === id ? updated : o)) };
        const text = message(updated);
        set({ data: withActivity(next, kind, text) });
        return { ok: true, message: text };
      };

      const addMovement = (flavor: FlavorId, type: MovementType, qty: number, note?: string) => {
        const { data } = get();
        const [id, seq] = nextId(data, 'mov');
        const next: BusinessData = {
          ...data,
          seq,
          movements: [...data.movements, { id, flavor, type, qty, note, at: new Date().toISOString() }],
        };
        return next;
      };

      return {
        data: buildSeed(),
        cart: [],
        planOverrides: {},

        addToCart: (flavor, qty) => {
          if (!isPositiveInt(qty)) return { ok: false, message: 'Elige al menos una unidad.' };
          const { cart, data } = get();
          const current = cart.find((l) => l.flavor === flavor)?.qty ?? 0;
          const available = stockFor(data, flavor).available;
          const name = PRODUCT_BY_ID[flavor].name;
          if (available === 0) return { ok: false, message: `${name} está agotado por ahora.` };
          if (current + qty > available) {
            return {
              ok: false,
              message: `Solo hay ${formatUnits(available)} de ${name}${current ? ` y ya tienes ${current} en tu carrito` : ''}.`,
            };
          }
          set({
            cart: current
              ? cart.map((l) => (l.flavor === flavor ? { ...l, qty: l.qty + qty } : l))
              : [...cart, { flavor, qty }],
          });
          return { ok: true, message: `${qty} × ${name} en tu carrito` };
        },

        setCartQty: (flavor, qty) => {
          const { cart, data } = get();
          if (qty <= 0) {
            set({ cart: cart.filter((l) => l.flavor !== flavor) });
            return { ok: true, message: 'Producto retirado del carrito.' };
          }
          const available = stockFor(data, flavor).available;
          if (qty > available) {
            return { ok: false, message: `No hay más unidades disponibles de ${PRODUCT_BY_ID[flavor].name}.` };
          }
          set({ cart: cart.map((l) => (l.flavor === flavor ? { ...l, qty } : l)) });
          return { ok: true, message: '' };
        },

        removeFromCart: (flavor) => set({ cart: get().cart.filter((l) => l.flavor !== flavor) }),
        clearCart: () => set({ cart: [] }),

        createReservation: (input) => {
          const { cart, data } = get();
          if (!cart.length) return { ok: false, message: 'Tu carrito está vacío.' };
          if (!input.customer.trim() || !input.contact.trim()) {
            return { ok: false, message: 'Necesitamos tu nombre y un medio de contacto.' };
          }
          if (!SLOT_BY_ID[input.slot]) return { ok: false, message: 'Elige una franja de recogida.' };
          const problems = cartProblems(data, cart);
          if (problems.length) return { ok: false, message: problems.join(' ') };

          const at = new Date().toISOString();
          const order: Order = {
            id: `JEM-${data.nextOrderNumber}`,
            customer: input.customer.trim(),
            contact: input.contact.trim(),
            items: cart.map((l) => ({ ...l })),
            total: cart.reduce((s, l) => s + l.qty * UNIT_PRICE, 0),
            slot: input.slot,
            notes: input.notes?.trim() || undefined,
            status: 'pendiente',
            createdAt: at,
            origin: 'tienda',
            history: [{ status: 'pendiente', at }],
          };
          const next: BusinessData = {
            ...data,
            nextOrderNumber: data.nextOrderNumber + 1,
            orders: [order, ...data.orders],
          };
          set({
            data: withActivity(next, 'reserva', `Reserva ${order.id} creada por ${order.customer}`),
            cart: [],
          });
          return { ok: true, message: 'Reserva registrada.', value: order };
        },

        confirmOrder: (id) => transition(id, 'confirmado', (o) => `Pedido ${o.id} confirmado`, 'confirmacion'),
        deliverOrder: (id) =>
          transition(id, 'entregado', (o) => `Pedido ${o.id} entregado · ingreso registrado`, 'entrega'),
        cancelOrder: (id, by) =>
          transition(
            id,
            'cancelado',
            (o) => `Reserva ${o.id} cancelada por ${by === 'cliente' ? 'el cliente' : 'el equipo'} · unidades liberadas`,
            'cancelacion',
          ),

        registerProduction: (flavor, qty, note) => {
          if (!isPositiveInt(qty)) return { ok: false, message: 'Ingresa una cantidad entera mayor que cero.' };
          const next = addMovement(flavor, 'produccion', qty, note || 'Nueva producción');
          const text = `Producción registrada: +${qty} ${PRODUCT_BY_ID[flavor].shortName}`;
          set({ data: withActivity(next, 'inventario', text) });
          return { ok: true, message: text };
        },

        adjustStock: (flavor, delta, note) => {
          if (!Number.isInteger(delta) || delta === 0) {
            return { ok: false, message: 'El ajuste debe ser un número entero distinto de cero.' };
          }
          const available = stockFor(get().data, flavor).available;
          if (available + delta < 0) {
            return { ok: false, message: `No puedes retirar más de ${formatUnits(available)} disponibles.` };
          }
          const next = addMovement(flavor, 'correccion', delta, note || 'Corrección de inventario');
          const text = `Inventario corregido: ${delta > 0 ? '+' : ''}${delta} ${PRODUCT_BY_ID[flavor].shortName}`;
          set({ data: withActivity(next, 'inventario', text) });
          return { ok: true, message: text };
        },

        registerWaste: (flavor, qty, note) => {
          if (!isPositiveInt(qty)) return { ok: false, message: 'Ingresa una cantidad entera mayor que cero.' };
          const available = stockFor(get().data, flavor).available;
          if (qty > available) {
            return { ok: false, message: `Solo hay ${formatUnits(available)} disponibles para retirar.` };
          }
          const next = addMovement(flavor, 'no_apto', qty, note || 'Producto no apto para venta');
          const text = `Retiradas ${formatUnits(qty)} de ${PRODUCT_BY_ID[flavor].shortName}`;
          set({ data: withActivity(next, 'inventario', text) });
          return { ok: true, message: text };
        },

        registerDirectSale: (flavor, qty, slot) => {
          if (!isPositiveInt(qty)) return { ok: false, message: 'Ingresa una cantidad entera mayor que cero.' };
          const { data } = get();
          const available = stockFor(data, flavor).available;
          if (qty > available) return { ok: false, message: `Solo hay ${formatUnits(available)} disponibles.` };
          const [id, seq] = nextId(data, 'vd');
          const next: BusinessData = {
            ...data,
            seq,
            directSales: [...data.directSales, { id, flavor, qty, slot, at: new Date().toISOString() }],
          };
          const text = `Venta directa: ${qty} × ${PRODUCT_BY_ID[flavor].shortName}`;
          set({ data: withActivity(next, 'venta', text) });
          return { ok: true, message: text };
        },

        addFeedback: (input) => {
          if (input.rating < 1 || input.rating > 5) return { ok: false, message: 'Elige una calificación de 1 a 5.' };
          if (input.message.trim().length < 5) return { ok: false, message: 'Cuéntanos un poco más.' };
          const { data } = get();
          const [id, seq] = nextId(data, 'op');
          const fb: Feedback = {
            id,
            name: input.name?.trim() || undefined,
            type: input.type,
            flavor: input.flavor,
            rating: input.rating,
            message: input.message.trim(),
            at: new Date().toISOString(),
            origin: 'tienda',
          };
          const next: BusinessData = { ...data, seq, feedback: [fb, ...data.feedback] };
          set({ data: withActivity(next, 'sugerencia', `Nueva opinión: ${fb.rating}/5`) });
          return { ok: true, message: '¡Gracias! Tu comentario llegó al equipo JEM.' };
        },

        setPlanOverride: (flavor, qty) => {
          const overrides = { ...get().planOverrides };
          if (qty === null) delete overrides[flavor];
          else overrides[flavor] = Math.max(0, Math.floor(qty));
          set({ planOverrides: overrides });
        },

        resetDemo: () => {
          const fresh = buildSeed();
          set({ data: withActivity(fresh, 'demo', 'Datos restablecidos'), cart: [], planOverrides: {} });
        },
      };
    },
    {
      name: 'brownies-jem-smart:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, cart: s.cart, planOverrides: s.planOverrides }),
    },
  ),
);
