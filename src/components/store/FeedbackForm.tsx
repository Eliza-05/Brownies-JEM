import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, Send, Star, TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FEEDBACK_TYPE_LABEL, PRODUCTS } from '../../data/products';
import type { FeedbackType, FlavorId } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';

type Errors = Partial<Record<'type' | 'flavor' | 'rating' | 'message', string>>;

const RATING_TEXT = ['', 'No me gustó', 'Puede mejorar', 'Estuvo bien', 'Muy bueno', '¡Me encantó!'];

export function FeedbackForm() {
  const addFeedback = useJemStore((s) => s.addFeedback);
  const [name, setName] = useState('');
  const [type, setType] = useState<FeedbackType | ''>('');
  const [flavor, setFlavor] = useState<FlavorId | ''>('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!type) e.type = 'Elige el tipo de comentario.';
    if (!flavor) e.flavor = 'Cuéntanos cuál es tu sabor favorito.';
    if (!rating) e.rating = 'Elige una calificación de 1 a 5.';
    if (message.trim().length < 5) e.message = 'Escribe un mensaje de al menos 5 caracteres.';
    if (message.length > 400) e.message = 'El mensaje puede tener máximo 400 caracteres.';
    return e;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`fb-${first}`)?.focus();
      return;
    }
    const r = addFeedback({ name, type: type as FeedbackType, flavor: flavor as FlavorId, rating, message });
    if (!r.ok) {
      toast.error('Revisa el formulario', r.message);
      return;
    }
    toast.success(r.message);
    setSent(true);
    setName('');
    setType('');
    setFlavor('');
    setRating(0);
    setMessage('');
  };

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p className="error" id={`fb-${k}-error`}>
        <TriangleAlert size={14} aria-hidden /> {errors[k]}
      </p>
    ) : null;

  return (
    <div className="feedback">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="ok" className="feedback__done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} role="status">
            <CircleCheck size={40} aria-hidden />
            <h3>¡Gracias por contarnos!</h3>
            <p>Tu comentario quedó registrado y ya lo puede leer el equipo JEM en su panel.</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSent(false)}>
              Enviar otro comentario
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-labelledby="fb-title">
            <h3 id="fb-title">Sugerencias y calificaciones</h3>
            <p className="muted feedback__intro">Tu opinión nos ayuda a decidir qué hornear. Los campos con * son obligatorios.</p>

            <div className="feedback__row">
              <div className="field">
                <label htmlFor="fb-name">Nombre (opcional)</label>
                <input id="fb-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} />
              </div>
              <div className="field">
                <label htmlFor="fb-type">Tipo de comentario *</label>
                <select
                  id="fb-type"
                  className="select"
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  aria-invalid={!!errors.type}
                  aria-describedby={errors.type ? 'fb-type-error' : undefined}
                >
                  <option value="">Selecciona…</option>
                  {(Object.keys(FEEDBACK_TYPE_LABEL) as FeedbackType[]).map((k) => (
                    <option key={k} value={k}>
                      {FEEDBACK_TYPE_LABEL[k]}
                    </option>
                  ))}
                </select>
                {err('type')}
              </div>
            </div>

            <fieldset className="choice-group" aria-describedby={errors.flavor ? 'fb-flavor-error' : undefined}>
              <legend>Sabor favorito *</legend>
              {PRODUCTS.map((p, i) => (
                <label key={p.id} className="choice">
                  <input
                    id={i === 0 ? 'fb-flavor' : undefined}
                    type="radio"
                    name="fb-flavor"
                    value={p.id}
                    checked={flavor === p.id}
                    onChange={() => setFlavor(p.id)}
                  />
                  <span>
                    <i className={`dot dot--${p.id}`} aria-hidden />
                    {p.shortName}
                  </span>
                </label>
              ))}
            </fieldset>
            {err('flavor')}

            <fieldset className="rating-input" aria-describedby={errors.rating ? 'fb-rating-error' : 'fb-rating-text'} onMouseLeave={() => setHover(0)}>
              <legend>Calificación *</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={n <= (hover || rating) ? 'on' : ''} onMouseEnter={() => setHover(n)}>
                  <input
                    id={n === 1 ? 'fb-rating' : undefined}
                    type="radio"
                    name="fb-rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    aria-label={`${n} de 5 — ${RATING_TEXT[n]}`}
                  />
                  <Star size={22} fill="currentColor" strokeWidth={0} aria-hidden />
                </label>
              ))}
              <span className="rating-input__text" id="fb-rating-text" aria-live="polite">
                {RATING_TEXT[hover || rating]}
              </span>
            </fieldset>
            {err('rating')}

            <div className="field">
              <label htmlFor="fb-message">Mensaje *</label>
              <textarea
                id="fb-message"
                className="textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={400}
                aria-invalid={!!errors.message}
                aria-describedby={`fb-message-count${errors.message ? ' fb-message-error' : ''}`}
                placeholder="Ej.: me gustaría un brownie con arequipe y nueces."
              />
              <span className="hint" id="fb-message-count">
                {message.length}/400
              </span>
              {err('message')}
            </div>

            <button type="submit" className="btn">
              <Send size={18} aria-hidden />
              Enviar comentario
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
