import { JornadaDetailView } from './components/JornadaDetailView'

interface Props {
  params: Promise<{ id: string }>
}

export default async function JornadaDetailPage({ params }: Props) {
  const { id } = await params
  return <JornadaDetailView turnoId={id} />
}
