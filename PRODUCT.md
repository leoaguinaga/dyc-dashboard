# Product

## Register

product

## Users
Personal interno de Díaz y Castillo Ingeniería y Proyectos (constructora): supervisores de obra, logística, gerencia y administración. Roles adicionales: supervisor_civil, supervisor_electrico, pdr, ing_civil, ing_electrico, jefe_sig. Usan el sistema en jornada laboral, muchas veces bajo presión de tiempo (aprobar requerimientos, emitir órdenes de compra, controlar pagos) — priorizan velocidad y claridad sobre estética.

## Product Purpose
ERP interno que cubre el ciclo completo de una obra: proyectos y trabajadores → requerimientos de material → cotizaciones a proveedores → órdenes de compra → pagos. El dashboard es el punto de entrada que debe responder rápido "¿qué necesita mi atención hoy?" (hitos por vencer, requerimientos pendientes, pagos vencidos) y "¿cómo va el negocio?" (gasto, ahorro por adjudicación, estado de inventario). Éxito = gerencia y logística dejan de pedir reportes por WhatsApp/Excel porque la info ya está aquí.

## Brand Personality
Serio, confiable, sin distracciones — software de gestión financiera/de ingeniería, no una app de consumo. Inspiración: Linear/Vercel (minimalista, mucho aire, tipografía cuidada, color usado con moderación y con propósito, nunca decorativo).

## Anti-references
- No admin template genérico (Bootstrap/AdminLTE look): cards idénticas, iconos de stock sin criterio, sombras exageradas.
- No estética "SaaS consumer" (gradientes, ilustraciones playful, emojis) — esto es una herramienta de trabajo seria.
- No parecer una hoja de Excel exportada a HTML.

## Design Principles
1. **Jerarquía antes que decoración**: el dato más importante de cada sección debe leerse primero sin esfuerzo; el color se reserva para señalar estado (riesgo, éxito, neutral), no para decorar.
2. **Densidad legible**: los usuarios necesitan ver mucho de un vistazo (varios módulos: proyectos, compras, pagos), pero sin saturar — usar aire y agrupación, no reducir tamaño de fuente como atajo.
3. **Consistencia de sistema**: reutilizar los tokens y componentes ya existentes (`KpiCard`, `--chart-1..5`, Base UI) en vez de introducir nuevos patrones visuales por pantalla.
4. **Confianza en los números**: tipografía tabular, alineación numérica consistente, nunca ambigüedad sobre si un valor es bueno o malo (verde/rojo con criterio, no decorativo).

## Accessibility & Inclusion
Sin requisitos formales de WCAG documentados aún — se asume como objetivo razonable WCAG AA (contraste ≥4.5:1 en texto de cuerpo, ≥3:1 en texto grande) dado que es una herramienta de uso diario en jornada laboral, posiblemente en exteriores/obra con luz variable. `prefers-reduced-motion` debe respetarse en cualquier animación.
