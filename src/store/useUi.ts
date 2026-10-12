import { create } from 'zustand';

interface UiState {
  cartOpen: boolean;
  /** Se incrementa cada vez que algo entra al carrito, para animar el contador. */
  cartBump: number;
  setCartOpen: (open: boolean) => void;
  bumpCart: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  cartOpen: false,
  cartBump: 0,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  bumpCart: () => set({ cartBump: get().cartBump + 1 }),
}));

/** Desplaza suavemente hasta una sección de la tienda y mueve el foco a ella. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  return true;
}
