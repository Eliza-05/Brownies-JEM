import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Clock, HandHeart, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_BY_ID, UNIT_PRICE } from '../../data/products';
import { useJemStore } from '../../store/useJemStore';
import { scrollToSection } from '../../store/useUi';
import { formatCOP } from '../../utils/format';
import { ArtisanStamp } from '../ui/Bits';
import { ProductImage } from '../ui/Brand';

const SCHEDULE = [
  { time: '8:30', label: 'Cálculo integral' },
  { time: '10:00', label: 'Física II' },
  { time: '11:00', label: 'Brownie JEM', highlight: true },
  { time: '12:00', label: 'Programación' },
];

export function Hero() {
  const reduce = useReducedMotion();
  const hasCart = useJemStore((s) => s.cart.length > 0);
  const navigate = useNavigate();
  const hero = PRODUCT_BY_ID.clasico;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <motion.span className="eyebrow" {...rise(0)}>
            Brownies artesanales · Bogotá
          </motion.span>
          <motion.h1 id="hero-title" {...rise(0.08)}>
            Entre clase y clase, <em>un brownie</em> hace la diferencia.
          </motion.h1>
          <motion.p className="hero__lead" {...rise(0.16)}>
            Brownies artesanales, frescos y listos para acompañarte durante tu jornada universitaria. Elige tu favorito y
            reserva para recogerlo.
          </motion.p>
          <motion.div className="hero__cta" {...rise(0.24)}>
            <button type="button" className="btn" onClick={() => (hasCart ? navigate('/reservar') : scrollToSection('sabores'))}>
              Quiero mi brownie
              <ArrowRight size={18} aria-hidden />
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => scrollToSection('sabores')}>
              Explorar sabores
            </button>
          </motion.div>
          <motion.ul className="hero__facts" {...rise(0.32)}>
            <li>
              <strong>{formatCOP(UNIT_PRICE)}</strong>
              <span>COP por unidad</span>
            </li>
            <li>
              <strong>3</strong>
              <span>sabores de la casa</span>
            </li>
            <li>
              <strong>4</strong>
              <span>franjas para recoger</span>
            </li>
          </motion.ul>
        </div>

        <div className="hero__visual">
          <motion.div
            className="hero__photo"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductImage src={hero.image} alt={hero.imageAlt} flavor="clasico" eager />
          </motion.div>

          <span className="hero__tag">
            <HandHeart size={16} aria-hidden />
            Hechos artesanalmente
          </span>

          <ArtisanStamp className="hero__stamp" />

          <motion.div className="hero__price" {...rise(0.5)} aria-label={`Precio: ${formatCOP(UNIT_PRICE)} pesos colombianos por unidad`}>
            <span className="hero__price-k">c/u</span>
            <strong>{formatCOP(UNIT_PRICE)}</strong>
            <span className="hero__price-k">COP</span>
          </motion.div>

          <motion.aside className="schedule-card" {...rise(0.6)} aria-label="Ejemplo de un horario universitario con un descanso para un brownie">
            <p className="schedule-card__title">
              <Clock size={15} aria-hidden /> Mi horario de hoy
            </p>
            <ol>
              {SCHEDULE.map((s) => (
                <li key={s.time} className={s.highlight ? 'is-break' : undefined}>
                  <span className="schedule-card__time">{s.time}</span>
                  <span>
                    {s.highlight && <Sparkles size={14} aria-hidden />}
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </motion.aside>
        </div>
      </div>

      <div className="container">
        <ul className="benefits" aria-label="Por qué Brownies JEM">
          <li>
            <span className="benefits__icon" aria-hidden>
              <HandHeart size={22} />
            </span>
            <div>
              <h2>Hechos artesanalmente</h2>
              <p>Brownies preparados con atención al sabor y la textura.</p>
            </div>
          </li>
          <li>
            <span className="benefits__icon" aria-hidden>
              <MapPin size={22} />
            </span>
            <div>
              <h2>Cerca de ti</h2>
              <p>Una opción práctica durante tu jornada universitaria.</p>
            </div>
          </li>
          <li>
            <span className="benefits__icon" aria-hidden>
              <Clock size={22} />
            </span>
            <div>
              <h2>Reserva sin complicaciones</h2>
              <p>Elige tu brownie y selecciona cuándo recogerlo.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
