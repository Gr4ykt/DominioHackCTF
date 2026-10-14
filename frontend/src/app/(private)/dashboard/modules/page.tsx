import { PageHeader } from "@/components/dashboard/page-header"
import { ModulesList } from "@/components/modules/modules-list"

export default function ModulesPage() {
  return (
    <>
      <PageHeader
        title="Módulos"
        description="Contenido teórico por categoría con preguntas de validación."
      />
      <ModulesList />
    </>
  )
}
