import { PageHeader } from "@/components/dashboard/page-header"
import { DashboardHome } from "@/components/dashboard/dashboard-home"

export default function DashboardHomePage() {
  return (
    <>
      <PageHeader
        title="Inicio"
        description="Resumen de tu actividad en la plataforma."
      />
      <DashboardHome />
    </>
  )
}
