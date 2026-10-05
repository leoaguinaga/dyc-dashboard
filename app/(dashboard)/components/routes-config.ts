import {
  Home,
  Building2,
  Users,
  Truck,
  UserCog,
  Building,
  ClipboardList,
  Warehouse,
  ShoppingCart,
  BarChart2,
  Wallet,
  UserCheck,
  Receipt,
  Landmark,
  type LucideIcon,
  Handshake,
} from "lucide-react";
import type { MisModulos, ModuloKey, Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  /** Módulo cuyo acceso configurable controla este ítem (además de `roles`). */
  modulo?: ModuloKey;
  disabled?: boolean;
  sprint?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  hideLabel?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Inicio",
    hideLabel: true,
    items: [
      {
        href: "/dashboard",
        label: "Inicio",
        icon: Home,
        roles: [
          "supervisor",
          "supervisor_civil",
          "supervisor_electrico",
          "pdr",
          "logistica",
          "gerencia",
          "administrador",
          "admin_ti",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
    ],
  },
  {
    label: "Obras",
    items: [
      {
        href: "/proyectos",
        modulo: "proyectos",
        label: "Proyectos",
        icon: Building2,
        roles: [
          "pdr",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
          "logistica",
          "gerencia",
          "administrador",
        ],
      },
      {
        href: "/asistencia",
        modulo: "asistencia",
        label: "Asistencia",
        icon: UserCheck,
        roles: ["administrador", "gerencia", "jefe_sig", "pdr"],
      },
    ],
  },
  {
    label: "Abastecimiento",
    items: [
      {
        href: "/solicitudes",
        modulo: "solicitudes",
        label: "Solicitudes",
        icon: ClipboardList,
        roles: [
          "administrador",
          "logistica",
          "gerencia",
          "supervisor",
          "supervisor_civil",
          "supervisor_electrico",
          "pdr",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
      // {
      //   href: "/requerimientos",
      //   label: "Requerimientos",
      //   icon: ClipboardList,
      //   roles: [
      //     "administrador",
      //     "logistica",
      //     "gerencia",
      //     "ing_civil",
      //     "ing_electrico",
      //     "jefe_sig",
      //   ],
      // },
      {
        href: "/cotizaciones",
        modulo: "cotizaciones",
        label: "Cotizaciones",
        icon: Handshake,
        roles: [
          "administrador",
          "gerencia",
          "logistica",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
      {
        href: "/ordenes",
        modulo: "ordenes",
        label: "Órdenes de C/S",
        icon: ShoppingCart,
        roles: ["administrador", "gerencia", "logistica"],
      },
      // {
      //   href: "/compras-simples",
      //   label: "Compras",
      //   icon: ShoppingBag,
      //   roles: [
      //     "administrador",
      //     "gerencia",
      //     "logistica",
      //     "ing_civil",
      //     "ing_electrico",
      //     "jefe_sig",
      //   ],
      // },
      {
        href: "/almacenes",
        modulo: "almacenes",
        label: "Almacenes",
        icon: Warehouse,
        roles: [
          "administrador",
          "logistica",
          "gerencia",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
      {
        href: "/proveedores",
        modulo: "proveedores",
        label: "Proveedores",
        icon: Truck,
        roles: [
          "administrador",
          "logistica",
          "gerencia",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        href: "/pagos",
        modulo: "pagos",
        label: "Pagos",
        icon: Wallet,
        roles: [
          "administrador",
          "gerencia",
          "logistica",
          "supervisor",
          "supervisor_civil",
          "supervisor_electrico",
          "pdr",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
      {
        href: "/cobros",
        modulo: "cobros",
        label: "Cobros",
        icon: Landmark,
        roles: ["administrador", "gerencia"],
      },
      {
        href: "/planilla",
        modulo: "planilla",
        label: "Planilla",
        icon: Receipt,
        roles: ["administrador", "gerencia"],
      },
    ],
  },
  {
    label: "Directorio",
    items: [
      {
        href: "/clientes",
        modulo: "clientes",
        label: "Clientes",
        icon: Building,
        roles: [
          "administrador",
          "gerencia",
          "logistica",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
      {
        href: "/trabajadores",
        modulo: "trabajadores",
        label: "Trabajadores",
        icon: Users,
        roles: [
          "administrador",
          "logistica",
          "gerencia",
          "ing_civil",
          "ing_electrico",
          "jefe_sig",
        ],
      },
    ],
  },
  {
    label: "Control y sistema",
    items: [
      {
        href: "/reportes",
        modulo: "reportes",
        label: "Reportes",
        icon: BarChart2,
        roles: ["administrador", "gerencia"],
      },
      {
        href: "/usuarios",
        modulo: "usuarios",
        label: "Usuarios",
        icon: UserCog,
        roles: ["administrador", "gerencia", "admin_ti"],
      },
    ],
  },
];

/**
 * Un ítem se ve si su rol lo incluye, salvo que haya una excepción de acceso
 * para su módulo: entonces manda la excepción (cualquier nivel salvo "ninguno").
 */
export function itemVisible(
  item: NavItem,
  role: Role,
  excepciones: Partial<MisModulos> = {},
): boolean {
  // TI es el rol maestro del sistema y necesita visibilidad operativa completa.
  if (role === "admin_ti") return true;
  const excepcion = item.modulo ? excepciones[item.modulo] : null;
  if (excepcion) return excepcion !== "ninguno";
  return item.roles.includes(role);
}

export function getVisibleGroups(
  role: Role | undefined,
  excepciones: Partial<MisModulos> = {},
): NavGroup[] {
  if (!role) return [];

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => itemVisible(item, role, excepciones)),
  })).filter((group) => group.items.length > 0);
}

export function findNavItem(pathname: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(
      (i) => !i.disabled && pathname.startsWith(i.href),
    );
    if (item) return item;
  }
  return undefined;
}

export function findNavGroup(pathname: string): NavGroup | undefined {
  for (const group of NAV_GROUPS) {
    if (group.items.some((i) => !i.disabled && pathname.startsWith(i.href)))
      return group;
  }
  return undefined;
}
