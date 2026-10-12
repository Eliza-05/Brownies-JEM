import { AnimatePresence, motion } from 'motion/react';
import { LayoutDashboard, Menu, ShoppingBag, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useJemStore } from '../../store/useJemStore';
import { scrollToSection, useUi } from '../../store/useUi';
import { Wordmark } from '../ui/Brand';

const NAV = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sabores', label: 'Sabores' },
  { id: 'como-pedir', label: 'Cómo pedir' },
  { id: 'contacto', label: 'Contacto' },
];

export function Header() {
  const cartCount = useJemStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const { setCartOpen, cartBump } = useUi();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(menuRef, menuOpen, () => setMenuOpen(false));

  const go = (id: string) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      if (id === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' });
      else scrollToSection(id);
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

  const links = (
    <>
      {NAV.map((n) => (
        <li key={n.id}>
          <a
            href={`/#${n.id}`}
            onClick={(e) => {
              e.preventDefault();
              go(n.id);
            }}
          >
            {n.label}
          </a>
        </li>
      ))}
      <li>
        <Link to="/mis-reservas" onClick={() => setMenuOpen(false)} aria-current={location.pathname === '/mis-reservas' ? 'page' : undefined}>
          Mis reservas
        </Link>
      </li>
    </>
  );

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link to="/" className="site-header__logo" aria-label="Brownies JEM, ir al inicio">
          <Wordmark />
        </Link>

        <nav aria-label="Principal" className="site-nav">
          <ul>{links}</ul>
        </nav>

        <div className="site-header__actions">
          <button type="button" className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}>
            <ShoppingBag size={20} aria-hidden />
            <span className="cart-btn__label">Carrito</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${cartCount}-${cartBump}`}
                className={`cart-btn__count${cartCount ? '' : ' is-empty'}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                aria-hidden
              >
                {cartCount}
              </motion.span>
            </AnimatePresence>
          </button>
          <Link to="/panel" className="mode-link hide-md">
            <LayoutDashboard size={18} aria-hidden />
            Panel JEM
          </Link>
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} aria-hidden />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setMenuOpen(false)}
          >
            <motion.div
              ref={menuRef}
              id="mobile-menu"
              className="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            >
              <div className="mobile-menu__top">
                <Wordmark />
                <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                  <X size={20} aria-hidden />
                </button>
              </div>
              <nav aria-label="Menú móvil">
                <ul>{links}</ul>
              </nav>
              <div className="mobile-menu__foot">
                <Link to="/panel" className="btn btn--dark btn--block" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard size={18} aria-hidden />
                  Ir al Panel JEM
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
