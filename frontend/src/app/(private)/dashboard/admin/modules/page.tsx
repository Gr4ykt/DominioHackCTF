import { PageHeader } from "@/components/dashboard/page-header"
import { AdminGuard } from "@/components/admin/admin-guard"
import { ModulesAdmin } from "@/components/admin/modules-admin"

export default function AdminModulesPage() {
  return (
    <>
      <PageHeader
        title="Administración de módulos"
        description="Crea, edita y publica módulos teóricos y sus preguntas de validación."
      />
      <AdminGuard>
        <ModulesAdmin />
      </AdminGuard>
    </>
  )
}
