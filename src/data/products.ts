import type { FeedbackType, FlavorId, OrderStatus, Product, Slot, SlotId } from './types';

export const UNIT_PRICE = 5000;

/**
 * Las fotografías viven en /public/images y son ilustrativas (Unsplash).
 * Para usar fotos propias basta con reemplazar los archivos manteniendo el nombre.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'clasico',
    name: 'Brownie clásico',
    shortName: 'Clásico',
    price: UNIT_PRICE,
    description: 'Chocolate intenso, interior suave y ese sabor tradicional que siempre provoca.',
    notes: ['Cacao intenso', 'Corteza craquelada', 'Centro húmedo'],
    image: '/images/brownie-clasico.jpg',
    imageAlt: 'Brownies de chocolate cortados en cuadros con superficie brillante y craquelada, vistos desde arriba.',
    color: '#9A4F2C',
    number: '01',
  },
  {
    id: 'oreo',
    name: 'Brownie Oreo',
    shortName: 'Oreo',
    price: UNIT_PRICE,
    description: 'Nuestro brownie de chocolate con trozos de Oreo para una combinación crujiente y deliciosa.',
    notes: ['Galleta crujiente', 'Chocolate oscuro', 'Contraste de texturas'],
    image: '/images/brownie-oreo.jpg',
    imageAlt: 'Dos cuadros de brownie oscuro coronados con galletas tipo Oreo sobre un plato de cerámica.',
    color: '#4E6B78',
    number: '02',
  },
  {
    id: 'manjar',
    name: 'Brownie de manjar',
    shortName: 'Manjar',
    price: UNIT_PRICE,
    description: 'Brownie de chocolate acompañado del toque dulce y cremoso del manjar.',
    notes: ['Capa cremosa', 'Dulce de leche', 'Para los más golosos'],
    image: '/images/brownie-manjar.jpg',
    imageAlt: 'Brownies de chocolate con una capa visible de manjar cremoso, apilados sobre una tabla de madera.',
    color: '#D8973C',
    number: '03',
  },
];

export const PRODUCT_BY_ID: Record<FlavorId, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
) as Record<FlavorId, Product>;

export const FLAVORS: FlavorId[] = PRODUCTS.map((p) => p.id);

export const SLOTS: Slot[] = [
  { id: 's1', label: '10:00 a. m. – 11:00 a. m.', short: '10–11 a. m.', startHour: 10 },
  { id: 's2', label: '11:00 a. m. – 12:00 m.', short: '11 a. m.–12 m.', startHour: 11 },
  { id: 's3', label: '2:00 p. m. – 3:00 p. m.', short: '2–3 p. m.', startHour: 14 },
  { id: 's4', label: '3:00 p. m. – 4:00 p. m.', short: '3–4 p. m.', startHour: 15 },
];

export const SLOT_BY_ID: Record<SlotId, Slot> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
) as Record<SlotId, Slot>;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pendiente: '#C56C3D',
  confirmado: '#65402F',
  entregado: '#30201B',
  cancelado: '#AF4B5B',
};

export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  producto: 'Opinión del producto',
  sabor: 'Nuevo sabor',
  experiencia: 'Experiencia de compra',
  otro: 'Otro',
};

export const LOW_STOCK_THRESHOLD = 6;
