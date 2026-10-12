import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hero } from '../../components/store/Hero';
import { Catalog, Contact, HowToOrder } from '../../components/store/Sections';
import { scrollToSection } from '../../store/useUi';

export function StoreHome() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const t = window.setTimeout(() => {
      if (target === 'inicio') window.scrollTo({ top: 0 });
      else scrollToSection(target);
      navigate('.', { replace: true, state: null });
    }, 80);
    return () => window.clearTimeout(t);
  }, [location.state, navigate]);

  return (
    <>
      <Hero />
      <Catalog />
      <HowToOrder />
      <Contact />
    </>
  );
}
