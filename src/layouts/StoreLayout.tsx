import { AnimatePresence, motion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { CartDrawer } from '../components/store/Cart';
import { Header } from '../components/store/Header';
import { Footer } from '../components/store/Sections';

export function StoreLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <div className="store-shell">
      <a href="#store-main" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      <main id="store-main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
