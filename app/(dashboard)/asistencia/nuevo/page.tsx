import { redirect } from 'next/navigation'

// El selector de obra vive ahora en /asistencia (tarjetas "Hoy"). Se conserva la
// ruta para no romper enlaces guardados.
export default function NuevaAsistenciaPage() {
  redirect('/asistencia')
}
