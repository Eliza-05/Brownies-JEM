# Brownies JEM Smart

Prototipo web interactivo de **Brownies JEM**, emprendimiento universitario de brownies artesanales en Bogotá.
Una sola aplicación con dos experiencias que comparten los mismos datos:

- **La tienda** — catálogo de sabores, carrito, reserva en tres pasos, "Mis reservas", contacto y sugerencias.
- **Panel JEM** — resumen, pedidos, inventario, estadísticas, planificación de producción (ODS 12) y opiniones.

> Prototipo académico. No hay backend, pagos, autenticación ni mensajes reales. Los datos son simulados
> y se guardan solo en el navegador (`localStorage`).

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (probado con Node 24).

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Vite abrirá el navegador automáticamente; si no, entra a la URL que aparece en la terminal
(normalmente <http://localhost:5173>).

Otros comandos:

| Comando             | Qué hace                                         |
| ------------------- | ------------------------------------------------ |
| `npm run build`     | Verifica tipos (TypeScript) y genera `dist/`     |
| `npm run preview`   | Sirve la versión compilada para revisarla        |
| `npm run typecheck` | Solo verifica tipos                              |

## Guion sugerido para la sustentación

1. Abrir la tienda y recorrer el hero, beneficios y **Sabores**.
2. En **Brownie Oreo**, subir la cantidad a 2 y pulsar **Agregar** (el contador del carrito se actualiza).
3. Abrir el carrito → **Iniciar reserva** → **Continuar a la recogida**.
4. Escribir nombre y contacto, elegir una franja y pulsar **Registrar reserva**.
5. Pulsar **Panel JEM** (arriba a la derecha). El pedido aparece en **Pedidos por atender**.
6. En **Inventario**, el Oreo muestra las 2 unidades como *Reservado* (disponibles bajan de 30 a 28).
7. En **Pedidos**, **Confirmar** y luego **Entregar**.
8. Volver a **Resumen**: los ingresos suben $10.000 y las unidades vendidas suben 2.
9. Revisar **Estadísticas** (filtros Hoy / Últimos 7 días / Periodo completo) y **Planificación**.
10. Al terminar, **Restablecer demostración** (barra lateral del panel) deja todo como al inicio.

## Reglas de negocio

Todas las cifras se derivan de los mismos registros (`src/utils/metrics.ts`), por eso nunca se descuenta dos veces:

- **Reservar** aparta unidades (disponible ↓, reservado ↑). **Cancelar** las devuelve.
- **Entregar** convierte lo reservado en vendido y recién ahí cuenta como ingreso.
- Flujo permitido: Pendiente → Confirmado → Entregado; Pendiente/Confirmado → Cancelado.
- **Ingresos** = pedidos entregados + ventas directas registradas. Las reservas pendientes no son ventas.
- Inventario: `preparado = disponible + reservado + vendido + retirado`; nunca hay cantidades negativas.
- **Planificación** (regla aritmética, sin IA): promedio de las últimas 7 jornadas, demanda que falta hoy,
  posible sobrante al cierre y unidades sugeridas para la próxima tanda (editables).

## Estructura

```
src/
  components/   store/ (tienda) · panel/ · charts/ · ui/ (modal, toasts, marca)
  pages/        store/ · panel/
  layouts/      StoreLayout · PanelLayout
  data/         tipos, productos y datos de demostración deterministas (seed.ts)
  store/        estado de negocio único (Zustand + localStorage), toasts y UI
  hooks/        useFocusTrap (accesibilidad de modales)
  utils/        formato COP/fechas y métricas derivadas
  styles/       tokens de diseño, base, componentes, tienda y panel
```

## Personalización rápida

- **Fotografías**: reemplaza los archivos de `public/images/` manteniendo los nombres
  (`brownie-clasico.jpg`, `brownie-oreo.jpg`, `brownie-manjar.jpg`, `brownies-torre.jpg`).
  Las actuales son ilustrativas, de [Unsplash](https://unsplash.com) (licencia Unsplash). Si una imagen no carga,
  se muestra una ilustración vectorial del sabor.
- **WhatsApp**: escribe el número oficial (con indicativo, solo dígitos, p. ej. `573001234567`) en
  `WHATSAPP_NUMBER` dentro de `src/components/store/Sections.tsx`. Mientras esté vacío, el botón muestra un aviso
  de demostración.
- **Precios, sabores y franjas**: `src/data/products.ts`.
- **Datos iniciales**: `src/data/seed.ts` (inventario inicial 24 / 30 / 18).

## Accesibilidad y diseño

- Navegación con teclado, foco visible, enlace "Saltar al contenido", modales y carrito con foco atrapado y cierre
  con `Esc`.
- Formularios con etiquetas, mensajes de error asociados (`aria-describedby`) y avisos en vivo.
- Cada gráfico tiene un resumen para lectores de pantalla y un botón **Ver tabla**.
- Respeta `prefers-reduced-motion`.
- Los botones primarios usan un caramelo más profundo (`#A9572D`) para que el texto blanco cumpla el contraste
  WCAG AA; el caramelo `#C56C3D` se usa en acentos y textos grandes.
- Los colores de los sabores en los gráficos (`#9A4F2C`, `#4E6B78`, `#D8973C`) se validaron frente a daltonismo y
  contraste sobre el fondo crema.

Tipografías: Fraunces (títulos) y DM Sans (interfaz), desde Google Fonts. Sin conexión se usan serif y sans-serif del
sistema.
