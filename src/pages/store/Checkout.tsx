import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Clock, Info, MapPin, PartyPopper, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartLines, useCartTotals } from '../../components/store/Cart';
import { EmptyState, StatusBadge } from '../../components/ui/Bits';
import { ProductImage } from '../../components/ui/Brand';
import { PRODUCT_BY_ID, SLOTS, SLOT_BY_ID } from '../../data/products';
import type { SlotId } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { formatCOP, formatDateTime } from '../../utils/format';
import { orderUnits } from '../../utils/metrics';

const STEPS = ['Productos', 'Recogida', 'Confirmación'];
const MEDIUMS = ['WhatsApp', 'Correo institucional', 'Instagram'] as const;
const PLACEHOLDER: Record<(typeof MEDIUMS)[number], string> = {
  WhatsApp: 'Ej.: 300 000 0000',
  'Correo institucional': 'Ej.: nombre.apellido@universidad.edu.co',
  Instagram: 'Ej.: @tuusuario',
};

type Errors = Partial<Record<'name' | 'contact' | 'slot', string>>;

export function Checkout() {
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { units, total, empty } = useCartTotals();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step]);

  const current = orderId ? 2 : step;

  return (
    <section className="checkout container" aria-labelledby="checkout-title">
      <header className="checkout__head">
        <span className="eyebrow">Reserva tu brownie</span>
        <h1 id="checkout-title" ref={headingRef} tabIndex={-1}>
          {current === 2 ? '¡Tu antojo ya está en nuestra lista!' : 'Arma tu reserva'}
        </h1>
        <ol className="steps" aria-label="Pasos de la reserva">
          {STEPS.map((label, i) => (
            <li key={label} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} aria-current={i === current ? 'step' : undefined}>
              <span className="steps__dot" aria-hidden>
                {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span>
                <span className="sr-only">Paso {i + 1}: </span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <AnimatePresence mode="wait">
        {orderId ? (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <OrderConfirmation orderId={orderId} />
          </motion.div>
        ) : empty ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="checkout__panel">
            <EmptyState
              title="Aún no tienes brownies en tu carrito"
              action={
                <Link to="/" state={{ scrollTo: 'sabores' }} className="btn">
                  Elegir sabores
                </Link>
              }
            >
              Para reservar, primero agrega al menos un brownie.
            </EmptyState>
          </motion.div>
        ) : step === 0 ? (
          <motion.div key="s1" className="checkout__layout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="checkout__panel">
              <h2 className="checkout__h2">Revisa tus brownies</h2>
              <CartLines />
              <div className="checkout__nav">
                <Link to="/" state={{ scrollTo: 'sabores' }} className="btn btn--ghost">
                  <ArrowLeft size={18} aria-hidden />
                  Seguir comprando
                </Link>
                <button type="button" className="btn" onClick={() => setStep(1)}>
                  Continuar a la recogida
                  <ArrowRight size={18} aria-hidden />
                </button>
              </div>
            </div>
            <Summary units={units} total={total} />
          </motion.div>
        ) : (
          <motion.div key="s2" className="checkout__layout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <PickupForm onBack={() => setStep(0)} onDone={setOrderId} />
            <Summary units={units} total={total} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Summary({ units, total }: { units: number; total: number }) {
  const cart = useJemStore((s) => s.cart);
  return (
    <aside className="summary" aria-label="Resumen de la reserva">
      <h2>Resumen</h2>
      <ul>
        {cart.map((l) => (
          <li key={l.flavor}>
            <span>
              {l.qty} × {PRODUCT_BY_ID[l.flavor].name}
            </span>
            <span>{formatCOP(l.qty * PRODUCT_BY_ID[l.flavor].price)}</span>
          </li>
        ))}
      </ul>
      <dl className="totals">
        <div>
          <dt>Unidades</dt>
          <dd>{units}</dd>
        </div>
        <div className="totals__grand">
          <dt>Total a pagar al recoger</dt>
          <dd aria-live="polite">{formatCOP(total)}</dd>
        </div>
      </dl>
      <p className="summary__note">
        <Info size={15} aria-hidden /> Pagas en efectivo o transferencia al recoger tu pedido.
      </p>
    </aside>
  );
}

function PickupForm({ onBack, onDone }: { onBack: () => void; onDone: (id: string) => void }) {
  const createReservation = useJemStore((s) => s.createReservation);
  const [name, setName] = useState('');
  const [medium, setMedium] = useState<(typeof MEDIUMS)[number]>('WhatsApp');
  const [contact, setContact] = useState('');
  const [slot, setSlot] = useState<SlotId | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Escribe tu nombre para reconocer tu pedido.';
    if (contact.trim().length < 3) e.contact = `Escribe tu ${medium === 'WhatsApp' ? 'número' : medium === 'Instagram' ? 'usuario' : 'correo'} para contactarte.`;
    else if (medium === 'Correo institucional' && !/^\S+@\S+\.\S+$/.test(contact.trim())) e.contact = 'Revisa el formato del correo.';
    else if (medium === 'WhatsApp' && contact.replace(/\D/g, '').length < 7) e.contact = 'El número debe tener al menos 7 dígitos.';
    if (!slot) e.slot = 'Elige la franja en la que quieres recoger.';
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`pk-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    const r = createReservation({ customer: name, contact: `${medium}: ${contact.trim()}`, slot: slot as SlotId, notes });
    if (!r.ok || !r.value) {
      toast.error('No pudimos registrar la reserva', r.message);
      if (r.message.includes('carrito')) navigate('/');
      return;
    }
    toast.success(`Reserva ${r.value.id} registrada`, 'Queda pendiente de confirmación por el equipo JEM.');
    onDone(r.value.id);
  };

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p className="error" id={`pk-${k}-error`}>
        <TriangleAlert size={14} aria-hidden /> {errors[k]}
      </p>
    ) : null;

  return (
    <form className="checkout__panel pickup" onSubmit={onSubmit} noValidate>
      <h2 className="checkout__h2">¿Quién recoge y cuándo?</h2>

      <div className="field">
        <label htmlFor="pk-name">Nombre *</label>
        <input
          id="pk-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={60}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'pk-name-error' : undefined}
        />
        {err('name')}
      </div>

      <fieldset className="choice-group">
        <legend>Medio de contacto *</legend>
        {MEDIUMS.map((m) => (
          <label key={m} className="choice">
            <input type="radio" name="pk-medium" checked={medium === m} onChange={() => setMedium(m)} />
            <span>{m}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="pk-contact">{medium === 'WhatsApp' ? 'Número de WhatsApp' : medium === 'Instagram' ? 'Usuario de Instagram' : 'Correo'} *</label>
        <input
          id="pk-contact"
          className="input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={PLACEHOLDER[medium]}
          inputMode={medium === 'WhatsApp' ? 'tel' : medium === 'Correo institucional' ? 'email' : 'text'}
          maxLength={80}
          aria-invalid={!!errors.contact}
          aria-describedby={`pk-contact-hint${errors.contact ? ' pk-contact-error' : ''}`}
        />
        <span className="hint" id="pk-contact-hint">
          Solo lo usamos para coordinar tu entrega.
        </span>
        {err('contact')}
      </div>

      <fieldset className="slots" aria-describedby={`pk-slot-note${errors.slot ? ' pk-slot-error' : ''}`}>
        <legend>Franja de recogida *</legend>
        <div className="slots__grid">
          {SLOTS.map((s, i) => (
            <label key={s.id} className="slot">
              <input id={i === 0 ? 'pk-slot' : undefined} type="radio" name="pk-slot" checked={slot === s.id} onChange={() => setSlot(s.id)} />
              <span>
                <Clock size={18} aria-hidden />
                {s.label}
              </span>
            </label>
          ))}
        </div>
        <p className="hint" id="pk-slot-note">
          Elige la franja que mejor se ajuste a tus clases.
        </p>
      </fieldset>
      {err('slot')}

      <p className="pickup__place">
        <MapPin size={18} aria-hidden /> Punto de entrega por confirmar con el equipo JEM.
      </p>

      <div className="field">
        <label htmlFor="pk-notes">Observaciones (opcional)</label>
        <textarea
          id="pk-notes"
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          placeholder="Ej.: salgo de clase a las 11:10 a. m."
        />
      </div>

      <div className="checkout__nav">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden />
          Volver a productos
        </button>
        <button type="submit" className="btn">
          Registrar reserva
          <Check size={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const order = useJemStore((s) => s.data.orders.find((o) => o.id === orderId));
  if (!order) return null;
  return (
    <div className="confirmation">
      <div className="confirmation__ticket">
        <div className="confirmation__top">
          <PartyPopper size={28} aria-hidden />
          <div>
            <p className="confirmation__label">Número de reserva</p>
            <p className="confirmation__id">{order.id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <p className="confirmation__lead">
          ¡Tu reserva quedó registrada! Te contactaremos para confirmarla.
        </p>
        <ul className="confirmation__items">
          {order.items.map((i) => (
            <li key={i.flavor}>
              <ProductImage src={PRODUCT_BY_ID[i.flavor].image} alt="" flavor={i.flavor} className="confirmation__thumb" />
              <span>{PRODUCT_BY_ID[i.flavor].name}</span>
              <span className="confirmation__qty">× {i.qty}</span>
              <strong>{formatCOP(i.qty * PRODUCT_BY_ID[i.flavor].price)}</strong>
            </li>
          ))}
        </ul>
        <dl className="confirmation__facts">
          <div>
            <dt>Cantidad</dt>
            <dd>{orderUnits(order)} brownies</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatCOP(order.total)}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>{SLOT_BY_ID[order.slot].label}</dd>
          </div>
          <div>
            <dt>Registrada</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
        </dl>
        <p className="confirmation__place">
          <MapPin size={16} aria-hidden /> Punto de entrega por confirmar con el equipo JEM.
        </p>
      </div>
      <div className="confirmation__actions">
        <Link to="/mis-reservas" className="btn">
          Ver mis reservas
        </Link>
        <Link to="/" className="btn btn--ghost">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
