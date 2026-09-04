import type { Role } from '@/types/api'

export interface GuiaStep {
  numero: number
  titulo: string
  descripcion: string
  detalle?: string[]
  advertencia?: string
  tip?: string
}

export interface GuiaProceso {
  id: string
  titulo: string
  subtitulo: string
  modulo: string
  href?: string
  rolesAplicables: Role[]
  etiquetas: string[]
  objetivo: string
  pasos: GuiaStep[]
  estados?: { estado: string; descripcion: string; color: 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'slate' }[]
  buenasPracticas?: string[]
  requisitosPrevios?: string[]
  resultadoEsperado?: string
  ultimaRevision?: string
  version?: string
}

export interface GuiaFaq {
  id: string
  pregunta: string
  respuesta: string
  categoria: 'requerimientos' | 'cotizaciones' | 'asistencia' | 'compras' | 'almacenes' | 'finanzas' | 'proyectos' | 'usuarios' | 'general'
  rolesAplicables: Role[]
  solucionPasoAPaso?: string[]
  moduloHref?: string
  moduloLabel?: string
}

export interface RoleInfo {
  id: string
  roleKey: Role | 'supervisores_campo'
  nombre: string
  cargo: string
  badgeColor: string
  descripcion: string
  responsabilidades: string[]
  modulosPrincipales: { label: string; href: string; descripcion: string }[]
  accionesRapidas: { label: string; href: string; icono: string }[]
}

export interface FlujoGlobal {
  id: string
  titulo: string
  descripcion: string
  fases: {
    numero: number
    nombre: string
    responsable: string
    descripcion: string
    estadoDoc?: string
  }[]
}

export const ROLES_INFO: RoleInfo[] = [
  {
    id: 'supervisores_campo',
    roleKey: 'supervisor',
    nombre: 'Supervisores e Ingenieros de Campo',
    cargo: 'Supervisor / Residente / Ing. Civil / Ing. Eléctrico',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-200',
    descripcion: 'Responsables de la ejecución técnica en obra, levantamiento de requerimientos de materiales, registro de gastos menores de campo y recepción de suministros.',
    responsabilidades: [
      'Generar requerimientos de materiales, equipos y servicios detallando especificaciones técnicas.',
      'Subsanar requerimientos observados por la jefatura técnica o logística.',
      'Otorgar conformidad de entrega y registrar la recepción de materiales en obra.',
      'Registrar compras menores de caja chica/campo (compras simples) adjuntando comprobantes.',
      'Supervisar el avance de hitos y cronograma de los proyectos asignados.',
    ],
    modulosPrincipales: [
      { label: 'Requerimientos', href: '/requerimientos', descripcion: 'Creación, seguimiento y conformidad de pedidos de obra.' },
      { label: 'Compras simples', href: '/compras-simples', descripcion: 'Rendición de gastos directos con boletas o facturas.' },
      { label: 'Proyectos', href: '/proyectos', descripcion: 'Consulta de hitos, datos de cliente y personal asignado.' },
    ],
    accionesRapidas: [
      { label: 'Nuevo Requerimiento', href: '/requerimientos/nuevo', icono: 'ClipboardPlus' },
      { label: 'Registrar Compra', href: '/compras-simples/nueva', icono: 'ShoppingBag' },
      { label: 'Ver Mis Proyectos', href: '/proyectos', icono: 'Building2' },
    ],
  },
  {
    id: 'pdr',
    roleKey: 'pdr',
    nombre: 'Prevencionista de Riesgos (PDR / SSOMA)',
    cargo: 'Prevencionista de Riesgos y Seguridad en Obra',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    descripcion: 'Encargado del control diario de asistencia, seguridad en obra (SSOMA), tareo del personal operario y de staff, control de ingresos/visitas y requerimientos de EPPs.',
    responsabilidades: [
      'Registrar diariamente la asistencia y tareo del personal de obra (operarios, staff, contratistas).',
      'Controlar tardanzas, faltas justificadas, permisos, descansos médicos y horas extras.',
      'Registrar visitas externas y control de acceso seguro a las instalaciones del proyecto.',
      'Generar requerimientos de EPPs, insumos de primeros auxilios y señalización de seguridad.',
      'Registrar compras simples para emergencias médicas o implementos inmediatos de seguridad.',
    ],
    modulosPrincipales: [
      { label: 'Asistencia', href: '/asistencia', descripcion: 'Tareo diario de operarios, staff y visitas por proyecto.' },
      { label: 'Requerimientos (Seguridad)', href: '/requerimientos', descripcion: 'Solicitud de EPPs e implementos SIG.' },
      { label: 'Compras simples', href: '/compras-simples', descripcion: 'Rendición de gastos de farmacia o seguridad.' },
      { label: 'Proyectos', href: '/proyectos', descripcion: 'Información general de las obras activas.' },
    ],
    accionesRapidas: [
      { label: 'Tomar Asistencia Hoy', href: '/asistencia', icono: 'UserCheck' },
      { label: 'Requerimiento de EPPs', href: '/requerimientos/nuevo', icono: 'ShieldAlert' },
      { label: 'Rendir Gasto SSOMA', href: '/compras-simples/nueva', icono: 'ShoppingBag' },
    ],
  },
  {
    id: 'logistica',
    roleKey: 'logistica',
    nombre: 'Logística y Abastecimiento',
    cargo: 'Jefe / Asistente de Logística y Compras',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200',
    descripcion: 'Gestor del ciclo completo de abastecimiento: revisión de requerimientos aprobados, cotización con proveedores, matriz de adjudicación, emisión de OCs/OSs y gestión de inventarios.',
    responsabilidades: [
      'Consolidar requerimientos aprobados y generar solicitudes de cotización a proveedores.',
      'Registrar y comparar ofertas económicas en la matriz de adjudicación (precios, tiempos, créditos).',
      'Generar Órdenes de Compra (OC) y Órdenes de Servicio (OS) oficiales en PDF.',
      'Gestionar los almacenes fijos y temporales en obra, así como el catálogo de ítems/consumibles.',
      'Administrar la base de datos de proveedores homologados y sus cuentas bancarias.',
    ],
    modulosPrincipales: [
      { label: 'Requerimientos', href: '/requerimientos', descripcion: 'Revisión y pase a cotización de requerimientos.' },
      { label: 'Cotizaciones', href: '/cotizaciones', descripcion: 'Solicitudes, matrices de precios y adjudicaciones.' },
      { label: 'Órdenes de Compra', href: '/ordenes-compra', descripcion: 'Generación, emisión y seguimiento de OCs.' },
      { label: 'Órdenes de Servicio', href: '/ordenes-servicio', descripcion: 'Contratación de servicios especializados.' },
      { label: 'Almacenes e Ítems', href: '/almacenes', descripcion: 'Inventario, stock y catálogo unificado.' },
      { label: 'Proveedores', href: '/proveedores', descripcion: 'Directorio comercial con RUC y cuentas.' },
    ],
    accionesRapidas: [
      { label: 'Requerimientos Pendientes', href: '/requerimientos', icono: 'ClipboardList' },
      { label: 'Nueva Solicitud Cotización', href: '/cotizaciones/nueva', icono: 'FileSpreadsheet' },
      { label: 'Ver Órdenes de Compra', href: '/ordenes-compra', icono: 'ShoppingCart' },
      { label: 'Catálogo de Ítems', href: '/almacenes/items', icono: 'Warehouse' },
    ],
  },
  {
    id: 'gerencia',
    roleKey: 'gerencia',
    nombre: 'Gerencia General y Dirección',
    cargo: 'Gerente General / Director de Operaciones',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200',
    descripcion: 'Supervisión estratégica de operaciones, control de rentabilidad de proyectos, aprobación de cotizaciones/órdenes de alto valor y monitoreo financiero de cobros y pagos.',
    responsabilidades: [
      'Supervisar los indicadores clave (KPIs) de avance físico y financiero en el Dashboard.',
      'Aprobar cotizaciones adjudicadas y autorizar emisión de órdenes de compra mayores.',
      'Monitorear el flujo de caja: cuentas por cobrar a clientes vs cuentas por pagar a proveedores.',
      'Revisar el costo de nómina generado desde el módulo de Planilla.',
      'Evaluar el cumplimiento de hitos y cierres económicos de proyectos.',
    ],
    modulosPrincipales: [
      { label: 'Dashboard', href: '/dashboard', descripcion: 'Visión global de proyectos, compras y finanzas.' },
      { label: 'Cotizaciones', href: '/cotizaciones', descripcion: 'Aprobación final de adjudicaciones a proveedores.' },
      { label: 'Pagos y Cobros', href: '/pagos', descripcion: 'Flujo de egresos e ingresos de la compañía.' },
      { label: 'Planilla', href: '/planilla', descripcion: 'Consolidado de pagos a personal por obra.' },
      { label: 'Reportes', href: '/reportes', descripcion: 'Exportación de métricas de rentabilidad y compras.' },
    ],
    accionesRapidas: [
      { label: 'Dashboard Ejecutivo', href: '/dashboard', icono: 'BarChart3' },
      { label: 'Cotizaciones por Aprobar', href: '/cotizaciones', icono: 'CheckCircle2' },
      { label: 'Control de Cobros', href: '/cobros', icono: 'Landmark' },
      { label: 'Estado de Pagos', href: '/pagos', icono: 'Wallet' },
    ],
  },
  {
    id: 'administrador',
    roleKey: 'administrador',
    nombre: 'Administración y Finanzas',
    cargo: 'Administrador / Tesorero / Contabilidad',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    descripcion: 'Gestión integral del dinero y recursos: programación y liquidación de pagos, facturación y cobros a clientes por hitos, generación de planillas y gestión de maestros.',
    responsabilidades: [
      'Programar y registrar los pagos a proveedores con comprobantes y números de operación.',
      'Aprobar y liquidar las compras simples registradas por el personal de campo.',
      'Gestionar las cuentas por cobrar emitiendo comprobantes por cada hito de avance de obra.',
      'Calcular y cerrar las planillas semanales/quincenales en base al tareo de asistencia.',
      'Mantener actualizados los maestros de Trabajadores, Clientes, Proveedores y Usuarios.',
    ],
    modulosPrincipales: [
      { label: 'Pagos', href: '/pagos', descripcion: 'Cuentas por pagar a proveedores y liquidaciones.' },
      { label: 'Cobros', href: '/cobros', descripcion: 'Seguimiento de facturas e ingresos por proyecto.' },
      { label: 'Planilla', href: '/planilla', descripcion: 'Cálculo de sueldos según tareo de asistencia.' },
      { label: 'Trabajadores', href: '/trabajadores', descripcion: 'Fichas de personal, contratos y cuentas.' },
      { label: 'Clientes', href: '/clientes', descripcion: 'Directorio de clientes y proyectos vinculados.' },
    ],
    accionesRapidas: [
      { label: 'Cuentas por Pagar', href: '/pagos', icono: 'Wallet' },
      { label: 'Gestionar Cobros', href: '/cobros', icono: 'Landmark' },
      { label: 'Calcular Planilla', href: '/planilla', icono: 'Receipt' },
      { label: 'Registrar Trabajador', href: '/trabajadores/nuevo', icono: 'UserPlus' },
    ],
  },
  {
    id: 'jefe_sig',
    roleKey: 'jefe_sig',
    nombre: 'Jefe SIG / Calidad',
    cargo: 'Jefe de Sistema Integrado de Gestión y SSOMA',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-200',
    descripcion: 'Garante del cumplimiento de normativas de seguridad, salud ocupacional, medio ambiente y calidad técnica en todos los proyectos y compras de la organización.',
    responsabilidades: [
      'Revisar y validar técnicamente los requerimientos del tipo "Seguridad".',
      'Supervisar que los EPPs y materiales de seguridad solicitados cumplan normas técnicas peruanas / internacionales.',
      'Monitorear la asistencia y reportes de seguridad emitidos por los prevencionistas (PDR).',
      'Auditar compras de insumos críticos de seguridad y medio ambiente.',
    ],
    modulosPrincipales: [
      { label: 'Requerimientos', href: '/requerimientos', descripcion: 'Aprobación de pedidos de seguridad y calidad.' },
      { label: 'Asistencia', href: '/asistencia', descripcion: 'Monitoreo de asistencia y personal en obra.' },
      { label: 'Proyectos', href: '/proyectos', descripcion: 'Supervisión de proyectos en ejecución.' },
    ],
    accionesRapidas: [
      { label: 'Requerimientos SIG', href: '/requerimientos', icono: 'ShieldCheck' },
      { label: 'Monitorear Asistencia', href: '/asistencia', icono: 'Users' },
    ],
  },
  {
    id: 'admin_ti',
    roleKey: 'admin_ti',
    nombre: 'Administrador de TI / Sistema',
    cargo: 'Administrador de Sistemas y TI',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-200',
    descripcion: 'Administrador técnico global: creación de usuarios, asignación de roles, reinicio de contraseñas, mantenimiento del catálogo de videos de capacitación y soporte general.',
    responsabilidades: [
      'Crear y gestionar cuentas de usuario con roles y permisos específicos.',
      'Gestionar el catálogo de videos de ayuda y tutoriales vinculados a YouTube.',
      'Auditar accesos al sistema y resolver bloqueos de sesión o permisos.',
      'Monitorear la integridad operativa de todos los módulos del sistema.',
    ],
    modulosPrincipales: [
      { label: 'Usuarios', href: '/usuarios', descripcion: 'Gestión integral de credenciales y roles.' },
      { label: 'Ayuda (Videos)', href: '/ayuda', descripcion: 'Administración del catálogo multimedia de tutoriales.' },
      { label: 'Acceso Total', href: '/dashboard', descripcion: 'Visualización completa de todos los módulos.' },
    ],
    accionesRapidas: [
      { label: 'Crear Usuario', href: '/usuarios/nuevo', icono: 'UserPlus' },
      { label: 'Gestionar Videos', href: '/ayuda', icono: 'Video' },
    ],
  },
]

export const GUIAS_PROCESOS: GuiaProceso[] = [
  // 1. REQUERIMIENTOS - CREACIÓN Y ENVÍO
  {
    id: 'proc-req-creacion',
    requisitosPrevios: ['Tener acceso al proyecto correspondiente.', 'Contar con cantidades y especificaciones técnicas de lo solicitado.'],
    resultadoEsperado: 'El requerimiento queda enviado al responsable de la revisión técnica y puede seguirse desde el listado de Requerimientos.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Crear y enviar un Requerimiento de Obra',
    subtitulo: 'Cómo solicitar materiales, herramientas o servicios para un proyecto específico.',
    modulo: 'Requerimientos',
    href: '/requerimientos/nuevo',
    rolesAplicables: ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'ing_civil', 'ing_electrico', 'pdr', 'logistica', 'administrador', 'admin_ti'],
    etiquetas: ['Requerimientos', 'Materiales', 'Obra', 'Flujo Inicial'],
    objetivo: 'Permitir al personal de campo o administrativo solicitar suministros formalmente con especificaciones técnicas claras para su revisión y compra.',
    pasos: [
      {
        numero: 1,
        titulo: 'Ingresar al módulo de Requerimientos',
        descripcion: 'Dirígete al menú lateral en "Operaciones > Requerimientos" y haz clic en el botón superior derecho "+ Nuevo requerimiento" o accede directamente desde el enlace rápido.',
      },
      {
        numero: 2,
        titulo: 'Seleccionar Proyecto, Tipo y Sustento',
        descripcion: 'Elige el proyecto al cual se imputará el gasto. Selecciona el tipo de requerimiento correcto:',
        detalle: [
          'Civil: Materiales de construcción, agregados, fierro, encofrados (Revisado por Ing. Civil).',
          'Eléctrico: Cables, tableros, transformadores, luminarias (Revisado por Ing. Eléctrico).',
          'Seguridad: EPPs, señalética, conos, botiquines, líneas de vida (Revisado por Jefe SIG).',
          'Administrativo: Útiles de oficina, suministros generales (Revisado por Logística).',
        ],
        tip: 'Escribe un sustento claro explicando para qué actividad del cronograma o frente de trabajo se usarán estos materiales.',
      },
      {
        numero: 3,
        titulo: 'Agregar Ítems y Especificaciones Técnicas',
        descripcion: 'Haz clic en "+ Agregar ítem". Completa la descripción exacta del material, la cantidad solicitada y la unidad de medida normalizada (und, kg, m, bolsa, gal, etc.).',
        detalle: [
          'Puedes indicar marca de referencia o especificación obligatoria (ej: "Cable THW 4mm2 marca Indeco").',
          'Si el ítem requiere ficha técnica o plano, puedes adjuntarlo en el campo de observaciones o archivos.',
        ],
        advertencia: 'Evita descripciones ambiguas como "pernos" o "cable". Indica siempre medidas, calibres, norma o características exactas para agilizar la cotización.',
      },
      {
        numero: 4,
        titulo: 'Guardar como Borrador o Enviar a Revisión',
        descripcion: 'Si aún estás recopilando datos, puedes guardarlo como "Borrador". Cuando esté completo, presiona "Enviar a revisión". El requerimiento pasará al estado "Enviado" y notificará al aprobador correspondiente.',
      },
    ],
    estados: [
      { estado: 'Borrador', descripcion: 'Visible solo para el creador. Permite editar libremente ítems y cantidades.', color: 'slate' },
      { estado: 'En revisión (Enviado)', descripcion: 'En bandeja del Ingeniero / Jefe de área para validación técnica.', color: 'blue' },
      { estado: 'Aprobado', descripcion: 'Validado técnicamente. Listo para que Logística inicie la cotización.', color: 'green' },
      { estado: 'Observado', descripcion: 'Requiere correcciones indicadas por el revisor.', color: 'amber' },
    ],
    buenasPracticas: [
      'Agrupa los materiales de una misma disciplina en un solo requerimiento para facilitar la compra por paquete.',
      'Calcula holguras lógicas de acuerdo al rendimiento de obra para evitar requerimientos de emergencia.',
      'Revisa que la unidad de medida sea la estándar comercial (ej: cemento en "bolsa", tubería en "tubo" o "m").',
    ],
  },

  // 2. REQUERIMIENTOS - APROBACIÓN Y OBSERVACIONES
  {
    id: 'proc-req-aprobacion',
    requisitosPrevios: ['Tener permisos de aprobación técnica.', 'Contar con un requerimiento en estado Enviado.'],
    resultadoEsperado: 'El requerimiento queda Aprobado para continuar con la cotización u Observado con instrucciones claras para corregirlo.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Revisar, Aprobar u Observar Requerimientos',
    subtitulo: 'Flujo de validación técnica realizado por Ingenieros de Especialidad, Jefe SIG y Administración.',
    modulo: 'Requerimientos',
    href: '/requerimientos',
    rolesAplicables: ['ing_civil', 'ing_electrico', 'jefe_sig', 'gerencia', 'administrador', 'admin_ti'],
    etiquetas: ['Aprobaciones', 'Supervisión', 'Calidad', 'Control'],
    objetivo: 'Asegurar que los materiales solicitados corresponden a las especificaciones del expediente técnico y al presupuesto asignado del proyecto.',
    pasos: [
      {
        numero: 1,
        titulo: 'Ubicar requerimientos en estado "Enviado"',
        descripcion: 'En la lista o tablero Kanban de Requerimientos, filtra por estado "Enviado". Los requerimientos asignados a tu especialidad aparecerán con un distintivo.',
      },
      {
        numero: 2,
        titulo: 'Revisar los ítems, cantidades y sustento',
        descripcion: 'Abre el detalle del requerimiento. Analiza cada ítem solicitado, la justificación de uso en obra y si las cantidades corresponden al avance proyectado.',
      },
      {
        numero: 3,
        titulo: 'Acción de Aprobación u Observación',
        descripcion: 'En la barra superior de acciones:',
        detalle: [
          'Aprobar: Haz clic en "Aprobar requerimiento". El documento pasa a Logística para ser cotizado de inmediato.',
          'Observar: Si hay cantidades excesivas, falta de especificación o error de tipo, haz clic en "Observar", ingresa el motivo detallado de la observación y confirma.',
        ],
        advertencia: 'Al observar un requerimiento, sé específico en el motivo (ej: "Indicar si la tubería PVC es SAP o SEL") para que el solicitante pueda corregirlo sin demoras.',
      },
    ],
    estados: [
      { estado: 'Aprobado', descripcion: 'Listo para asignación a solicitud de cotización por Logística.', color: 'green' },
      { estado: 'Observado', descripcion: 'Regresa al solicitante para que edite y vuelva a enviar.', color: 'amber' },
    ],
  },

  // 3. REQUERIMIENTOS - CONFORMIDAD Y RECEPCIÓN EN OBRA
  {
    id: 'proc-req-recepcion',
    requisitosPrevios: ['Contar con una entrega pendiente de conformidad.', 'Tener a la mano la guía de remisión o el sustento de entrega.'],
    resultadoEsperado: 'La recepción queda registrada con su conformidad o con las incidencias encontradas durante la inspección.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Dar Conformidad y Registrar Recepción en Obra',
    subtitulo: 'Validar la llegada física de los materiales comprados y cerrar el ciclo del requerimiento.',
    modulo: 'Requerimientos',
    href: '/requerimientos',
    rolesAplicables: ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'ing_civil', 'ing_electrico', 'pdr', 'logistica', 'administrador'],
    etiquetas: ['Recepción', 'Conformidad', 'Almacén de Obra'],
    objetivo: 'Verificar que los materiales entregados en obra cumplen con la cantidad y calidad solicitada antes de liquidar el pedido.',
    pasos: [
      {
        numero: 1,
        titulo: 'Identificar requerimiento en "Pendiente de Conformidad"',
        descripcion: 'Cuando Logística o el proveedor realiza la entrega, el requerimiento se actualiza a "Pendiente de conformidad".',
      },
      {
        numero: 2,
        titulo: 'Inspeccionar los materiales en campo',
        descripcion: 'Revisa la guía de remisión del transportista/proveedor contra los ítems y cantidades recibidas físicamente.',
      },
      {
        numero: 3,
        titulo: 'Registrar la Recepción y Conformidad',
        descripcion: 'Ingresa al requerimiento, ve a la sección "Recepción / Conformidad", marca los ítems conformes y presiona "Dar Conformidad / Marcar Recibido".',
        tip: 'Si hubo faltantes o productos dañados, indícalo en las notas de recepción antes de cerrar el registro.',
      },
    ],
    estados: [
      { estado: 'Pendiente conformidad', descripcion: 'La compra fue realizada y despachada; esperando validación en obra.', color: 'purple' },
      { estado: 'Recibido', descripcion: 'Ciclo completado con éxito. Materiales integrados al almacén o frente de trabajo.', color: 'green' },
    ],
  },

  // 4. COTIZACIONES Y ADJUDICACIÓN
  {
    id: 'proc-coti-flujo',
    requisitosPrevios: ['Contar con requerimientos aprobados.', 'Tener proveedores disponibles para solicitar propuestas.'],
    resultadoEsperado: 'La comparación queda registrada y el proveedor seleccionado puede continuar por el flujo de aprobaciones.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Crear Solicitud de Cotización y Adjudicar Proveedor',
    subtitulo: 'Consolidación de requerimientos, invitación a proveedores y matriz comparativa de ofertas.',
    modulo: 'Cotizaciones',
    href: '/cotizaciones/nueva',
    rolesAplicables: ['logistica', 'administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Cotizaciones', 'Logística', 'Adjudicación', 'Proveedores'],
    objetivo: 'Garantizar la mejor relación calidad-precio y tiempos de entrega mediante un proceso transparente de cotizaciones.',
    pasos: [
      {
        numero: 1,
        titulo: 'Crear Solicitud de Cotización',
        descripcion: 'Ve a "Operaciones > Cotizaciones > Nueva Solicitud". Selecciona los requerimientos aprobados cuyos ítems deseas agrupar en este paquete de compra.',
      },
      {
        numero: 2,
        titulo: 'Invitar Proveedores del Directorio',
        descripcion: 'Selecciona al menos 2 o 3 proveedores registrados en el sistema del rubro correspondiente y envía la solicitud para cotizar.',
      },
      {
        numero: 3,
        titulo: 'Registrar las Cotizaciones Recibidas',
        descripcion: 'A medida que los proveedores respondan por correo/WhatsApp, haz clic en "Registrar Cotización", ingresa el precio unitario de cada ítem, moneda (PEN o USD), tiempo de entrega en días, condición de pago y adjunta el PDF de la cotización formal.',
      },
      {
        numero: 4,
        titulo: 'Evaluar en la Matriz de Adjudicación y Seleccionar Ganador',
        descripcion: 'En la pestaña "Matriz Comparativa", el sistema compara automáticamente el costo total, plazo y condiciones. Selecciona la mejor oferta y haz clic en "Seleccionar Proveedor Adjudicado".',
      },
      {
        numero: 5,
        titulo: 'Aprobación del Solicitante y Gerencia',
        descripcion: 'El solicitante técnico valida la marca/calidad ("Aprobada Solicitante") y Gerencia autoriza el monto ("Aprobada Gerencia"). Con ambas aprobaciones, se habilitará el botón para generar la Orden de Compra.',
      },
    ],
    estados: [
      { estado: 'Borrador', descripcion: 'Armado del pliego de ítems a cotizar.', color: 'slate' },
      { estado: 'Enviada', descripcion: 'Invitaciones enviadas a los proveedores.', color: 'blue' },
      { estado: 'Cotizada', descripcion: 'Propuestas económicas ingresadas al sistema.', color: 'purple' },
      { estado: 'Seleccionada', descripcion: 'Proveedor ganador pre-adjudicado por Logística.', color: 'amber' },
      { estado: 'Aprobada Gerencia', descripcion: 'Adjudicación autorizada para generar Orden de Compra.', color: 'green' },
      { estado: 'Orden Generada', descripcion: 'OC/OS emitida formalmente en el sistema.', color: 'green' },
    ],
  },

  // 5. ÓRDENES DE COMPRA Y SERVICIO
  {
    id: 'proc-oc-emision',
    requisitosPrevios: ['Contar con una cotización adjudicada y aprobada.', 'Confirmar condiciones de pago, entrega y datos del proveedor.'],
    resultadoEsperado: 'La OC u OS queda emitida, disponible en PDF y vinculada con el compromiso de pago correspondiente.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Generar y Gestionar Órdenes de Compra (OC) y Servicio (OS)',
    subtitulo: 'Emisión del documento contractual, condiciones de pago, entrega y exportación en PDF.',
    modulo: 'Órdenes de C/S',
    href: '/ordenes-compra',
    rolesAplicables: ['logistica', 'administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Órdenes de Compra', 'PDF', 'Contratos', 'Finanzas'],
    objetivo: 'Emitir el documento oficial vinculante para el proveedor con términos comerciales claros y generar la cuenta por pagar en Administración.',
    pasos: [
      {
        numero: 1,
        titulo: 'Generar OC desde Cotización Adjudicada',
        descripcion: 'Desde la cotización aprobada por Gerencia, haz clic en "Generar Orden de Compra". Los ítems, precios pactados y datos del proveedor se transferirán automáticamente.',
      },
      {
        numero: 2,
        titulo: 'Definir Condiciones Comerciales y Lugar de Entrega',
        descripcion: 'Completa o verifica:',
        detalle: [
          'Forma de pago: Contado contra entrega, Crédito 15/30 días, o Adelanto %.',
          'Lugar de entrega: Almacén Central o dirección exacta de la Obra.',
          'Tiempo de entrega pactado y datos del contacto que recibirá.',
        ],
      },
      {
        numero: 3,
        titulo: 'Emitir y Descargar PDF Oficial',
        descripcion: 'Cambia el estado a "Emitida" y presiona "Descargar PDF" para obtener la Orden con membrete oficial, firmas y detalle tributario (Subtotal + IGV = Total) para remitirla al proveedor.',
      },
      {
        numero: 4,
        titulo: 'Integración automática con Pagos',
        descripcion: 'Al emitirse la OC, el sistema registra automáticamente el compromiso en el módulo de "Pagos" para su seguimiento por Administración.',
      },
    ],
  },

  // 6. COMPRAS SIMPLES / CAJA CHICA EN CAMPO
  {
    id: 'proc-compras-simples',
    requisitosPrevios: ['Conocer el proyecto al que corresponde el gasto.', 'Contar con una imagen o PDF legible del comprobante.'],
    resultadoEsperado: 'La compra queda registrada y enviada a Administración para su revisión, liquidación o reembolso.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Registrar Compras Simples y Gastos Menores de Campo',
    subtitulo: 'Rendición rápida de gastos de ferretería local, movilidad, insumos urgentes o caja chica.',
    modulo: 'Compras Simples',
    href: '/compras-simples/nueva',
    rolesAplicables: ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr', 'ing_civil', 'ing_electrico', 'logistica', 'administrador', 'gerencia'],
    etiquetas: ['Compras Simples', 'Caja Chica', 'Gastos de Campo', 'Comprobantes'],
    objetivo: 'Permitir al personal de campo sustentar gastos inmediatos sin necesidad de un proceso largo de cotización, manteniendo control fiscal.',
    pasos: [
      {
        numero: 1,
        titulo: 'Ingresar a Compras Simples > Nueva Compra',
        descripcion: 'Abre "Operaciones > Compras" y presiona "+ Nueva compra".',
      },
      {
        numero: 2,
        titulo: 'Completar Datos del Gasto y Comprobante',
        descripcion: 'Ingresa los datos solicitados:',
        detalle: [
          'Proyecto asociado al gasto.',
          'Tipo de comprobante: Factura, Boleta de Venta, Ticket o Recibo.',
          'Razón social y RUC del comercio o proveedor local.',
          'Monto total cancelado y moneda.',
          'Detalle de los ítems comprados y justificación.',
        ],
      },
      {
        numero: 3,
        titulo: 'Subir Foto o PDF del Comprobante',
        descripcion: 'Adjunta la fotografía nítida o escaneo del comprobante de pago emitido por el establecimiento.',
        advertencia: 'Asegúrate de que el RUC de DYC, la fecha y el monto total sean perfectamente legibles en la imagen para evitar que el gasto sea observado por Contabilidad.',
      },
      {
        numero: 4,
        titulo: 'Enviar para Aprobación y Reembolso',
        descripcion: 'Presiona "Guardar y enviar". Administración revisará el comprobante para proceder con el reembolso a tu cuenta o descuento del fondo fijo.',
      },
    ],
  },

  // 7. ASISTENCIA Y TAREO EN OBRA
  {
    id: 'proc-asistencia-tareo',
    requisitosPrevios: ['Tener acceso al proyecto y al turno de la jornada.', 'Verificar que el personal esté activo y asignado al proyecto.'],
    resultadoEsperado: 'La jornada queda guardada con la asistencia, incidencias y horas trabajadas del personal.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Control de Asistencia Diario y Tareo de Personal en Obra',
    subtitulo: 'Registro por frentes de trabajo, categorías, horas extras y control de visitas.',
    modulo: 'Asistencia',
    href: '/asistencia',
    rolesAplicables: ['pdr', 'supervisor', 'supervisor_civil', 'supervisor_electrico', 'administrador', 'gerencia'],
    etiquetas: ['Asistencia', 'Tareo', 'PDR', 'SSOMA', 'Planilla'],
    objetivo: 'Registrar la presencia física y horas laboradas del personal en cada jornada para la seguridad en obra y el cálculo exacto de la planilla.',
    pasos: [
      {
        numero: 1,
        titulo: 'Seleccionar el Proyecto y Turno de la Jornada',
        descripcion: 'Ingresa a "Operaciones > Asistencia", selecciona el proyecto donde estás operando y abre el turno correspondiente (Diurno / Nocturno) de la fecha actual.',
      },
      {
        numero: 2,
        titulo: 'Tarear a los Operarios y Personal de Campo',
        descripcion: 'En la lista de trabajadores asignados al proyecto, marca el estado de cada uno:',
        detalle: [
          'P (Presente / Asistió): Cumplió su jornada normal.',
          'T (Tardanza): Llegó después de la charla de 5 minutos / hora límite.',
          'FJ (Falta Justificada): Permiso autorizado o descanso médico.',
          'FI (Falta Injustificada): No asistió sin sustento.',
          'Horas Extras (HE): Registrar las horas efectivas trabajadas adicionales.',
        ],
      },
      {
        numero: 3,
        titulo: 'Tarear Staff y Contratistas (Terceros)',
        descripcion: 'Revisa las pestañas de "Staff" y "Terceros" para registrar la presencia de ingenieros, supervisores y personal subcontratado.',
      },
      {
        numero: 4,
        titulo: 'Registro de Visitas Externas',
        descripcion: 'Si ingresan inspectores del cliente, fiscalizadores o visitas técnicas, regístralos en la sección "Registro de Visitas" con su DNI, empresa, motivo e inducción de seguridad completada.',
      },
      {
        numero: 5,
        titulo: 'Guardar y Cerrar la Jornada',
        descripcion: 'Verifica el resumen total de presentes/ausentes y presiona "Guardar Jornada". La información queda registrada para la consolidación de Planilla.',
      },
    ],
    buenasPracticas: [
      'Realiza el tareo inmediatamente después de la charla de seguridad matutina.',
      'Si un operario es transferido de otra obra, solicítale al Administrador que lo vincule al proyecto antes de iniciar la jornada.',
      'Cualquier descanso médico debe ser notificado al PDR para adjuntar el certificado en la ficha del trabajador.',
    ],
  },

  // 8. PLANILLA Y NÓMINA
  {
    id: 'proc-planilla-generacion',
    requisitosPrevios: ['Contar con asistencias registradas para el periodo.', 'Tener configurados los jornales, bonos y descuentos aplicables.'],
    resultadoEsperado: 'La planilla queda revisada, cerrada y disponible para exportación y pago.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Generación y Cierre de Planilla por Proyecto',
    subtitulo: 'Cálculo de remuneraciones basado en los días y horas tareadas en Asistencia.',
    modulo: 'Planilla',
    href: '/planilla',
    rolesAplicables: ['administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Planilla', 'Nómina', 'Finanzas', 'Operarios'],
    objetivo: 'Procesar el pago exacto al personal operario y de staff conforme a sus jornales, categorías y asistencia real registrada.',
    pasos: [
      {
        numero: 1,
        titulo: 'Seleccionar Proyecto y Periodo',
        descripcion: 'Accede a "Finanzas > Planilla", selecciona el proyecto y el rango de fechas (semana o quincena a pagar).',
      },
      {
        numero: 2,
        titulo: 'Procesar Consolidado de Asistencias',
        descripcion: 'El sistema calcula automáticamente los días trabajados, horas extras, descuentos por tardanzas/faltas y bonificaciones según la categoría de cada trabajador.',
      },
      {
        numero: 3,
        titulo: 'Revisar y Ajustar Bonos o Descuentos Especiales',
        descripcion: 'Ingresa montos adicionales si aplican (bono por productividad, adelantos de quincena, reintegros o retenciones autorizadas).',
      },
      {
        numero: 4,
        titulo: 'Cerrar y Exportar Planilla',
        descripcion: 'Verifica los totales netos a pagar, aprueba la planilla y expórtala en formato Excel/PDF para la dispersión bancaria.',
      },
    ],
  },

  // 9. PAGOS A PROVEEDORES Y CUENTAS POR PAGAR
  {
    id: 'proc-pagos-proveedores',
    requisitosPrevios: ['Contar con una obligación pendiente registrada.', 'Tener los datos de la transferencia y su constancia.'],
    resultadoEsperado: 'El pago queda registrado con su sustento y el saldo pendiente se actualiza.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Gestión de Cuentas por Pagar y Registro de Pagos',
    subtitulo: 'Cronograma de vencimientos de Órdenes de Compra y liquidación de comprobantes.',
    modulo: 'Pagos',
    href: '/pagos',
    rolesAplicables: ['administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Pagos', 'Tesorería', 'Bancos', 'Proveedores'],
    objetivo: 'Llevar un control riguroso de los compromisos con proveedores y registrar las transferencias realizadas con sus constancias.',
    pasos: [
      {
        numero: 1,
        titulo: 'Revisar Cuentas por Pagar Pendientes',
        descripcion: 'En "Finanzas > Pagos", visualiza la lista de pagos pendientes generados por Órdenes de Compra y Compras Simples aprobadas.',
      },
      {
        numero: 2,
        titulo: 'Filtrar por Vencimiento o Proveedor',
        descripcion: 'Usa los filtros superiores para priorizar pagos urgentes, pagos vencidos o agrupar facturas por proveedor.',
      },
      {
        numero: 3,
        titulo: 'Registrar Pago / Liquidar',
        descripcion: 'Haz clic en "Registrar Pago" en la orden respectiva. Completa la fecha de transferencia, banco origen, número de operación bancaria y adjunta el voucher en PDF/imagen.',
      },
      {
        numero: 4,
        titulo: 'Actualización automática del estado',
        descripcion: 'El pago pasa a estado "Pagado" y se descuenta del saldo pendiente de la Orden de Compra.',
      },
    ],
  },

  // 10. COBROS Y FACTURACIÓN A CLIENTES
  {
    id: 'proc-cobros-clientes',
    requisitosPrevios: ['Identificar el proyecto, hito o factura que se cobrará.', 'Contar con los datos del comprobante o abono recibido.'],
    resultadoEsperado: 'El ingreso queda asociado al proyecto y el estado del cobro se actualiza para su seguimiento.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Control de Facturación e Ingresos por Hitos de Obra',
    subtitulo: 'Monitoreo de valorizaciones, emisión de comprobantes a clientes y registro de recaudación.',
    modulo: 'Cobros',
    href: '/cobros',
    rolesAplicables: ['administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Cobros', 'Clientes', 'Valorizaciones', 'Flujo de Caja'],
    objetivo: 'Asegurar que cada hito completado del proyecto sea facturado y cobrado en los plazos contractuales pactados.',
    pasos: [
      {
        numero: 1,
        titulo: 'Consultar el Tablero de Cobros',
        descripcion: 'En "Finanzas > Cobros", examina las valorizaciones e hitos de proyectos en estado pendiente de cobro.',
      },
      {
        numero: 2,
        titulo: 'Registrar Emisión de Factura al Cliente',
        descripcion: 'Asocia el número de factura electrónica emitida por DYC, monto (PEN/USD), fecha de emisión y fecha pactada de vencimiento.',
      },
      {
        numero: 3,
        titulo: 'Marcar como Cobrado al Recibir la Transferencia',
        descripcion: 'Cuando el cliente deposite en las cuentas de la empresa, haz clic en "Marcar Cobrado", ingresa el número de operación bancaria y fecha de abono.',
      },
    ],
  },

  // 11. ALMACENES Y CATÁLOGO DE ÍTEMS
  {
    id: 'proc-almacenes-items',
    requisitosPrevios: ['Tener permisos para administrar almacenes o el catálogo.', 'Contar con nombre, tipo y unidad de medida del ítem.'],
    resultadoEsperado: 'El almacén o ítem queda configurado y disponible para los procesos operativos relacionados.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Gestión de Almacenes y Catálogo de Ítems',
    subtitulo: 'Configuración de almacenes fijos/temporales y estandarización de consumibles y activos.',
    modulo: 'Almacenes',
    href: '/almacenes',
    rolesAplicables: ['logistica', 'administrador', 'gerencia', 'admin_ti'],
    etiquetas: ['Almacén', 'Inventario', 'Ítems', 'Herramientas'],
    objetivo: 'Mantener un catálogo ordenado y trazable de todos los consumibles y activos disponibles en la empresa y en cada obra.',
    pasos: [
      {
        numero: 1,
        titulo: 'Crear o Consultar Almacenes',
        descripcion: 'En "Operaciones > Almacenes", gestiona los almacenes fijos (base central) y almacenes temporales creados para obras específicas.',
      },
      {
        numero: 2,
        titulo: 'Registrar Nuevos Ítems en el Catálogo',
        descripcion: 'Ingresa a "Catálogo de ítems > Nuevo ítem". Especifica el nombre estandarizado, tipo (Consumible o Activo/Equipo), unidad de medida base y descripción.',
      },
      {
        numero: 3,
        titulo: 'Asignar Ítems a Requerimientos y Cotizaciones',
        descripcion: 'Los ítems del catálogo aparecen como sugerencias de autocompletado en los requerimientos, agilizando la estandarización de compras.',
      },
    ],
  },

  // 12. GESTIÓN DE USUARIOS Y ACCESOS
  {
    id: 'proc-usuarios-seguridad',
    requisitosPrevios: ['Tener permisos de administración de usuarios.', 'Contar con los datos del colaborador y el rol que le corresponde.'],
    resultadoEsperado: 'La cuenta queda creada con los accesos correctos y lista para ser entregada al colaborador.',
    ultimaRevision: '3 sep 2026',
    version: '1.0',
    titulo: 'Administración de Usuarios y Asignación de Roles',
    subtitulo: 'Creación de cuentas, configuración de perfiles y seguridad de acceso.',
    modulo: 'Usuarios',
    href: '/usuarios',
    rolesAplicables: ['administrador', 'admin_ti'],
    etiquetas: ['Usuarios', 'Seguridad', 'Roles', 'TI'],
    objetivo: 'Garantizar que cada colaborador cuente con los accesos estrictamente necesarios para su función en obra u oficina.',
    pasos: [
      {
        numero: 1,
        titulo: 'Ingresar a Administración > Usuarios',
        descripcion: 'Presiona "+ Nuevo usuario" para dar de alta una cuenta en el sistema.',
      },
      {
        numero: 2,
        titulo: 'Completar Datos y Asignar Rol Exacto',
        descripcion: 'Ingresa el nombre completo, correo corporativo y contraseña inicial. Selecciona el rol exacto según su cargo (Supervisor, PDR, Logística, Gerencia, etc.).',
      },
      {
        numero: 3,
        titulo: 'Vincular con Trabajador de Obra (Opcional)',
        descripcion: 'Si el usuario es también un trabajador en planilla, vincúlalo con su registro maestro para unificar su DNI y ficha laboral.',
      },
    ],
  },
]

export const GUIAS_FAQS: GuiaFaq[] = [
  // REQUERIMIENTOS
  {
    id: 'faq-req-1',
    pregunta: '¿Qué debo hacer si mi requerimiento aparece en estado "Observado"?',
    respuesta: 'Un requerimiento observado indica que el revisor técnico o logística encontró alguna inconsistencia (falta de detalle en especificaciones, cantidad desproporcionada o unidad de medida errónea).',
    categoria: 'requerimientos',
    rolesAplicables: ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr', 'ing_civil', 'ing_electrico'],
    solucionPasoAPaso: [
      'Abre el requerimiento observado y lee la nota de observación dejada por el revisor.',
      'Haz clic en el botón "Editar requerimiento".',
      'Modifica los ítems, cantidades o adjunta los planos/especificaciones solicitadas.',
      'Presiona "Reenviar a revisión" para que el aprobador reciba la versión corregida.',
    ],
    moduloHref: '/requerimientos',
    moduloLabel: 'Ir a Requerimientos',
  },
  {
    id: 'faq-req-2',
    pregunta: '¿Puedo cancelar o modificar un requerimiento después de haber sido aprobado?',
    respuesta: 'Una vez aprobado, el requerimiento pasa a manos de Logística para su cotización. Si requieres cancelarlo o modificar cantidades, debes coordinar de inmediato con el área de Logística para que desvinculen el pedido antes de que se emita la Orden de Compra.',
    categoria: 'requerimientos',
    rolesAplicables: ['supervisor', 'ing_civil', 'ing_electrico', 'pdr', 'logistica'],
    moduloHref: '/requerimientos',
    moduloLabel: 'Ver Requerimientos',
  },
  {
    id: 'faq-req-3',
    pregunta: '¿Quién es el aprobador técnico según el tipo de requerimiento?',
    respuesta: 'El sistema asigna la revisión técnica según la especialidad:',
    categoria: 'requerimientos',
    rolesAplicables: ['supervisor', 'ing_civil', 'ing_electrico', 'jefe_sig', 'logistica'],
    solucionPasoAPaso: [
      'Tipo Civil: Es aprobado por el Ingeniero Civil o Ingeniero Residente.',
      'Tipo Eléctrico: Es aprobado por el Ingeniero Eléctrico / Especialista.',
      'Tipo Seguridad: Es aprobado por el Jefe SIG / SSOMA.',
      'Tipo Administrativo: Es aprobado directamente por el área de Logística y Administración.',
    ],
  },

  // ASISTENCIA
  {
    id: 'faq-asist-1',
    pregunta: '¿Qué hago si un operario nuevo no aparece en la lista de asistencia del proyecto?',
    respuesta: 'El operario debe estar previamente registrado en el maestro de Trabajadores y asignado a ese proyecto. Si no aparece en la lista:',
    categoria: 'asistencia',
    rolesAplicables: ['pdr', 'supervisor', 'administrador'],
    solucionPasoAPaso: [
      'Verifica con Administración que el trabajador tenga su registro activo con DNI en "Maestros > Trabajadores".',
      'Asegúrate de que en el proyecto esté asignado como personal de obra activo.',
      'Si se trata de un ingreso urgente, regístralo temporalmente en la sección de "Visitas / Control de ingreso" hasta que Administración complete el alta formal.',
    ],
    moduloHref: '/asistencia',
    moduloLabel: 'Ir a Asistencia',
  },
  {
    id: 'faq-asist-2',
    pregunta: '¿Cómo corrijo un error en el tareo de una jornada ya guardada?',
    respuesta: 'Puedes ingresar al detalle de la jornada de la fecha correspondiente y hacer clic en "Editar tareo" si la semana de planilla aún no ha sido cerrada por Administración. Realiza la corrección (ej: cambiar falta por descanso médico con sustento) y vuelve a guardar.',
    categoria: 'asistencia',
    rolesAplicables: ['pdr', 'supervisor', 'administrador'],
    moduloHref: '/asistencia',
    moduloLabel: 'Ver Jornadas',
  },

  // COMPRAS SIMPLES
  {
    id: 'faq-comp-1',
    pregunta: '¿Qué comprobantes son válidos para rendir una Compra Simple?',
    respuesta: 'Para que una compra simple sea aceptada y reembolsada por Contabilidad:',
    categoria: 'compras',
    rolesAplicables: ['supervisor', 'pdr', 'ing_civil', 'logistica', 'administrador'],
    solucionPasoAPaso: [
      'Factura Electrónica: Obligatoria para montos mayores o compras donde la empresa requiera crédito fiscal (con RUC y Razón Social de DYC).',
      'Boleta de Venta: Aceptable para compras menores en ferreterías o comercios locales autorizados.',
      'Ticket / Recibo: Solo para gastos menores de movilidad local o caja chica justificada.',
      'La fotografía debe mostrar nítidamente el número de comprobante, fecha, RUC emisor y monto total.',
    ],
    moduloHref: '/compras-simples/nueva',
    moduloLabel: 'Registrar Compra Simple',
  },

  // COTIZACIONES Y ÓRDENES
  {
    id: 'faq-coti-1',
    pregunta: '¿Por qué no puedo generar una Orden de Compra desde la Cotización?',
    respuesta: 'Para que el botón "Generar Orden de Compra" se active en una cotización, se deben cumplir los siguientes requisitos:',
    categoria: 'cotizaciones',
    rolesAplicables: ['logistica', 'gerencia', 'administrador'],
    solucionPasoAPaso: [
      'Haber seleccionado al menos un proveedor adjudicado en la Matriz Comparativa.',
      'Contar con la aprobación del Solicitante ("Aprobada Solicitante").',
      'Contar con la aprobación final de Gerencia ("Aprobada Gerencia").',
      'Tener todos los ítems cotizados con precios unitarios mayores a cero.',
    ],
    moduloHref: '/cotizaciones',
    moduloLabel: 'Ir a Cotizaciones',
  },
  {
    id: 'faq-coti-2',
    pregunta: '¿Cómo exportar una Orden de Compra o Servicio en PDF con formato oficial?',
    respuesta: 'Ingresa a la Orden de Compra en "/ordenes-compra/[id]" y presiona el botón "Descargar PDF" o "Imprimir". El documento generado contiene automáticamente el logotipo, membrete, datos fiscales de DYC, datos del proveedor, detalle de ítems, términos de entrega y firmas.',
    categoria: 'cotizaciones',
    rolesAplicables: ['logistica', 'administrador', 'gerencia'],
    moduloHref: '/ordenes-compra',
    moduloLabel: 'Ver Órdenes de Compra',
  },

  // FINANZAS (PAGOS, COBROS Y PLANILLA)
  {
    id: 'faq-fin-1',
    pregunta: '¿Cómo asociar el voucher bancario a un pago de proveedor?',
    respuesta: 'En "Finanzas > Pagos", ubica la cuenta por pagar en estado "Pendiente". Haz clic en "Registrar Pago", selecciona el banco de origen, escribe el número de operación bancaria emitido por la entidad financiera y sube el archivo PDF o imagen del voucher.',
    categoria: 'finanzas',
    rolesAplicables: ['administrador', 'gerencia'],
    moduloHref: '/pagos',
    moduloLabel: 'Ir a Pagos',
  },
  {
    id: 'faq-fin-2',
    pregunta: '¿Cómo se calcula el monto a cobrar por un hito de proyecto?',
    respuesta: 'En "Finanzas > Cobros", cada proyecto tiene desglosados sus hitos contractuales (ej: Anticipo 20%, Avance de estructura 40%, Liquidación 40%). Al cumplirse la meta física, se emite la factura por el porcentaje correspondiente y se monitorea su pago.',
    categoria: 'finanzas',
    rolesAplicables: ['administrador', 'gerencia'],
    moduloHref: '/cobros',
    moduloLabel: 'Ir a Cobros',
  },

  // USUARIOS Y ACCESOS
  {
    id: 'faq-usr-1',
    pregunta: '¿Qué hacer si un colaborador no puede ingresar al sistema o olvidó su contraseña?',
    respuesta: 'El Administrador de TI o el Administrador General puede ingresar a "/usuarios", buscar la cuenta del colaborador, abrir su ficha y hacer clic en "Editar usuario" o "Restablecer contraseña" para asignar una nueva clave temporal.',
    categoria: 'usuarios',
    rolesAplicables: ['admin_ti', 'administrador'],
    moduloHref: '/usuarios',
    moduloLabel: 'Gestión de Usuarios',
  },
]

export const GLOSARIO_TERMINOS = [
  {
    termino: 'Requerimiento',
    definicion: 'Documento inicial generado desde obra u oficina solicitando materiales, herramientas o servicios necesarios para la ejecución de un proyecto.',
  },
  {
    termino: 'Cotización',
    definicion: 'Propuesta económica y comercial remitida por un proveedor que detalla precios unitarios, moneda, tiempo de entrega y condiciones de pago.',
  },
  {
    termino: 'Adjudicación',
    definicion: 'Proceso de selección de la mejor oferta técnica y económica entre múltiples cotizaciones registradas para emitir la orden de compra.',
  },
  {
    termino: 'Orden de Compra (OC)',
    definicion: 'Documento contractual oficial emitido al proveedor seleccionado que compromete la adquisición de bienes según los términos pactados.',
  },
  {
    termino: 'Orden de Servicio (OS)',
    definicion: 'Documento contractual oficial para la contratación de mano de obra especializada, alquiler de maquinaria o servicios de terceros.',
  },
  {
    termino: 'Compra Simple',
    definicion: 'Rendición directa de gastos menores y urgentes de campo con sustento de boleta, factura o ticket sin requerir licitación previa.',
  },
  {
    termino: 'Tareo / Asistencia',
    definicion: 'Control diario de presencia, horas trabajadas, horas extras y ausencias del personal de obra para la elaboración de la planilla.',
  },
  {
    termino: 'PDR / SSOMA',
    definicion: 'Prevencionista de Riesgos / Seguridad, Salud Ocupacional y Medio Ambiente encargado del cuidado del personal y control de campo.',
  },
  {
    termino: 'SIG (Sistema Integrado de Gestión)',
    definicion: 'Área encargada de velar por los estándares de calidad, seguridad y medio ambiente en toda la operación de la empresa.',
  },
]

export const FLUJOS_GLOBALES: FlujoGlobal[] = [
  {
    id: 'flujo-abastecimiento',
    titulo: 'Flujo Completo de Abastecimiento (De Requerimiento a Recepción)',
    descripcion: 'Ciclo integral desde que se detecta la necesidad en obra hasta que los materiales llegan y se pagan.',
    fases: [
      {
        numero: 1,
        nombre: '1. Creación en Obra',
        responsable: 'Supervisor / Residente / PDR',
        descripcion: 'Genera el requerimiento con ítems detallados, cantidades y especificaciones.',
        estadoDoc: 'Borrador / Enviado',
      },
      {
        numero: 2,
        nombre: '2. Aprobación Técnica',
        responsable: 'Ing. Civil / Eléctrico / Jefe SIG',
        descripcion: 'Valida la pertinencia técnica, normas y presupuesto del pedido.',
        estadoDoc: 'Aprobado',
      },
      {
        numero: 3,
        nombre: '3. Cotización y Comparación',
        responsable: 'Logística',
        descripcion: 'Invita proveedores, recibe propuestas y arma la matriz comparativa de adjudicación.',
        estadoDoc: 'Cotizada / Seleccionada',
      },
      {
        numero: 4,
        nombre: '4. Autorización Gerencial',
        responsable: 'Gerencia General',
        descripcion: 'Autoriza el monto económico y la adjudicación del proveedor ganador.',
        estadoDoc: 'Aprobada Gerencia',
      },
      {
        numero: 5,
        nombre: '5. Emisión de OC y Entrega',
        responsable: 'Logística / Proveedor',
        descripcion: 'Emite la Orden de Compra oficial en PDF y despacha los materiales a obra.',
        estadoDoc: 'Orden Generada',
      },
      {
        numero: 6,
        nombre: '6. Conformidad y Cierre',
        responsable: 'Supervisor en Obra',
        descripcion: 'Inspecciona los materiales recibidos contra la guía de remisión y otorga la conformidad.',
        estadoDoc: 'Recibido',
      },
    ],
  },
  {
    id: 'flujo-asistencia-planilla',
    titulo: 'Flujo de Asistencia a Pago de Planilla',
    descripcion: 'Cómo el tareo diario en campo se transforma de manera automatizada en el pago al personal.',
    fases: [
      {
        numero: 1,
        nombre: '1. Tareo Diario en Campo',
        responsable: 'PDR / Supervisor',
        descripcion: 'Registra diariamente la asistencia, tardanzas, permisos y horas extras de operarios y staff.',
        estadoDoc: 'Jornada Registrada',
      },
      {
        numero: 2,
        nombre: '2. Consolidación Semanal',
        responsable: 'Administración',
        descripcion: 'Cierra el periodo semanal/quincenal e importa las asistencias consolidadas.',
        estadoDoc: 'Pre-Planilla',
      },
      {
        numero: 3,
        nombre: '3. Cálculo de Haberes y Bonos',
        responsable: 'Administración',
        descripcion: 'Aplica jornales por categoría, horas extras, descuentos y bonificaciones autorizadas.',
        estadoDoc: 'Planilla Procesada',
      },
      {
        numero: 4,
        nombre: '4. Aprobación y Dispersión Bancaria',
        responsable: 'Gerencia / Tesorería',
        descripcion: 'Autoriza el desembolso y realiza la transferencia a las cuentas de los trabajadores.',
        estadoDoc: 'Planilla Pagada',
      },
    ],
  },
]
