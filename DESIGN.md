# Design

## Visual Theme
Producto serio y corporativo (ERP interno). Base neutra fría con azul como único color de marca; el resto de la paleta (verde/amber/rojo/violeta) es estrictamente semántica (éxito/advertencia/error/info), nunca decorativa. Superficies planas, bordes sutiles (`border-border` ~11% opacidad), sin sombras pesadas ni glassmorphism. Modo claro y oscuro soportados vía `.dark` con los mismos tokens semánticos.

## Color Palette (OKLCH, definidos en `app/globals.css`)
- `--background` 0.99 0.002 250 · `--foreground` 0.13 0.006 250 (casi blanco / casi negro, tinte azul mínimo)
- `--primary` 0.52 0.22 250 (azul) — único acento de marca
- `--muted` / `--muted-foreground` — texto secundario, fondos de skeleton
- `--destructive` 0.577 0.245 27.325 (rojo) — solo error/riesgo
- Semánticos de chart: `--chart-1` azul (primary/neutral), `--chart-2` verde (éxito/pagado), `--chart-3` amber (advertencia/pendiente), `--chart-4` rojo (error/vencido), `--chart-5` violeta (info/categoría secundaria)
- Sidebar con tokens propios, más oscuro que el body en dark mode

## Typography
- `--font-sans`: Geist Sans (var `--font-geist-sans`), `--font-mono`: Geist Mono
- Números: `tabular-nums` + a menudo `font-mono` en tablas/KPIs para alineación consistente
- Jerarquía actual conservadora: labels en `text-sm font-medium text-muted-foreground`, valores grandes en `text-3xl font-semibold`

## Components
- `KpiCard` (`components/shared/KpiCard.tsx`): card con label + valor grande + delta opcional (▲/▼ con color semántico) + contexto. Patrón repetido en todas las páginas de lista (trabajadores, clientes, pagos, cotizaciones).
- `ChartContainer` + primitivas (`components/ui/chart.tsx`, shadcn sobre Recharts): tooltips y leyendas ya themeadas con los tokens `--chart-*`.
- Base UI (`@base-ui-components/react`) como capa de primitivas sin estilar; shadcn style `base-nova` sobre Tailwind v4.
- Iconos: `lucide-react`, tamaño típico `size-4` en headers de sección.
- Radios: escala basada en `--radius: 0.5rem` con variantes sm/md/lg/xl/2xl/3xl/4xl vía `calc()`.

## Layout
- Shell: sidebar fijo + navbar superior (`app/(dashboard)/layout.tsx`), contenido en `flex h-dvh overflow-hidden`.
- Páginas de lista: `space-y-3` con bloque de KPIs (grid 2 cols mobile / 4 cols `lg`) + Suspense/skeleton, luego tabla.
- Sin un componente de página con header/breadcrumb propio todavía — cada página asume que el navbar da el contexto.

## Motion
Tokens ya definidos pero subutilizados: `--ease-out`, `--ease-in-out`, `--ease-drawer` (cubic-bezier). Loading states hoy son solo `animate-pulse` en skeletons. No hay entrada animada de contenido ni transiciones entre estados.
