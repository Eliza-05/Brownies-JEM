import { AnimatePresence, motion } from 'motion/react';
import { CookingPot, Store, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Card, FlavorDot, PanelHeader } from '../../components/panel/PanelBits';
import { ProductImage } from '../../components/ui/Brand';
import { FLAVORS, LOW_STOCK_THRESHOLD, PRODUCTS, PRODUCT_BY_ID, SLOTS } from '../../data/products';
import type { FlavorId, MovementType, SlotId } from '../../data/types';
import { useJemStore } from '../../store/useJemStore';
import { toast } from '../../store/useToast';
import { formatDateTime } from '../../utils/format';
import { allStock } from '../../utils/metrics';

const MOVEMENT_LABEL: Record<MovementType, string> = {
  produccion: 'Nueva producción',
  correccion: 'Corrección de inventario',
  no_apto: 'Producto no apto para venta',
};

export function InventoryManager() {
  const data = useJemStore((s) => s.data);
  const stock = useMemo(() => allStock(data), [data]);
  const movements = useMemo(() => [...data.movements].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14), [data.movements]);

  return (
    <>
      <PanelHeader
        eyebrow="Inventario"
        title="Lo que hay en la bandeja"
        subtitle="Reservar aparta unidades, cancelar las devuelve y entregar las convierte en venta. Nada se descuenta dos veces."
      />

      <div className="stock-grid">
        {PRODUCTS.map((p) => {
          const s = stock[p.id];
          const low = s.available <= LOW_STOCK_THRESHOLD;
          return (
            <article key={p.id} className={`stock-card${low ? ' is-low' : ''}`} aria-labelledby={`stock-${p.id}`}>
              <ProductImage src={p.image} alt="" flavor={p.id} className="stock-card__img" />
              <div className="stock-card__body">
                <h2 id={`stock-${p.id}`}>
                  <FlavorDot color={p.color} />
                  {p.name}
                </h2>
                <div className="stock-card__available">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.strong
                      key={s.available}
                      initial={{ scale: 1.25, color: '#C56C3D' }}
                      animate={{ scale: 1, color: '#30201B' }}
                      transition={{ duration: 0.6 }}
                    >
                      {s.available}
                    </motion.strong>
                  </AnimatePresence>
                  <span>disponibles</span>
                </div>
                {low && (
                  <p className="stock-card__warn">
                    <TriangleAlert size={15} aria-hidden /> Pocas existencias
                  </p>
                )}
                <dl className="stock-card__facts">
                  <div>
                    <dt>Total preparado</dt>
                    <dd>{s.prepared}</dd>
                  </div>
                  <div>
                    <dt>Reservado</dt>
                    <dd>{s.reserved}</dd>
                  </div>
                  <div>
                    <dt>Vendido</dt>
                    <dd>{s.sold}</dd>
                  </div>
                  <div>
                    <dt>Retirado</dt>
                    <dd>{s.wasted}</dd>
                  </div>
                </dl>
                <StockBar prepared={s.prepared} sold={s.sold} reserved={s.reserved} wasted={s.wasted} available={s.available} />
              </div>
            </article>
          );
        })}
      </div>
      <p className="panel-footnote">
        Total preparado incluye producciones y correcciones de todo el periodo: preparado = disponible +
        reservado + vendido + retirado.
      </p>

      <div className="inventory-forms">
        <MovementForm />
        <DirectSaleForm />
      </div>

      <Card title="Movimientos de inventario" subtitle="Los 14 más recientes">
        <div className="table-wrap">
          <table className="orders-table">
            <caption className="sr-only">Movimientos de inventario</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Sabor</th>
                <th scope="col">Motivo</th>
                <th scope="col" className="num">
                  Unidades
                </th>
                <th scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const sign = m.type === 'no_apto' ? -m.qty : m.qty;
                return (
                  <tr key={m.id}>
                    <td data-label="Fecha">{formatDateTime(m.at)}</td>
                    <th scope="row" data-label="Sabor">
                      {PRODUCT_BY_ID[m.flavor].shortName}
                    </th>
                    <td data-label="Motivo">{MOVEMENT_LABEL[m.type]}</td>
                    <td data-label="Unidades" className={`num ${sign < 0 ? 'neg' : 'pos'}`}>
                      {sign > 0 ? `+${sign}` : sign}
                    </td>
                    <td data-label="Nota" className="muted">
                      {m.note ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function StockBar({ prepared, sold, reserved, wasted, available }: { prepared: number; sold: number; reserved: number; wasted: number; available: number }) {
  const total = Math.max(prepared, 1);
  const parts = [
    { k: 'sold', v: sold, label: 'Vendido' },
    { k: 'reserved', v: reserved, label: 'Reservado' },
    { k: 'available', v: available, label: 'Disponible' },
    { k: 'wasted', v: wasted, label: 'Retirado' },
  ];
  return (
    <div className="stockbar" role="img" aria-label={parts.map((p) => `${p.label}: ${p.v}`).join(', ')}>
      {parts.map((p) => (p.v > 0 ? <span key={p.k} className={`stockbar__${p.k}`} style={{ flexGrow: p.v / total }} title={`${p.label}: ${p.v}`} /> : null))}
    </div>
  );
}

function MovementForm() {
  const { registerProduction, adjustStock, registerWaste } = useJemStore();
  const [flavor, setFlavor] = useState<FlavorId>('clasico');
  const [type, setType] = useState<MovementType>('produccion');
  const [direction, setDirection] = useState<'sumar' | 'restar'>('sumar');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(qty);
    if (!qty || !Number.isInteger(n) || n <= 0) {
      setError('Ingresa una cantidad entera mayor que cero.');
      return;
    }
    if (n > 500) {
      setError('Revisa la cantidad: parece demasiado alta para una tanda.');
      return;
    }
    const r =
      type === 'produccion'
        ? registerProduction(flavor, n, note)
        : type === 'correccion'
          ? adjustStock(flavor, direction === 'sumar' ? n : -n, note)
          : registerWaste(flavor, n, note);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setError('');
    setQty('');
    setNote('');
    toast.success('Inventario actualizado', r.message);
  };

  return (
    <Card title="Registrar movimiento" subtitle="Producción, correcciones o unidades no aptas">
      <form className="form-grid" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="mv-type">Motivo</label>
          <select id="mv-type" className="select" value={type} onChange={(e) => setType(e.target.value as MovementType)}>
            {(Object.keys(MOVEMENT_LABEL) as MovementType[]).map((k) => (
              <option key={k} value={k}>
                {MOVEMENT_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mv-flavor">Sabor</label>
          <select id="mv-flavor" className="select" value={flavor} onChange={(e) => setFlavor(e.target.value as FlavorId)}>
            {FLAVORS.map((f) => (
              <option key={f} value={f}>
                {PRODUCT_BY_ID[f].name}
              </option>
            ))}
          </select>
        </div>
        {type === 'correccion' && (
          <fieldset className="choice-group form-grid__full">
            <legend>Tipo de ajuste</legend>
            <label className="choice">
              <input type="radio" name="mv-dir" checked={direction === 'sumar'} onChange={() => setDirection('sumar')} />
              <span>Sumar unidades</span>
            </label>
            <label className="choice">
              <input type="radio" name="mv-dir" checked={direction === 'restar'} onChange={() => setDirection('restar')} />
              <span>Restar unidades</span>
            </label>
          </fieldset>
        )}
        <div className="field">
          <label htmlFor="mv-qty">Unidades</label>
          <input
            id="mv-qty"
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'mv-error' : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="mv-note">Nota (opcional)</label>
          <input id="mv-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} />
        </div>
        {error && (
          <p className="error form-grid__full" id="mv-error" role="alert">
            <TriangleAlert size={14} aria-hidden /> {error}
          </p>
        )}
        <button type="submit" className="btn form-grid__full">
          <CookingPot size={18} aria-hidden />
          Registrar movimiento
        </button>
      </form>
    </Card>
  );
}

function DirectSaleForm() {
  const registerDirectSale = useJemStore((s) => s.registerDirectSale);
  const [flavor, setFlavor] = useState<FlavorId>('oreo');
  const [slot, setSlot] = useState<SlotId>('s2');
  const [qty, setQty] = useState('1');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) {
      setError('Ingresa una cantidad entera mayor que cero.');
      return;
    }
    const r = registerDirectSale(flavor, n, slot);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setError('');
    setQty('1');
    toast.success('Venta registrada', r.message);
  };

  return (
    <Card title="Registrar venta directa" subtitle="Ventas sin reserva, en el punto de venta">
      <form className="form-grid" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="vd-flavor">Sabor</label>
          <select id="vd-flavor" className="select" value={flavor} onChange={(e) => setFlavor(e.target.value as FlavorId)}>
            {FLAVORS.map((f) => (
              <option key={f} value={f}>
                {PRODUCT_BY_ID[f].name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="vd-slot">Franja</label>
          <select id="vd-slot" className="select" value={slot} onChange={(e) => setSlot(e.target.value as SlotId)}>
            {SLOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field form-grid__full">
          <label htmlFor="vd-qty">Unidades vendidas</label>
          <input
            id="vd-qty"
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'vd-error' : undefined}
          />
        </div>
        {error && (
          <p className="error form-grid__full" id="vd-error" role="alert">
            <TriangleAlert size={14} aria-hidden /> {error}
          </p>
        )}
        <button type="submit" className="btn btn--dark form-grid__full">
          <Store size={18} aria-hidden />
          Registrar venta
        </button>
      </form>
    </Card>
  );
}
