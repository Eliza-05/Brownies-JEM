import { AnimatePresence, motion } from 'motion/react';
import { ChartColumn, ClipboardList, Boxes, LayoutDashboard, MessageSquareText, RotateCcw, Store, Wheat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { Wordmark } from '../components/ui/Brand';
import { ConfirmDialog } from '../components/ui/Modal';
import { useJemStore } from '../store/useJemStore';
import { toast } from '../store/useToast';

const NAV = [
  { to: '/panel', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/panel/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/panel/inventario', label: 'Inventario', icon: Boxes },
  { to: '/panel/estadisticas', label: 'Estadísticas', icon: ChartColumn },
  { to: '/panel/planificacion', label: 'Planificación', icon: Wheat },
  { to: '/panel/opiniones', label: 'Opiniones', icon: MessageSquareText },
];

export function PanelLayout() {
  const pending = useJemStore((s) => s.data.orders.filter((o) => o.status === 'pendiente').length);
  const resetDemo = useJemStore((s) => s.resetDemo);
  const [confirmReset, setConfirmReset] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const navigate = useNavigate();

  useEffect(() => {
    // En móvil la navegación es horizontal: mantener visible la sección activa.
    document.querySelector('.sidebar__link.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [location.pathname]);

  return (
    <div className="panel-shell">
      <a href="#panel-main" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="sidebar" aria-label="Panel JEM">
        <div className="sidebar__brand">
          <Wordmark tone="light" />
          <span className="sidebar__tag">Panel JEM</span>
        </div>
        <nav className="sidebar__nav" aria-label="Secciones del panel">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
                  <n.icon size={19} aria-hidden />
                  <span>{n.label}</span>
                  {n.label === 'Pedidos' && pending > 0 && (
                    <span className="sidebar__count" aria-label={`${pending} pendientes`}>
                      {pending}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar__foot">
          <p className="sidebar__note">Panel de gestión del equipo JEM.</p>
          <button type="button" className="sidebar__reset" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} aria-hidden />
            Restablecer datos
          </button>
          <NavLink to="/" className="btn btn--sm sidebar__back">
            <Store size={17} aria-hidden />
            <span className="sidebar__back-long">Volver a la tienda</span>
            <span className="sidebar__back-short">Tienda</span>
          </NavLink>
        </div>
      </aside>

      <main id="panel-main" className="panel-main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <ConfirmDialog
        open={confirmReset}
        title="¿Restablecer los datos?"
        description="Se restaurarán los pedidos iniciales, el inventario inicial (24 clásicos, 30 Oreo y 18 de manjar), las opiniones y las estadísticas. Las reservas creadas en esta sesión se perderán."
        confirmLabel="Sí, restablecer"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          toast.success('Datos restablecidos', 'Los datos iniciales están listos.');
          navigate('/panel');
        }}
      />
    </div>
  );
}
