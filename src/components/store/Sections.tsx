import { motion, useReducedMotion } from 'motion/react';
import { Cookie, MapPin, MessageCircle, CalendarClock, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../../data/products';
import { Modal } from '../ui/Modal';
import { ChocolateDrip } from '../ui/Bits';
import { ProductImage, Wordmark } from '../ui/Brand';
import { FeedbackForm } from './FeedbackForm';
import { ProductCard } from './ProductCard';

/** Número de WhatsApp del emprendimiento. Déjalo vacío hasta tener uno oficial. */
export const WHATSAPP_NUMBER = '';

export function Catalog() {
  return (
    <section className="catalog" id="sabores" aria-labelledby="catalog-title">
      <div className="container">
        <header className="section-head">
          <span className="eyebrow">El menú de la casa</span>
          <h2 id="catalog-title">
            Tres sabores. <em>Muchas razones</em> para darte un gusto.
          </h2>
          <p className="muted">Escoge el brownie que más se te antoje.</p>
        </header>
        <div className="catalog__grid">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Cookie, title: 'Elige tu sabor', text: 'Clásico, Oreo o manjar. Revisa cuántas unidades quedan hoy.' },
  { icon: CalendarClock, title: 'Reserva tu franja', text: 'Escoge la hora en la que te queda más fácil recogerlo.' },
  { icon: PackageCheck, title: 'Recoge entre clases', text: 'El equipo JEM confirma tu pedido y lo tiene listo.' },
];

export function HowToOrder() {
  const reduce = useReducedMotion();
  return (
    <section className="how" id="como-pedir" aria-labelledby="how-title">
      <ChocolateDrip className="how__drip" />
      <div className="container how__grid">
        <div className="how__copy">
          <span className="eyebrow eyebrow--light">Cómo pedir</span>
          <h2 id="how-title">
            Tu brownie, reservado en <em>tres pasos</em>.
          </h2>
          <ol className="how__steps">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, x: reduce ? 0 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
              >
                <span className="how__num" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h3>
                    <s.icon size={20} aria-hidden /> {s.title}
                  </h3>
                  <p>{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <p className="how__note">
            <MapPin size={16} aria-hidden /> Punto de entrega por confirmar con el equipo JEM.
          </p>
        </div>
        <div className="how__visual">
          <ProductImage src="/images/brownies-torre.jpg" alt="Torre de brownies de chocolate recién horneados" flavor="clasico" />
          <span className="how__caption">Recién horneados, en pequeñas tandas.</span>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const [open, setOpen] = useState(false);
  return (
    <section className="contact" id="contacto" aria-labelledby="contact-title">
      <div className="container">
        <header className="section-head section-head--left">
          <span className="eyebrow">Contacto</span>
          <h2 id="contact-title">
            ¿Tienes una pregunta? <em>Hablemos de brownies.</em>
          </h2>
        </header>
        <div className="contact__grid">
          <div className="contact__card">
            <h3>Escríbenos directamente</h3>
            <p>¿Pedidos grandes, dudas sobre los sabores o sobre dónde recoger? Las integrantes de JEM te responden.</p>
            <button
              type="button"
              className="btn btn--whatsapp"
              onClick={() => {
                if (WHATSAPP_NUMBER) window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener');
                else setOpen(true);
              }}
            >
              <MessageCircle size={20} aria-hidden />
              Contactar por WhatsApp
            </button>
            <Link to="/mis-reservas" className="contact__link">
              Consultar mis reservas →
            </Link>
            <div className="contact__flavors" aria-hidden>
              {PRODUCTS.map((p) => (
                <ProductImage key={p.id} src={p.image} alt="" flavor={p.id} className="contact__thumb" />
              ))}
            </div>
          </div>
          <FeedbackForm />
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="WhatsApp"
        title="Estamos actualizando nuestro canal"
        actions={
          <button type="button" className="btn" onClick={() => setOpen(false)} data-autofocus>
            Entendido
          </button>
        }
      >
        <p className="muted">
          Muy pronto podrás escribirnos por WhatsApp desde aquí. Mientras tanto, déjanos tu mensaje en el formulario o
          haz tu reserva y te contactaremos para coordinar la entrega.
        </p>
      </Modal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Wordmark tone="light" />
          <p className="site-footer__claim">
            Brownies artesanales, frescos y accesibles, disponibles cuando los necesitas, sin interrumpir tu jornada
            universitaria.
          </p>
        </div>
        <div className="site-footer__meta">
          <p>Bogotá, Colombia · {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
