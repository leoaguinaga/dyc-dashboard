import {
  Home,
  Building2,
  Users,
  Truck,
  UserCog,
  Building,
  ClipboardList,
  FileText,
  Warehouse,
  ShoppingCart,
  BarChart2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types/api'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
  disabled?: boolean
  sprint?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: Home,
        roles: ['supervisor', 'logistica', 'gerencia', 'administrador'],
      },
      {
        href: '/proyectos',
        label: 'Proyectos',
        icon: Building2,
        roles: [
          'supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr',
          'ing_civil', 'ing_electrico', 'jefe_sig',
          'logistica', 'gerencia', 'administrador',
        ],
      },
      {
        href: '/clientes',
        label: 'Clientes',
        icon: Building,
        roles: ['administrador', 'gerencia', 'logistica'],
      },
    ],
  },
  {
    label: 'Maestros',
    items: [
      {
        href: '/trabajadores',
        label: 'Trabajadores',
        icon: Users,
        roles: ['administrador', 'logistica'],
      },
      {
        href: '/proveedores',
        label: 'Proveedores',
        icon: Truck,
        roles: ['administrador', 'logistica'],
      },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      {
        href: '/requerimientos',
        label: 'Requerimientos',
        icon: ClipboardList,
        roles: [
          'administrador', 'logistica', 'gerencia', 'supervisor',
          'supervisor_civil', 'supervisor_electrico', 'pdr',
          'ing_civil', 'ing_electrico', 'jefe_sig',
        ],
      },
      {
        href: '/cotizaciones',
        label: 'Cotizaciones',
        icon: FileText,
        roles: ['administrador', 'gerencia', 'logistica'],
      },
      {
        href: '/almacenes',
        label: 'Almacenes',
        icon: Warehouse,
        roles: ['administrador', 'logistica'],
      },
      {
        href: '/ordenes-compra',
        label: 'Órdenes compra',
        icon: ShoppingCart,
        roles: ['administrador', 'gerencia', 'logistica'],
      },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      {
        href: '/pagos',
        label: 'Pagos',
        icon: Wallet,
        roles: ['administrador', 'gerencia'],
      },
    ],
  },
  {
    label: 'Reportes',
    items: [
      {
        href: '/reportes',
        label: 'Reportes',
        icon: BarChart2,
        roles: ['administrador', 'gerencia'],
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        href: '/usuarios',
        label: 'Usuarios',
        icon: UserCog,
        roles: ['administrador'],
      },
    ],
  },
]

export function getVisibleGroups(role: Role | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !role || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function findNavItem(pathname: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => !i.disabled && pathname.startsWith(i.href))
    if (item) return item
  }
  return undefined
}

export function findNavGroup(pathname: string): NavGroup | undefined {
  for (const group of NAV_GROUPS) {
    if (group.items.some((i) => !i.disabled && pathname.startsWith(i.href))) return group
  }
  return undefined
}
