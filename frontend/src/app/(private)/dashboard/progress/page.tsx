import { PageHeader } from "@/components/dashboard/page-header"
import { ProgressView } from "@/components/progress/progress-view"

export default function ProgressPage() {
  return (
    <>
      <PageHeader
        title="Progreso"
        description="Módulos completados, laboratorios resueltos y puntos acumulados."
      />
      <ProgressView />
    </>
  )
}
