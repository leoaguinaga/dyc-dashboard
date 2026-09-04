export type Role =
  | "supervisor"
  | "supervisor_civil"
  | "supervisor_electrico"
  | "pdr"
  | "ing_civil"
  | "ing_electrico"
  | "jefe_sig"
  | "logistica"
  | "gerencia"
  | "administrador"
  | "admin_ti";

export type TipoRequerimiento =
  | "electrico"
  | "civil"
  | "seguridad"
  | "administrativo";
export type EstadoProyecto =
  | "planificacion"
  | "ejecucion"
  | "cierre"
  | "liquidada";
export type AmbitoGeografico = "local" | "nacional" | "internacional";
export type CumplimientoHito = "si" | "no" | "programado";
export type TipoAlmacen = "fijo" | "temporal";
export type TipoItem = "consumible" | "activo";
export type UnidadMedida =
  | "und"
  | "kg"
  | "g"
  | "m"
  | "m2"
  | "m3"
  | "l"
  | "ml"
  | "gal"
  | "bolsa"
  | "caja"
  | "rollo"
  | "par"
  | "juego"
  | "docena"
  | "ciento"
  | "medio_ciento"
  | "millar"
  | "medio_millar"
  | "balde"
  | "galonera"
  | "cilindro"
  | "varilla"
  | "plancha"
  | "tubo"
  | "pieza"
  | "global";
export type EstadoRequerimiento =
  | "borrador"
  | "enviado"
  | "aprobado"
  | "observado"
  | "en_cotizacion"
  | "pendiente_conformidad"
  | "recibido"
  | "cancelado";
export type EstadoSolicitud =
  | "borrador"
  | "enviada"
  | "cotizada"
  | "seleccionada"
  | "aprobada_solicitante"
  | "aprobada_gerencia"
  | "orden_generada"
  | "cancelada";
export type EstadoCotizacion =
  | "pendiente"
  | "recibida"
  | "aprobada"
  | "rechazada"
  | "sin_respuesta";
export type EstadoOrdenCompra =
  | "borrador"
  | "emitida"
  | "recibida_parcial"
  | "recibida"
  | "cancelada";
export type EstadoPago = "borrador" | "pendiente" | "pagado" | "cancelado";
export type EstadoPagoEfectivo = EstadoPago | "vencido";
export type TipoBeneficiario = "proveedor" | "trabajador" | "otro";
export type OrigenOrdenCompra = "macro" | "simple";
export type TipoOrdenCompra = "compra" | "servicio";
export type EstadoAprobacionCompra =
  | "pendiente"
  | "aprobada_tecnico"
  | "aprobada"
  | "observada";
export type DestinoPago = "empresa" | "trabajador";
export type MetodoPagoTrabajador =
  | "registrado"
  | "transferencia"
  | "yape"
  | "plin";

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
  proyectos?: Pick<
    Proyecto,
    | "id"
    | "codigo"
    | "nombre"
    | "estado"
    | "fechaInicio"
    | "fechaFin"
    | "coordinadorEmpresa"
  >[];
  _count?: { proyectos: number; contactos: number };
}

export interface HelpVideo {
  id: string;
  titulo: string;
  descripcion?: string;
  youtubeId: string;
  modulo: string;
  roles: Role[];
  orden: number;
  creadoPorId: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Hito {
  id: string;
  proyectoId: string;
  nombre: string;
  fechaProgramada: string;
  evidencia?: string;
  cumplimiento: CumplimientoHito;
  responsableId: string;
  responsable?: Pick<Trabajador, "id" | "nombre" | "cargo">;
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
  enlaceOneDrive?: string;
  ambitoGeografico?: AmbitoGeografico;

  parentId?: string;
  parent?: Pick<Proyecto, "id" | "nombre" | "codigo">;
  subproyectos?: Pick<Proyecto, "id" | "nombre" | "codigo" | "estado">[];

  clienteId?: string;
  cliente?: Pick<Cliente, "id" | "razonSocial" | "nombreComercial">;

  coordinadorClienteId?: string;
  coordinadorCliente?: Pick<
    ContactoCliente,
    "id" | "nombre" | "cargo" | "email" | "telefono"
  >;
  coordinadorEmpresaId?: string;
  coordinadorEmpresa?: Pick<
    Trabajador,
    "id" | "nombre" | "cargo" | "email" | "telefono"
  >;
  ejecutorId?: string;
  ejecutor?: Pick<Trabajador, "id" | "nombre" | "cargo" | "email" | "telefono">;
  prevencionistaId?: string;
  prevencionista?: Pick<
    Trabajador,
    "id" | "nombre" | "cargo" | "email" | "telefono"
  >;

  // Deprecados en favor de TurnoConfig (soporte multi-turno) — el backend ya no los lee.
  jornadaInicio?: string;
  jornadaFin?: string;
  toleranciaMinutos?: number;
  toleranciaSalidaMinutos?: number;
  turnoConfigs?: TurnoConfig[];

  fechaInicio?: string;
  fechaFin?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  notaInicioReal?: string;

  estado: EstadoProyecto;
  creadaEn: string;
  actualizadaEn?: string;
  supervisores?: {
    userId: string;
    user: Pick<User, "id" | "name" | "email">;
  }[];
  trabajadores?: {
    id: string;
    trabajadorId: string;
    fechaIngreso: string;
    fechaSalida?: string;
    trabajador: Pick<Trabajador, "id" | "nombre" | "cargo" | "dni">;
  }[];
  hitos?: Hito[];
}

export interface ProyectoTrabajador {
  id: string;
  proyectoId: string;
  trabajadorId: string;
  fechaIngreso: string;
  fechaSalida?: string;
  proyecto: Pick<Proyecto, "id" | "codigo" | "nombre" | "estado">;
}

export type CategoriaObrero = "operario" | "oficial" | "peon";

export interface PerfilObrero {
  id: string;
  trabajadorId: string;
  categoria?: CategoriaObrero;
  precioHora?: string;
  tipoSangre?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  direccion?: string;
  tallaUniforme?: string;
  tallaCalzado?: string;
  numeroSctr?: string;
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
  user?: Pick<User, "id" | "name" | "email" | "role">;
  proyectos?: ProyectoTrabajador[];
  perfilObrero?: PerfilObrero;
}

export type EstadoTurno = "abierto" | "cerrado";
export type EstadoAsistencia = "presente" | "tardio" | "falta";

export interface Asistencia {
  id: string;
  turnoId: string;
  trabajadorId: string;
  estado: EstadoAsistencia;
  horaLlegadaReal?: string;
  justificada?: boolean;
  justificacion?: string;
  salidaTempranaHora?: string;
  salidaTempranaMotivo?: string;
  horasNormales: string;
  horasExtra: string;
  pagarExtra: boolean;
}

export interface TurnoConfig {
  id: string;
  proyectoId: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  toleranciaMinutos: number;
  toleranciaSalidaMinutos: number;
  activo: boolean;
}

export interface Turno {
  id: string;
  proyectoId: string;
  turnoConfigId: string;
  turnoConfig?: Pick<TurnoConfig, "nombre">;
  fecha: string;
  estado: EstadoTurno;
  horaAperturaReal: string;
  horaCierreReal?: string;
  fotoUrl?: string;
  fotoOmitida: boolean;
  motivoFotoOmitida?: string;
  abiertoPorId: string;
  abiertoPor?: Pick<User, "id" | "name">;
  cerradoPorId?: string;
  cerradoPor?: Pick<User, "id" | "name">;
  corregidoPorId?: string;
  corregidoPor?: Pick<User, "id" | "name">;
  corregidoEn?: string;
  motivoCorreccion?: string;
}

export interface ObreroAsistencia {
  trabajadorId: string;
  nombre: string;
  dni: string;
  cargo?: string;
  asistencia: Asistencia | null;
}

export interface TurnoDetalle extends Turno {
  asistencias: Asistencia[];
  turnoConfig: TurnoConfig;
  obreros: ObreroAsistencia[];
}

export interface CierrePreview {
  hayExcedente: boolean;
  trabajadoresAfectados: {
    trabajadorId: string;
    nombre: string;
    horasExtra: number;
  }[];
  totalHorasExtra: number;
}

export type TipoVisita = "staff" | "staff_oficina";

export interface RegistroVisita {
  id: string;
  proyectoId: string;
  fecha: string;
  tipo: TipoVisita;
  trabajadorId?: string;
  trabajador?: Pick<Trabajador, "id" | "nombre" | "dni" | "cargo">;
  userId?: string;
  user?: Pick<User, "id" | "name" | "role">;
  nombreLibre?: string;
  motivo?: string;
  horaEntrada: string;
  horaSalida?: string;
  registradoPorId: string;
  registradoPor?: Pick<User, "id" | "name">;
}

export interface VisitanteTercero {
  id: string;
  visitaTerceroId: string;
  nombre: string;
  dni: string;
  horaEntrada: string;
  horaSalida?: string;
}

export interface VisitaTercero {
  id: string;
  proyectoId: string;
  fecha: string;
  empresaNombre: string;
  motivo: string;
  registradoPorId: string;
  registradoPor?: Pick<User, "id" | "name">;
  visitantes: VisitanteTercero[];
}

export type TipoPersonaAcceso = "operario" | TipoVisita | "tercero";

export interface AccesoConsolidadoItem {
  tipo: TipoPersonaAcceso;
  nombre: string;
  dni: string | null;
  empresa: string | null;
  motivo: string | null;
  horaEntrada: string | null;
  horaSalida: string | null;
  fecha: string;
  proyectoId: string;
  proyectoNombre: string;
}

export interface Jornada {
  id: string;
  fecha: string;
  estado: EstadoTurno;
  proyectoId: string;
  proyectoNombre: string;
  proyectoCodigo?: string;
  turnoNombre: string;
  obreros: number;
  horasNormales: number;
  horasExtra: number;
}

export interface JornadaTrabajador {
  trabajadorId: string;
  nombre: string;
  dni: string;
  estado: EstadoAsistencia;
  justificada?: boolean;
  horasNormales: number;
  horasExtra: number;
  pagarExtra: boolean;
  precioHora: number | null;
}

export interface JornadaDetalle {
  id: string;
  fecha: string;
  estado: EstadoTurno;
  horaAperturaReal: string;
  horaCierreReal?: string;
  proyectoId: string;
  proyectoNombre: string;
  proyectoCodigo?: string;
  turnoNombre: string;
  abiertoPor?: Pick<User, "id" | "name">;
  cerradoPor?: Pick<User, "id" | "name">;
  trabajadores: JornadaTrabajador[];
  totales: { horasNormales: number; horasExtra: number };
}

export interface ConsolidadoObraTurno {
  turnoId: string;
  fecha: string;
  estado: EstadoTurno;
  horasNormales: number;
  horasExtra: number;
  obreros: number;
}

export interface ConsolidadoObraTrabajador {
  trabajadorId: string;
  nombre: string;
  horasNormales: number;
  horasExtra: number;
  turnos: number;
}

export interface ConsolidadoObra {
  turnos: ConsolidadoObraTurno[];
  porTrabajador: ConsolidadoObraTrabajador[];
  totales: { horasNormales: number; horasExtra: number };
}

export interface PlanillaPreviewTrabajador {
  trabajadorId: string;
  nombre: string;
  precioHora: number | null;
  horasNormales: number;
  horasExtraPagable: number;
  montoNormal: number;
  montoExtra: number;
  total: number;
  sinTarifa: boolean;
}

export interface ConsolidadoTrabajadorObra {
  proyectoId: string;
  proyectoNombre: string;
  horasNormales: number;
  horasExtra: number;
  turnos: {
    fecha: string;
    estado: EstadoAsistencia;
    horasNormales: number;
    horasExtra: number;
  }[];
}

export interface ConsolidadoTrabajador {
  porObra: ConsolidadoTrabajadorObra[];
  totales: { horasNormales: number; horasExtra: number };
}

export interface PlanillaPreview {
  periodo: { desde: string; hasta: string };
  valorHoraExtra: number;
  trabajadores: PlanillaPreviewTrabajador[];
  totalGeneral: number;
}

export interface PlanillaItem {
  id: string;
  planillaId: string;
  trabajadorId: string;
  trabajador?: Pick<Trabajador, "id" | "nombre">;
  horasNormales: string;
  horasExtraPagable: string;
  precioHora?: string;
  montoNormal: string;
  montoExtra: string;
  total: string;
}

export interface Planilla {
  id: string;
  proyectoId: string;
  proyecto?: Pick<Proyecto, "id" | "nombre" | "codigo">;
  periodoInicio: string;
  periodoFin: string;
  valorHoraExtra: string;
  totalGeneral: string;
  generadaPorId: string;
  generadaPor?: Pick<User, "id" | "name">;
  generadaEn: string;
  items?: PlanillaItem[];
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
  proyecto: Pick<
    Proyecto,
    "id" | "codigo" | "nombre" | "ciudad" | "direccion" | "comuna"
  >;
  creadoPorId: string;
  creadoPor: Pick<User, "id" | "name" | "email" | "role">;
  estado: EstadoRequerimiento;
  tipo: TipoRequerimiento;
  urgente: boolean;
  nota?: string;
  notaRevision?: string;
  fechaEntregaRequerida?: string;
  creadoEn: string;
  actualizadoEn: string;
  items: RequerimientoItem[];
  solicitudes?: RequerimientoSeguimientoSolicitud[];
  historial?: RequerimientoHistorial[];
  _count?: { solicitudes: number };

  recepcionFotoUrl?: string | null;
  recepcionComentario?: string | null;
  recepcionEn?: string | null;
  recepcionPorId?: string | null;
  recepcionPor?: Pick<User, "id" | "name"> | null;
}

export type OrigenSolicitud = "macro" | "precotizado";
export type EtapaSolicitud =
  | "borrador"
  | "validacion_tecnica"
  | "observada"
  | "aprobada_requerimiento"
  | "en_cotizacion"
  | "aprobada_tecnico"
  | "aprobada_gerencia"
  | "emitida"
  | "recibida_parcial"
  | "pendiente_conformidad"
  | "recibida"
  | "cancelada"
  | "mixta";

export type ColumnaKanbanSolicitud =
  | "requiere_correccion"
  | "validacion_tecnica"
  | "cotizacion_seleccion"
  | "aprobacion_gerencia"
  | "por_emitir"
  | "compra_curso"
  | "recepcion_conformidad";

export interface ConteoEstados<T extends string> {
  total: number;
  porEstado: Partial<Record<T, number>>;
}

export interface FlujoMacroSolicitud {
  origen: "macro";
  requerimiento: {
    estado: EstadoRequerimiento;
    urgente: boolean;
    notaRevision: string | null;
    fechaEntregaRequerida: string | null;
    items: number;
  };
  solicitudesCotizacion: Array<{
    id: string;
    codigo: string;
    estado: EstadoSolicitud;
    cotizaciones: ConteoEstados<EstadoCotizacion>;
    ordenes: ConteoEstados<EstadoOrdenCompra>;
  }>;
}

export interface GrupoPrecotizadoResumen {
  id: string;
  numero: string;
  nombre: string | null;
  tipoOrden: TipoOrdenCompra;
  estado: EstadoOrdenCompra;
  estadoAprobacion: EstadoAprobacionCompra | null;
  proveedor: { id: string | null; nombre: string } | null;
  montoTotal: number;
  items: number;
  pagos: number;
  archivos: number;
}

export interface FlujoPrecotizadoSolicitud {
  origen: "precotizado";
  esRendicion: boolean;
  grupos: GrupoPrecotizadoResumen[];
  aprobaciones: ConteoEstados<EstadoAprobacionCompra>;
  ordenes: ConteoEstados<EstadoOrdenCompra>;
  montoTotal: number;
}

export type FlujoSolicitud = FlujoMacroSolicitud | FlujoPrecotizadoSolicitud;

export interface SolicitudResumen {
  id: string;
  origen: OrigenSolicitud;
  tipo: TipoRequerimiento;
  codigo: string;
  nombre: string;
  proyecto: Pick<Proyecto, "id" | "codigo" | "nombre">;
  creadoPor: Pick<User, "id" | "name">;
  creadoEn: string;
  etapa: EtapaSolicitud;
  columnaKanban: ColumnaKanbanSolicitud | null;
  estadoNativo: string;
  requiereAtencion: boolean;
  esTerminal: boolean;
  hrefDetalle: string;
  flujo: FlujoSolicitud;
  resumenGrupos?: {
    total: number;
    pendientes: number;
    observados: number;
  };
}

export interface SolicitudesResponse {
  data: SolicitudResumen[];
  total: number;
}

export interface RequerimientoSeguimientoOrden {
  id: string;
  numero: string;
  estado: EstadoOrdenCompra;
  fechaEmision?: string | null;
  fechaEntrega?: string | null;
  fechaEntregaReal?: string | null;
  proveedor?: { id: string; razonSocial: string } | null;
  proveedorNombreLibre?: string | null;
}

export interface RequerimientoSeguimientoCotizacionItem {
  descripcionProveedor: string;
  precioUnit: string;
  cantidad: string;
  unidad: UnidadMedida;
}

export interface RequerimientoSeguimientoCotizacion {
  id: string;
  proveedor: { id: string; razonSocial: string };
  items: RequerimientoSeguimientoCotizacionItem[];
}

export interface RequerimientoSeguimientoSolicitud {
  id: string;
  codigo: string;
  estado: EstadoSolicitud;
  creadoEn: string;
  aprobadaSolicitanteEn?: string | null;
  aprobadaSolicitantePorRole?: Role | null;
  aprobadaSolicitantePor?: Pick<User, "id" | "name"> | null;
  cotizaciones: RequerimientoSeguimientoCotizacion[];
  ordenes: RequerimientoSeguimientoOrden[];
}

export interface RequerimientoHistorial {
  id: string;
  requerimientoId: string;
  estado: EstadoRequerimiento;
  nota?: string;
  actorId?: string;
  actor?: Pick<User, "id" | "name" | "role"> | null;
  actorRole?: Role;
  creadoEn: string;
}

export interface SolicitudItem {
  id: string;
  solicitudId: string;
  descripcion: string;
  unidad: UnidadMedida;
  itemInventarioId?: string;
  item?: Pick<ItemInventario, "id" | "codigo" | "nombre" | "unidad"> | null;
  cantidadTotal: string;
  cantidadAlmacen: string;
  cantidadCompra: string;
}

export interface CotizacionItem {
  id: string;
  cotizacionId: string;
  descripcionProveedor: string;
  itemInventarioId?: string;
  item?: Pick<ItemInventario, "id" | "codigo" | "nombre">;
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
  proveedor: Pick<Proveedor, "id" | "razonSocial" | "ruc">;
  estado: EstadoCotizacion;
  fechaRecibida?: string;
  fechaEntrega?: string;
  validezDias?: number;
  condicionesServicio?: string;
  condicionesPago: CotizacionCondicionPago[];
  condicionPago?: string;
  incluyeIgv: boolean;
  nota?: string;
  creadoPorId?: string | null;
  creadoPor?: Pick<User, "id" | "name" | "role"> | null;
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
  proyecto?: Pick<Proyecto, "id" | "nombre" | "codigo">;
  requerimientoId?: string;
  requerimiento?: Pick<
    Requerimiento,
    "id" | "codigo" | "nombre" | "tipo"
  > | null;
  estado: EstadoSolicitud;
  nota?: string;
  creadoEn: string;
  actualizadoEn: string;
  items: SolicitudItem[];
  cotizaciones: Cotizacion[];
  ordenes?: SolicitudOrdenCompra[];
  _count?: { items: number; cotizaciones: number };

  aprobadaSolicitantePorId?: string | null;
  aprobadaSolicitantePor?: Pick<User, "id" | "name" | "role"> | null;
  aprobadaSolicitantePorRole?: Role | null;
  aprobadaSolicitanteEn?: string | null;

  aprobadaGerenciaPorId?: string | null;
  aprobadaGerenciaPor?: Pick<User, "id" | "name" | "role"> | null;
  aprobadaGerenciaPorRole?: Role | null;
  aprobadaGerenciaEn?: string | null;

  canceladaEn?: string | null;
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

export interface SolicitudOrdenCompra {
  id: string;
  numero: string;
  nombre?: string | null;
  tipo: TipoOrdenCompra;
  estado: EstadoOrdenCompra;
  montoTotal: string | number;
  incluyeIgv?: boolean;
  condicionPago?: string | null;
  fechaEmision?: string | null;
  fechaEntrega?: string | null;
  creadoEn: string;
  proveedorId?: string | null;
  proveedor?: Pick<Proveedor, "id" | "razonSocial" | "ruc"> | null;
  proveedorNombreLibre?: string | null;
  creadoPor?: Pick<User, "id" | "name" | "role"> | null;
  items: OrdenCompraItem[];
}

export interface OrdenCompra {
  id: string;
  numero: string;
  nombre?: string | null;
  solicitudId?: string | null;
  solicitud?:
    | (Pick<SolicitudCotizacion, "id" | "codigo" | "estado"> & {
        requerimiento?: Pick<Requerimiento, "id" | "codigo" | "tipo"> | null;
      })
    | null;
  proveedorId?: string | null;
  proveedor?:
    | (Pick<
        Proveedor,
        | "id"
        | "razonSocial"
        | "ruc"
        | "direccion"
        | "banco"
        | "numeroCuenta"
        | "moneda"
        | "condicionPago"
      > & {
        contactos?: Pick<ContactoProveedor, "nombre" | "telefono">[];
      })
    | null;
  proveedorNombreLibre?: string | null;
  origen: OrigenOrdenCompra;
  tipo: TipoOrdenCompra;
  compraSimpleId?: string | null;
  estadoAprobacion?: EstadoAprobacionCompra | null;
  aprobadoPorId?: string | null;
  aprobadoPor?: Pick<User, "id" | "name"> | null;
  aprobadoEn?: string | null;
  notaAprobacion?: string | null;
  historial?: CompraSimpleGrupoHistorial[];
  destinoPago?: DestinoPago | null;
  pagoBanco?: string | null;
  pagoNumeroCuenta?: string | null;
  pagoRazonSocial?: string | null;
  pagoMetodo?: MetodoPagoTrabajador | null;
  pagoTrabajadorBanco?: string | null;
  pagoTrabajadorNumeroCuenta?: string | null;
  pagoTrabajadorNumero?: string | null;
  pagoTrabajadorId?: string | null;
  pagoTrabajador?: Pick<Trabajador, "id" | "nombre"> | null;
  archivos?: CompraSimpleGrupoArchivo[];
  proyectoId: string;
  proyecto: Pick<Proyecto, "id" | "codigo" | "nombre"> & {
    direccion?: string | null;
  };
  estado: EstadoOrdenCompra;
  fechaEmision?: string;
  fechaEntrega?: string;
  montoTotal: string;
  nota?: string;
  lugarEntrega?: string | null;
  adelantoPorcentaje?: string | null;
  saldoPorcentaje?: string | null;
  detraccionPorcentaje?: string | null;
  retencionPorcentaje?: string | null;
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
  creadoPor: Pick<User, "id" | "name" | "email">;
  creadoEn: string;
  actualizadoEn: string;
  items: OrdenCompraItem[];
  _count?: { items: number };
}

export interface CompraSimple {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoRequerimiento;
  esRendicion: boolean;
  proyectoId: string;
  proyecto: Pick<Proyecto, "id" | "codigo" | "nombre">;
  creadoPorId: string;
  creadoPor: Pick<User, "id" | "name" | "email" | "role">;
  aprobadoInformalPorId?: string | null;
  aprobadoInformalPor?: Pick<User, "id" | "name" | "role"> | null;
  nota?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  grupos: OrdenCompra[];
}

export type TipoArchivoCompraSimple = "comprobante" | "foto_producto";

export interface CompraSimpleGrupoArchivo {
  id: string;
  grupoId: string;
  tipo: TipoArchivoCompraSimple;
  url: string;
  nombreOriginal: string;
  mimeType: string;
  subidoPorId: string;
  subidoPor: Pick<User, "id" | "name">;
  creadoEn: string;
}

export interface CompraSimpleGrupoHistorial {
  id: string;
  grupoId: string;
  estado: EstadoAprobacionCompra;
  nota?: string | null;
  actorId?: string | null;
  actor?: Pick<User, "id" | "name" | "role"> | null;
  actorRole?: Role;
  creadoEn: string;
}

export interface Pago {
  id: string;
  ordenCompraId?: string | null;
  ordenCompra?:
    | (Pick<
        OrdenCompra,
        | "id"
        | "numero"
        | "concepto"
        | "montoTotal"
        | "proveedorNombreLibre"
        | "destinoPago"
        | "pagoMetodo"
        | "pagoBanco"
        | "pagoNumeroCuenta"
        | "pagoTrabajadorBanco"
        | "pagoTrabajadorNumeroCuenta"
        | "pagoTrabajadorNumero"
      > & {
        pagoTrabajador?: Pick<Trabajador, "id" | "nombre" | "banco" | "numeroCuenta" | "telefono"> | null;
        proveedor: Pick<Proveedor, "id" | "razonSocial" | "banco" | "numeroCuenta"> | null;
        proyecto: Pick<Proyecto, "id" | "codigo" | "nombre">;
        creadoPor: Pick<User, "id" | "name">;
      })
    | null;
  origen: string;
  centroCosto: "obra" | "administracion";
  proyectoId?: string | null;
  proyecto?: Pick<Proyecto, "id" | "codigo" | "nombre"> | null;
  concepto?: string | null;
  categoria?: string | null;
  tipoBeneficiario: TipoBeneficiario;
  beneficiarioTrabajadorId?: string | null;
  beneficiarioTrabajador?: Pick<Trabajador, "id" | "nombre" | "banco" | "numeroCuenta" | "telefono"> | null;
  monto: string;
  porcentaje: string;
  fechaProgramada: string;
  fechaPagoReal?: string | null;
  estado: EstadoPago;
  estadoEfectivo: EstadoPagoEfectivo;
  metodoPago?: string | null;
  numeroOperacion?: string | null;
  beneficiarioNombre?: string | null;
  banco?: string | null;
  numeroCuenta?: string | null;
  cci?: string | null;
  nota?: string | null;
  comprobanteNombre?: string | null;
  comprobanteUrl?: string | null;
  registradoPorId: string;
  registradoPor: Pick<User, "id" | "name">;
  pagadoPorId?: string | null;
  pagadoPor?: Pick<User, "id" | "name"> | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PagoRecurrente {
  id: string;
  concepto: string;
  categoria?: string | null;
  centroCosto: "obra" | "administracion";
  proyectoId?: string | null;
  proyecto?: Pick<Proyecto, "id" | "codigo" | "nombre"> | null;
  beneficiarioNombre?: string | null;
  banco?: string | null;
  numeroCuenta?: string | null;
  cci?: string | null;
  montoReferencial?: string | null;
  diaVencimiento: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ResumenPagos {
  totalPendiente: number;
  totalVencido: number;
  proximos7dias: number;
  pagadoMes: number;
}

export type EstadoCobro = "pendiente" | "cobrado" | "cancelado";
export type EstadoCobroEfectivo = EstadoCobro | "vencido";

export interface Cobro {
  id: string;
  proyectoId: string;
  proyecto: Pick<Proyecto, "id" | "codigo" | "nombre">;
  monto: string;
  fechaProgramada: string;
  fechaCobrada?: string | null;
  estado: EstadoCobro;
  estadoEfectivo: EstadoCobroEfectivo;
  actaConformidadNombre: string;
  actaConformidadUrl: string;
  registradoPorId: string;
  registradoPor: Pick<User, "id" | "name">;
  cobradoPorId?: string | null;
  cobradoPor?: Pick<User, "id" | "name"> | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ResumenCobros {
  totalPendiente: number;
  totalVencido: number;
  proximos7dias: number;
  cobradoMes: number;
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
  montoPorMes: {
    mes: string;
    pagado: number;
    pendiente: number;
    vencido: number;
  }[];
}

export type PrioridadDashboard = "critica" | "alta" | "normal" | "informativa";

export interface TareaDashboard {
  id: string;
  tipo: string;
  prioridad: PrioridadDashboard;
  titulo: string;
  contexto: string;
  href: string;
  fecha?: string;
  requiereAccion: boolean;
  bloqueada: boolean;
  proxima: boolean;
}

export interface AccionRapidaDashboard {
  id: string;
  titulo: string;
  descripcion: string;
  href: string;
}

export interface InicioDashboard {
  usuario: Pick<User, "name" | "role"> & { etiquetaRol: string };
  resumen: { pendientes: number; bloqueos: number; proximos: number };
  tareas: TareaDashboard[];
  seguimiento: TareaDashboard[];
  accionesRapidas: AccionRapidaDashboard[];
}

export type TipoNotificacion =
  | "pago_por_vencer"
  | "pago_vencido"
  | "requerimiento_creado"
  | "requerimiento_aprobado"
  | "requerimiento_observado"
  | "cotizacion_recibida"
  | "solicitud_lista_adjudicar"
  | "orden_compra_generada";

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
