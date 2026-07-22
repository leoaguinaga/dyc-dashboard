export type Role =
  | 'supervisor'
  | 'supervisor_civil'
  | 'supervisor_electrico'
  | 'pdr'
  | 'ing_civil'
  | 'ing_electrico'
  | 'jefe_sig'
  | 'logistica'
  | 'gerencia'
  | 'administrador';

export type TipoRequerimiento = 'electrico' | 'civil' | 'seguridad' | 'administrativo';
export type EstadoProyecto = 'planificacion' | 'ejecucion' | 'cierre' | 'liquidada';
export type AmbitoGeografico = 'local' | 'nacional' | 'internacional';
export type CumplimientoHito = 'si' | 'no' | 'programado';
export type TipoAlmacen = 'fijo' | 'temporal';
export type TipoItem = 'consumible' | 'activo';
export type UnidadMedida =
  | 'und' | 'kg' | 'm' | 'm2' | 'm3' | 'l'
  | 'gal' | 'bolsa' | 'caja' | 'rollo' | 'par' | 'juego';
export type EstadoRequerimiento = 'borrador' | 'enviado' | 'aprobado' | 'observado';
export type EstadoSolicitud =
  | 'borrador' | 'enviada' | 'cotizada'
  | 'seleccionada' | 'aprobada_solicitante' | 'aprobada_gerencia'
  | 'cancelada';
export type EstadoCotizacion = 'pendiente' | 'recibida' | 'aprobada' | 'rechazada' | 'sin_respuesta';
export type EstadoOrdenCompra = 'borrador' | 'emitida' | 'recibida_parcial' | 'recibida' | 'cancelada';
export type EstadoPago = 'pendiente' | 'pagado' | 'cancelado';
export type EstadoPagoEfectivo = EstadoPago | 'vencido';
export type TipoBeneficiario = 'proveedor' | 'trabajador';

export interface User {
  id: string;
  name: string;
  email: string;
  correoContacto?: string | null;
  role: Role;
  cargo?: string | null;
  createdAt: string;
}

export interface ContactoCliente {
  id: string;
  nombre: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  clienteId: string;
  creadoEn: string;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  nombreComercial?: string;
  ruc?: string;
  direccion?: string;
  activo: boolean;
  creadoEn: string;
  contactos?: ContactoCliente[];
  proyectos?: Pick<Proyecto, 'id' | 'codigo' | 'nombre' | 'estado' | 'fechaInicio' | 'fechaFin' | 'coordinadorEmpresa'>[];
  _count?: { proyectos: number; contactos: number };
}

export interface Hito {
  id: string;
  proyectoId: string;
  nombre: string;
  fechaProgramada: string;
  evidencia?: string;
  cumplimiento: CumplimientoHito;
  responsableId: string;
  responsable?: Pick<Trabajador, 'id' | 'nombre' | 'cargo'>;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Proyecto {
  id: string;
  codigo?: string;
  nombre: string;
  ciudad?: string;
  direccion?: string;
  comuna?: string;
  ambitoGeografico?: AmbitoGeografico;

  parentId?: string;
  parent?: Pick<Proyecto, 'id' | 'nombre' | 'codigo'>;
  subproyectos?: Pick<Proyecto, 'id' | 'nombre' | 'codigo' | 'estado'>[];

  clienteId?: string;
  cliente?: Pick<Cliente, 'id' | 'razonSocial' | 'nombreComercial'>;

  coordinadorClienteId?: string;
  coordinadorCliente?: Pick<ContactoCliente, 'id' | 'nombre' | 'cargo' | 'email' | 'telefono'>;
  coordinadorEmpresaId?: string;
  coordinadorEmpresa?: Pick<Trabajador, 'id' | 'nombre' | 'cargo' | 'email' | 'telefono'>;
  ejecutorId?: string;
  ejecutor?: Pick<Trabajador, 'id' | 'nombre' | 'cargo' | 'email' | 'telefono'>;
  prevencionistaId?: string;
  prevencionista?: Pick<Trabajador, 'id' | 'nombre' | 'cargo' | 'email' | 'telefono'>;

  fechaInicio?: string;
  fechaFin?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  notaInicioReal?: string;

  estado: EstadoProyecto;
  creadaEn: string;
  actualizadaEn?: string;
  supervisores?: { userId: string; user: Pick<User, 'id' | 'name' | 'email'> }[];
  trabajadores?: {
    id: string;
    trabajadorId: string;
    fechaIngreso: string;
    fechaSalida?: string;
    trabajador: Pick<Trabajador, 'id' | 'nombre' | 'cargo' | 'dni'>;
  }[];
  hitos?: Hito[];
}

export interface ProyectoTrabajador {
  id: string;
  proyectoId: string;
  trabajadorId: string;
  fechaIngreso: string;
  fechaSalida?: string;
  proyecto: Pick<Proyecto, 'id' | 'codigo' | 'nombre' | 'estado'>;
}

export interface Trabajador {
  id: string;
  nombre: string;
  dni: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  banco?: string;
  numeroCuenta?: string;
  activo: boolean;
  creadoEn?: string;
  userId?: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  proyectos?: ProyectoTrabajador[];
}

export interface ContactoProveedor {
  id: string;
  nombre: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  esPrincipal: boolean;
  proveedorId: string;
  creadoEn: string;
}

export interface Proveedor {
  id: string;
  razonSocial: string;
  ruc?: string;
  direccion?: string;
  departamento?: string;
  distrito?: string;
  rubro?: string;
  categoria?: string;
  banco?: string;
  numeroCuenta?: string;
  moneda?: string;
  condicionPago?: string;
  activo: boolean;
  creadoEn: string;
  contactos?: ContactoProveedor[];
  _count?: { contactos: number; cotizaciones: number };
}

export interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad: UnidadMedida;
  categoria?: string;
  tipo: TipoItem;
  activo: boolean;
  creadoEn: string;
}

export interface Almacen {
  id: string;
  nombre: string;
  tipo: TipoAlmacen;
  ciudad?: string;
  notas?: string;
  activo: boolean;
  creadoEn: string;
}

export interface CatalogoProductoProveedor {
  id: string;
  proveedorId: string;
  descripcion: string;
  precioRef: string;
  unidad: UnidadMedida;
  vigente: boolean;
  nota?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface RequerimientoItemArchivo {
  id: string;
  nombre: string;
  url: string;
}

export interface RequerimientoItem {
  id: string;
  requerimientoId: string;
  descripcion: string;
  cantidad: string;
  unidad: UnidadMedida;
  nota?: string;
  archivos?: RequerimientoItemArchivo[];
}

export interface Requerimiento {
  id: string;
  codigo: string;
  nombre: string;
  proyectoId: string;
  proyecto: Pick<Proyecto, 'id' | 'codigo' | 'nombre' | 'ciudad' | 'direccion' | 'comuna'>;
  creadoPorId: string;
  creadoPor: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  estado: EstadoRequerimiento;
  tipo: TipoRequerimiento;
  urgente: boolean;
  nota?: string;
  notaRevision?: string;
  fechaEntregaRequerida?: string;
  creadoEn: string;
  actualizadoEn: string;
  items: RequerimientoItem[];
  solicitudes?: Pick<SolicitudCotizacion, 'id' | 'codigo' | 'estado' | 'creadoEn'>[];
  historial?: RequerimientoHistorial[];
  _count?: { solicitudes: number };
}

export interface RequerimientoHistorial {
  id: string;
  requerimientoId: string;
  estado: EstadoRequerimiento;
  nota?: string;
  actorId?: string;
  actor?: Pick<User, 'id' | 'name' | 'role'> | null;
  actorRole?: Role;
  creadoEn: string;
}

export interface SolicitudItem {
  id: string;
  solicitudId: string;
  descripcion: string;
  unidad: UnidadMedida;
  itemInventarioId?: string;
  item?: Pick<ItemInventario, 'id' | 'codigo' | 'nombre' | 'unidad'> | null;
  cantidadTotal: string;
  cantidadAlmacen: string;
  cantidadCompra: string;
}

export interface CotizacionItem {
  id: string;
  cotizacionId: string;
  descripcionProveedor: string;
  itemInventarioId?: string;
  item?: Pick<ItemInventario, 'id' | 'codigo' | 'nombre'>;
  solicitudItemId?: string;
  precioUnit: string;
  cantidad: string;
  unidad: UnidadMedida;
  seleccionado: boolean;
}

export interface ItemSolicitadoProveedor extends CotizacionItem {
  cotizacion: {
    id: string;
    estado: EstadoCotizacion;
    solicitud: { id: string; codigo: string };
  };
}

export interface CotizacionCondicionPago {
  id: string;
  cotizacionId: string;
  porcentaje: string;
  fecha: string;
}

export interface CotizacionArchivo {
  id: string;
  cotizacionId: string;
  nombre: string;
  url: string;
  creadoEn: string;
}

export interface Cotizacion {
  id: string;
  solicitudId: string;
  proveedorId: string;
  proveedor: Pick<Proveedor, 'id' | 'razonSocial' | 'ruc'>;
  estado: EstadoCotizacion;
  fechaRecibida?: string;
  fechaEntrega?: string;
  validezDias?: number;
  condicionesServicio?: string;
  condicionesPago: CotizacionCondicionPago[];
  condicionPago?: string;
  incluyeIgv: boolean;
  nota?: string;
  creadoEn: string;
  items: CotizacionItem[];
  archivos?: CotizacionArchivo[];
}

export interface CotizacionConHistorial extends Cotizacion {
  solicitud: { id: string; codigo: string };
  archivos: CotizacionArchivo[];
}

export interface ProveedorEvaluacion {
  puntajeTotal: number | null;
  precioScore: number | null;
  plazosScore: number | null;
  calidadScore: number | null;
  muestraCotizaciones: number;
  muestraOCs: number;
}

export interface SolicitudCotizacion {
  id: string;
  codigo: string;
  proyectoId: string;
  proyecto?: Pick<Proyecto, 'id' | 'nombre' | 'codigo'>;
  requerimientoId?: string;
  estado: EstadoSolicitud;
  nota?: string;
  creadoEn: string;
  actualizadoEn: string;
  items: SolicitudItem[];
  cotizaciones: Cotizacion[];
  ordenes?: Pick<OrdenCompra, 'id' | 'numero' | 'estado'>[];
  _count?: { items: number; cotizaciones: number };
}

export interface OrdenCompraItem {
  id: string;
  ordenId: string;
  codigo?: string | null;
  descripcion: string;
  cantidad: string;
  unidad: UnidadMedida;
  precioUnitario: string;
  precioTotal: string;
}

export interface OrdenCompra {
  id: string;
  numero: string;
  nombre?: string | null;
  solicitudId: string;
  solicitud: Pick<SolicitudCotizacion, 'id' | 'codigo' | 'estado'> & {
    requerimiento?: Pick<Requerimiento, 'id' | 'codigo' | 'tipo'> | null;
  };
  proveedorId: string;
  proveedor: Pick<Proveedor, 'id' | 'razonSocial' | 'ruc' | 'direccion' | 'banco' | 'numeroCuenta' | 'moneda' | 'condicionPago'> & {
    contactos?: Pick<ContactoProveedor, 'nombre' | 'telefono'>[];
  };
  proyectoId: string;
  proyecto: Pick<Proyecto, 'id' | 'codigo' | 'nombre'> & { direccion?: string | null };
  estado: EstadoOrdenCompra;
  fechaEmision?: string;
  fechaEntrega?: string;
  montoTotal: string;
  nota?: string;
  lugarEntrega?: string | null;
  adelantoPorcentaje?: string | null;
  saldoPorcentaje?: string | null;
  detraccionPorcentaje?: string | null;
  incluyeIgv: boolean;
  tipoCambio?: string | null;
  contactoProveedorNombre?: string | null;
  contactoProveedorTelefono?: string | null;
  condicionPago?: string | null;
  referencia?: string | null;
  concepto?: string | null;
  tiempoEntrega?: string | null;
  contactoDycNombre?: string | null;
  contactoDycArea?: string | null;
  contactoDycCelular?: string | null;
  contactoDycTelefono?: string | null;
  creadoPorId: string;
  creadoPor: Pick<User, 'id' | 'name' | 'email'>;
  creadoEn: string;
  actualizadoEn: string;
  items: OrdenCompraItem[];
  _count?: { items: number };
}

export interface Pago {
  id: string;
  ordenCompraId: string;
  ordenCompra: Pick<OrdenCompra, 'id' | 'numero' | 'montoTotal'> & {
    proveedor: Pick<Proveedor, 'id' | 'razonSocial'>;
    proyecto: Pick<Proyecto, 'id' | 'codigo' | 'nombre'>;
  };
  tipoBeneficiario: TipoBeneficiario;
  monto: string;
  porcentaje: string;
  fechaProgramada: string;
  fechaPagoReal?: string | null;
  estado: EstadoPago;
  estadoEfectivo: EstadoPagoEfectivo;
  metodoPago?: string | null;
  numeroOperacion?: string | null;
  nota?: string | null;
  registradoPorId: string;
  registradoPor: Pick<User, 'id' | 'name'>;
  pagadoPorId?: string | null;
  pagadoPor?: Pick<User, 'id' | 'name'> | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ResumenPagos {
  totalPendiente: number;
  totalVencido: number;
  proximos7dias: number;
  pagadoMes: number;
}

export interface ReporteGastoPorProyecto {
  proyecto: { id: string; codigo: string | null; nombre: string };
  totalOcs: number;
  montoTotal: number;
}

export interface ReporteOcsPorProveedor {
  proveedor: { id: string; razonSocial: string };
  totalOcs: number;
  montoTotal: number;
}

export interface ReportePagosPorPeriodo {
  periodo: string;
  pagado: number;
  pendiente: number;
  vencido: number;
}

export interface DashboardResumen {
  proyectos: {
    total: number;
    porEstado: Record<EstadoProyecto, number>;
    hitosProximos7dias: number;
    hitosIncumplidos: number;
  };
  requerimientos: {
    tendenciaSemanal: { semana: string; creados: number; aprobados: number }[];
    pendientesAprobacion: number;
    urgentesPendientes: number;
    tiempoPromedioAprobacionDias: number | null;
  };
  cotizaciones: {
    funnelPorEstado: { etapa: string; value: number }[];
    solicitudesEnCurso: number;
    estancadasMas5Dias: number;
    ahorroAdjudicacion: number;
  };
  ordenesCompra: {
    montoPorMes: { mes: string; monto: number }[];
    emitidasNoRecibidas: number;
    entregaVencida: number;
  };
  inventario: {
    itemsActivos: number;
    itemsPorTipo: { consumible: number; activo: number };
    almacenesActivos: number;
    almacenesPorTipo: { fijo: number; temporal: number };
  };
}

export interface DashboardFinanzas {
  totalPendiente: number;
  totalVencido: number;
  proximos7dias: number;
  pagadoMes: number;
  montoPorMes: { mes: string; pagado: number; pendiente: number; vencido: number }[];
}

export type TipoNotificacion =
  | 'pago_por_vencer'
  | 'pago_vencido'
  | 'requerimiento_creado'
  | 'requerimiento_aprobado'
  | 'requerimiento_observado'
  | 'cotizacion_recibida'
  | 'solicitud_lista_adjudicar'
  | 'orden_compra_generada';

export interface Notificacion {
  id: string;
  userId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  entidadTipo?: string | null;
  entidadId?: string | null;
  leida: boolean;
  leidaEn?: string | null;
  creadoEn: string;
}
