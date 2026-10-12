import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/Toaster';
import { PanelLayout } from './layouts/PanelLayout';
import { StoreLayout } from './layouts/StoreLayout';
import { DashboardOverview } from './pages/panel/DashboardOverview';
import { FeedbackPage } from './pages/panel/FeedbackPage';
import { InventoryManager } from './pages/panel/InventoryManager';
import { OrdersManager } from './pages/panel/OrdersManager';
import { ProductionPlanner } from './pages/panel/ProductionPlanner';
import { Statistics } from './pages/panel/Statistics';
import { Checkout } from './pages/store/Checkout';
import { MyReservations } from './pages/store/MyReservations';
import { StoreHome } from './pages/store/StoreHome';

const TITLES: Record<string, string> = {
  '/': 'Brownies JEM · La tienda',
  '/reservar': 'Reservar · Brownies JEM',
  '/mis-reservas': 'Mis reservas · Brownies JEM',
  '/panel': 'Resumen · Panel JEM',
  '/panel/pedidos': 'Pedidos · Panel JEM',
  '/panel/inventario': 'Inventario · Panel JEM',
  '/panel/estadisticas': 'Estadísticas · Panel JEM',
  '/panel/planificacion': 'Planificación · Panel JEM',
  '/panel/opiniones': 'Opiniones · Panel JEM',
};

function RouteEffects() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Brownies JEM Smart';
    if (!(state as { scrollTo?: string } | null)?.scrollTo) window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteEffects />
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<StoreHome />} />
            <Route path="reservar" element={<Checkout />} />
            <Route path="mis-reservas" element={<MyReservations />} />
          </Route>
          <Route path="panel" element={<PanelLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="pedidos" element={<OrdersManager />} />
            <Route path="inventario" element={<InventoryManager />} />
            <Route path="estadisticas" element={<Statistics />} />
            <Route path="planificacion" element={<ProductionPlanner />} />
            <Route path="opiniones" element={<FeedbackPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  );
}
