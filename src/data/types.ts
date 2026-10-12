export type FlavorId = 'clasico' | 'oreo' | 'manjar';

export type OrderStatus = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';

export type SlotId = 's1' | 's2' | 's3' | 's4';

export interface Product {
  id: FlavorId;
  name: string;
  shortName: string;
  price: number;
  description: string;
  notes: string[];
  image: string;
  imageAlt: string;
  /** Color del sabor en gráficos y detalles. */
  color: string;
  number: string;
}

export interface Slot {
  id: SlotId;
  label: string;
  short: string;
  /** Hora de inicio (24 h) usada para fechar movimientos simulados. */
  startHour: number;
}

export interface OrderItem {
  flavor: FlavorId;
  qty: number;
}

export interface StatusChange {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  customer: string;
  contact: string;
  items: OrderItem[];
  total: number;
  slot: SlotId;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  /** "tienda" = creada desde la tienda durante esta demostración. */
  origin: 'demo' | 'tienda';
  history: StatusChange[];
}

export type MovementType = 'produccion' | 'correccion' | 'no_apto';

export interface StockMovement {
  id: string;
  flavor: FlavorId;
  type: MovementType;
  /** Positivo para producción y no apto; con signo para corrección. */
  qty: number;
  at: string;
  note?: string;
}

export interface DirectSale {
  id: string;
  flavor: FlavorId;
  qty: number;
  slot: SlotId;
  at: string;
}

export type FeedbackType = 'producto' | 'sabor' | 'experiencia' | 'otro';

export interface Feedback {
  id: string;
  name?: string;
  type: FeedbackType;
  flavor: FlavorId;
  rating: number;
  message: string;
  at: string;
  origin: 'demo' | 'tienda';
}

export type ActivityKind =
  | 'reserva'
  | 'confirmacion'
  | 'entrega'
  | 'cancelacion'
  | 'inventario'
  | 'venta'
  | 'sugerencia'
  | 'demo';

export interface Activity {
  id: string;
  kind: ActivityKind;
  message: string;
  at: string;
}

export interface CartLine {
  flavor: FlavorId;
  qty: number;
}

export interface BusinessData {
  orders: Order[];
  movements: StockMovement[];
  directSales: DirectSale[];
  feedback: Feedback[];
  activity: Activity[];
  nextOrderNumber: number;
  seq: number;
  seededAt: string;
}
