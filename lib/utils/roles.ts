export type Role = 'supervisor' | 'logistica' | 'gerencia' | 'administrador';

const permissions: Record<string, Role[]> = {
  'obras:write': ['administrador'],
  'trabajadores:write': ['administrador', 'logistica'],
  'proveedores:write': ['administrador'],
  'users:manage': ['administrador'],
};

export function can(role: Role, action: string): boolean {
  return permissions[action]?.includes(role) ?? false;
}
