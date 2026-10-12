import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_BY_ID } from '../../data/products';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { scrollToSection, useUi } from '../../store/useUi';
import { formatCOP } from '../../utils/format';
import { stockFor } from '../../utils/metrics';
import { EmptyState, QuantityStepper } from '../ui/Bits';
import { ProductImage } from '../ui/Brand';

/** Líneas del carrito editables; se reutilizan en el carrito lateral y en el paso 1 de la reserva. */
export function CartLines() {
  const cart = useJemStore((s) => s.cart);
  const data = useJemStore((s) => s.data);
  const setCartQty = useJemStore((s) => s.setCartQty);
  const removeFromCart = useJemStore((s) => s.removeFromCart);

  return (
    <ul className="cart-lines">
      <AnimatePresence initial={false}>
        {cart.map((line) => {
          const p = PRODUCT_BY_ID[line.flavor];
          const available = stockFor(data, line.flavor).available;
          return (
            <motion.li
              key={line.flavor}
              layout
              className="cart-line"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingBlock: 0 }}
            >
              <ProductImage src={p.image} alt="" flavor={p.id} className="cart-line__img" />
              <div className="cart-line__info">
                <p className="cart-line__name">{p.name}</p>
                <p className="cart-line__unit">{formatCOP(p.price)} c/u</p>
                <QuantityStepper
                  value={line.qty}
                  min={1}
                  max={available}
                  label={p.name}
                  onChange={(q) => {
                    const r = setCartQty(line.flavor, q);
                    if (!r.ok) toast.error('Cantidad no disponible', r.message);
                  }}
                />
                {line.qty >= available && <p className="cart-line__max">Máximo disponible</p>}
              </div>
              <div className="cart-line__end">
                <strong>{formatCOP(line.qty * p.price)}</strong>
                <button
                  type="button"
                  className="icon-btn icon-btn--quiet"
                  onClick={() => {
                    removeFromCart(line.flavor);
                    toast.info(`${p.name} retirado del carrito`);
                  }}
                  aria-label={`Retirar ${p.name} del carrito`}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

export function useCartTotals() {
  const cart = useJemStore((s) => s.cart);
  const units = cart.reduce((n, l) => n + l.qty, 0);
  const total = cart.reduce((n, l) => n + l.qty * PRODUCT_BY_ID[l.flavor].price, 0);
  return { units, total, empty: cart.length === 0 };
}

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUi();
  return createPortal(
    <AnimatePresence>{cartOpen && <DrawerInner onClose={() => setCartOpen(false)} />}</AnimatePresence>,
    document.body,
  );
}

function DrawerInner({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { units, total, empty } = useCartTotals();
  useFocusTrap(ref, true, onClose);

  return (
    <>
      <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
      >
        <div className="drawer__head">
          <div>
            <span className="eyebrow">Tu pedido</span>
            <h2 id="cart-title">Carrito</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar carrito">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="drawer__body">
          {empty ? (
            <EmptyState
              title="Tu carrito está esperando un antojo"
              action={
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    onClose();
                    navigate('/', { state: { scrollTo: 'sabores' } });
                    window.setTimeout(() => scrollToSection('sabores'), 60);
                  }}
                >
                  Ver sabores
                </button>
              }
            >
              Agrega un brownie para empezar tu reserva.
            </EmptyState>
          ) : (
            <CartLines />
          )}
        </div>

        {!empty && (
          <div className="drawer__foot">
            <dl className="totals">
              <div>
                <dt>Unidades</dt>
                <dd>{units}</dd>
              </div>
              <div className="totals__grand">
                <dt>Total</dt>
                <dd aria-live="polite">{formatCOP(total)}</dd>
              </div>
            </dl>
            <p className="drawer__note">Pagas al recoger tu pedido.</p>
            <button
              type="button"
              className="btn btn--block"
              onClick={() => {
                onClose();
                navigate('/reservar');
              }}
            >
              Iniciar reserva
              <ArrowRight size={18} aria-hidden />
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={onClose}>
              <ShoppingBag size={18} aria-hidden />
              Seguir comprando
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
