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
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
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
        label: "Asistencia",
        icon: UserCheck,
        roles: ["administrador", "gerencia", "pdr"],
      },
    ],
  },
  {
    label: "Abastecimiento",
    items: [
      {
        href: "/solicitudes",
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
        label: "Cobros",
        icon: Landmark,
        roles: ["administrador", "gerencia"],
      },
      {
        href: "/planilla",
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
        label: "Reportes",
        icon: BarChart2,
        roles: ["administrador", "gerencia"],
      },
      {
        href: "/usuarios",
        label: "Usuarios",
        icon: UserCog,
        roles: ["administrador", "gerencia", "admin_ti"],
      },
    ],
  },
];

export function getVisibleGroups(role: Role | undefined): NavGroup[] {
  if (!role) return [];
  // TI es el rol maestro del sistema y necesita visibilidad operativa completa.
  if (role === "admin_ti") return NAV_GROUPS;

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
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
