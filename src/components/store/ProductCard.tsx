import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Product } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { useUi } from '../../store/useUi';
import { formatCOP } from '../../utils/format';
import { stockFor } from '../../utils/metrics';
import { QuantityStepper } from '../ui/Bits';
import { ProductImage } from '../ui/Brand';

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const data = useJemStore((s) => s.data);
  const inCart = useJemStore((s) => s.cart.find((l) => l.flavor === product.id)?.qty ?? 0);
  const addToCart = useJemStore((s) => s.addToCart);
  const { bumpCart, setCartOpen } = useUi();
  const reduce = useReducedMotion();

  const stock = stockFor(data, product.id);
  const canAdd = Math.max(0, stock.available - inCart);
  const soldOut = stock.available === 0;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (qty > canAdd) setQty(Math.max(1, canAdd));
  }, [canAdd, qty]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(t);
  }, [added]);

  const onAdd = () => {
    const r = addToCart(product.id, qty);
    if (!r.ok) {
      toast.error('No pudimos agregarlo', r.message);
      return;
    }
    bumpCart();
    setAdded(true);
    setQty(1);
    toast.success(r.message, 'Puedes seguir eligiendo o iniciar tu reserva.');
  };

  // Referencia visual: una tanda típica de 30 unidades.
  const level = Math.min(1, stock.available / 30);
  const availabilityText = soldOut
    ? 'Agotado por hoy'
    : stock.available <= 6
      ? `¡Últimas ${stock.available} unidades!`
      : `${stock.available} disponibles hoy`;

  return (
    <motion.article
      className={`flavor flavor--${product.id}${soldOut ? ' is-soldout' : ''}`}
      initial={{ opacity: 0, y: reduce ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby={`flavor-${product.id}`}
    >
      <div className="flavor__media">
        <ProductImage src={product.image} alt={product.imageAlt} flavor={product.id} />
        <span className="flavor__number" aria-hidden>
          {product.number}
        </span>
        {soldOut && <span className="flavor__soldout">Agotado</span>}
      </div>

      <div className="flavor__body">
        <header className="flavor__head">
          <h3 id={`flavor-${product.id}`}>{product.name}</h3>
          <span className="flavor__price">{formatCOP(product.price)}</span>
        </header>
        <p className="flavor__desc">{product.description}</p>
        <ul className="flavor__notes" aria-label="Notas de sabor">
          {product.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>

        <div className="flavor__stock">
          <div className="flavor__stock-row">
            <span className={`flavor__stock-label${stock.available <= 6 ? ' is-low' : ''}`}>{availabilityText}</span>
            {inCart > 0 && <span className="flavor__incart">{inCart} en tu carrito</span>}
          </div>
          <div
            className="meter"
            role="meter"
            aria-label={`Disponibilidad de ${product.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level * 100)}
            aria-valuetext={availabilityText}
          >
            <span style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
        </div>

        <div className="flavor__actions">
          <QuantityStepper value={canAdd ? qty : 0} min={1} max={canAdd} onChange={setQty} label={product.name} />
          <button
            type="button"
            className={`btn flavor__add${added ? ' is-added' : ''}`}
            onClick={onAdd}
            disabled={soldOut || canAdd === 0}
            aria-describedby={`flavor-${product.id}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="ok" className="flavor__add-inner" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
                  <Check size={18} aria-hidden /> ¡Agregado!
                </motion.span>
              ) : (
                <motion.span key="add" className="flavor__add-inner" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
                  <ShoppingBag size={18} aria-hidden />
                  {soldOut ? 'Agotado' : canAdd === 0 ? 'Máximo en carrito' : 'Agregar'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        {inCart > 0 && (
          <button type="button" className="link-btn" onClick={() => setCartOpen(true)}>
            Ver carrito
          </button>
        )}
      </div>
    </motion.article>
  );
}
