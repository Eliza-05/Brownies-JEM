import { CookingPot, Leaf, Recycle, RotateCcw, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Card, FlavorDot, PanelHeader } from '../../components/panel/PanelBits';
import { ConfirmDialog } from '../../components/ui/Modal';
import { FLAVORS, PRODUCT_BY_ID } from '../../data/products';
import type { FlavorId } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { formatNumber } from '../../utils/format';
import { PLAN_WINDOW_DAYS, productionPlan, rangeStart, totalWasted } from '../../utils/metrics';

export function ProductionPlanner() {
  const data = useJemStore((s) => s.data);
  const overrides = useJemStore((s) => s.planOverrides);
  const setPlanOverride = useJemStore((s) => s.setPlanOverride);
  const registerProduction = useJemStore((s) => s.registerProduction);
  const plan = useMemo(() => productionPlan(data), [data]);
  const [askBatch, setAskBatch] = useState(false);

  const planned = (f: FlavorId) => overrides[f] ?? plan.find((p) => p.flavor === f)!.suggested;
  const totalPlanned = FLAVORS.reduce((s, f) => s + planned(f), 0);
  const totalLeftover = plan.reduce((s, p) => s + p.possibleLeftover, 0);

  const registerBatch = () => {
    setAskBatch(false);
    const done: string[] = [];
    for (const f of FLAVORS) {
      const q = planned(f);
      if (q > 0) {
        const r = registerProduction(f, q, 'Tanda planificada');
        if (r.ok) done.push(`${q} ${PRODUCT_BY_ID[f].shortName}`);
      }
      setPlanOverride(f, null);
    }
    toast.success('Tanda registrada en inventario', done.join(' · '));
  };

  return (
    <>
      <PanelHeader eyebrow="Planificación" title="Horneemos con intención." subtitle="Planificamos mejor nuestras tandas con ayuda de la información de ventas y reservas.">
        <span className="badge badge--olive">
          <Leaf size={14} aria-hidden /> Recomendación calculada con tus ventas recientes.
        </span>
      </PanelHeader>

      <Card title="Próxima tanda sugerida" subtitle="Puedes editar las cantidades antes de registrar la tanda.">
        <div className="table-wrap">
          <table className="plan-table">
            <caption className="sr-only">Cálculo de producción sugerida por sabor</caption>
            <thead>
              <tr>
                <th scope="col">Sabor</th>
                <th scope="col" className="num">
                  Ventas recientes
                  <small>últimas {PLAN_WINDOW_DAYS} jornadas</small>
                </th>
                <th scope="col" className="num">
                  Demanda observada
                  <small>promedio diario</small>
                </th>
                <th scope="col" className="num">
                  Vendidas hoy
                </th>
                <th scope="col" className="num">
                  Reservas activas
                </th>
                <th scope="col" className="num">
                  Disponibles
                </th>
                <th scope="col" className="num">
                  Posible sobrante
                  <small>al cierre de hoy</small>
                </th>
                <th scope="col" className="num plan-table__suggest">
                  A preparar
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.map((p) => {
                const product = PRODUCT_BY_ID[p.flavor];
                const value = planned(p.flavor);
                const edited = overrides[p.flavor] !== undefined;
                return (
                  <tr key={p.flavor}>
                    <th scope="row" data-label="Sabor">
                      <FlavorDot color={product.color} />
                      {product.name}
                    </th>
                    <td data-label="Ventas recientes" className="num">
                      {p.recentSold}
                    </td>
                    <td data-label="Demanda observada" className="num">
                      <span>
                        {formatNumber(p.avgDaily)} <span className="muted">≈ {p.expectedDemand}</span>
                      </span>
                    </td>
                    <td data-label="Vendidas hoy" className="num">
                      {p.soldToday}
                    </td>
                    <td data-label="Reservas activas" className="num">
                      {p.pendingReservations}
                    </td>
                    <td data-label="Disponibles" className="num">
                      {p.available}
                    </td>
                    <td data-label="Posible sobrante" className={`num${p.possibleLeftover > 0 ? ' warn' : ''}`}>
                      {p.possibleLeftover}
                    </td>
                    <td data-label="A preparar" className="num plan-table__suggest">
                      <div className="plan-input">
                        <label htmlFor={`plan-${p.flavor}`} className="sr-only">
                          Unidades a preparar de {product.name}
                        </label>
                        <input
                          id={`plan-${p.flavor}`}
                          className="input"
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setPlanOverride(p.flavor, Number.isFinite(n) ? Math.max(0, n) : 0);
                          }}
                        />
                        {edited ? (
                          <button
                            type="button"
                            className="icon-btn icon-btn--quiet"
                            onClick={() => setPlanOverride(p.flavor, null)}
                            aria-label={`Volver a la sugerencia de ${p.suggested} para ${product.name}`}
                            title={`Sugerido: ${p.suggested}`}
                          >
                            <RotateCcw size={16} aria-hidden />
                          </button>
                        ) : (
                          <span className="plan-input__tag">sugerido</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="plan-foot">
          <p>
            <strong>{totalPlanned}</strong> unidades para la próxima tanda · <span className="muted">{totalLeftover} posibles sobrantes hoy</span>
          </p>
          <button type="button" className="btn" disabled={totalPlanned === 0} onClick={() => setAskBatch(true)}>
            <CookingPot size={18} aria-hidden />
            Registrar tanda en inventario
          </button>
        </div>

        <details className="plan-rule">
          <summary>¿Cómo se calcula la sugerencia?</summary>
          <ol>
            <li>Promedio diario = unidades vendidas en las últimas {PLAN_WINDOW_DAYS} jornadas completas ÷ {PLAN_WINDOW_DAYS}.</li>
            <li>Demanda observada = promedio diario redondeado hacia arriba.</li>
            <li>Demanda que falta hoy = demanda observada − vendidas hoy − reservas activas (mínimo 0).</li>
            <li>Posible sobrante = disponibles − demanda que falta hoy (mínimo 0).</li>
            <li>A preparar = demanda observada − posible sobrante (nunca negativo).</li>
          </ol>
          <p className="muted">Es una regla aritmética sencilla y transparente. No usa inteligencia artificial.</p>
        </details>
      </Card>

      <OdsSection />

      <ConfirmDialog
        open={askBatch}
        title="¿Registrar la tanda planificada?"
        description={`Se sumarán al inventario: ${FLAVORS.filter((f) => planned(f) > 0)
          .map((f) => `${planned(f)} ${PRODUCT_BY_ID[f].shortName}`)
          .join(', ')}.`}
        confirmLabel="Registrar tanda"
        onCancel={() => setAskBatch(false)}
        onConfirm={registerBatch}
      />
    </>
  );
}

function OdsSection() {
  const data = useJemStore((s) => s.data);
  const registerWaste = useJemStore((s) => s.registerWaste);
  const [flavor, setFlavor] = useState<FlavorId>('clasico');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const wasted = totalWasted(data);
  const wastedWeek = totalWasted(data, rangeStart('7d', data));
  const prepared = data.movements.filter((m) => m.type === 'produccion').reduce((s, m) => s + m.qty, 0);
  const share = prepared ? (wasted / prepared) * 100 : 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) {
      setError('Ingresa una cantidad entera mayor que cero.');
      return;
    }
    const r = registerWaste(flavor, n, 'Sobrante registrado al cierre');
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setError('');
    setQty('');
    toast.success('Sobrante registrado', r.message);
  };

  return (
    <section className="ods" aria-labelledby="ods-title">
      <div className="ods__intro">
        <span className="ods__badge">ODS 12 — Producción y consumo responsables</span>
        <h2 id="ods-title">Producir mejor también importa.</h2>
        <p>
          Buscamos preparar cantidades más ajustadas a la demanda para reducir unidades sin vender y mejorar el
          aprovechamiento de nuestros insumos.
        </p>
      </div>
      <div className="ods__metric">
        <Recycle size={22} aria-hidden />
        <p className="ods__label">Unidades sin vender o retiradas</p>
        <p className="ods__value">{wasted}</p>
        <p className="ods__hint">
          {wastedWeek} en los últimos 7 días · {formatNumber(share)} % de lo producido
        </p>
      </div>
      <form className="ods__form" onSubmit={onSubmit} noValidate>
        <h3>Registrar sobrantes</h3>
        <div className="field">
          <label htmlFor="ods-flavor">Sabor</label>
          <select id="ods-flavor" className="select" value={flavor} onChange={(e) => setFlavor(e.target.value as FlavorId)}>
            {FLAVORS.map((f) => (
              <option key={f} value={f}>
                {PRODUCT_BY_ID[f].name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ods-qty">Unidades sin vender</label>
          <input
            id="ods-qty"
            className="input"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'ods-error' : undefined}
          />
        </div>
        {error && (
          <p className="error" id="ods-error" role="alert">
            <TriangleAlert size={14} aria-hidden /> {error}
          </p>
        )}
        <button type="submit" className="btn btn--olive">
          Registrar sobrante
        </button>
      </form>
    </section>
  );
}
