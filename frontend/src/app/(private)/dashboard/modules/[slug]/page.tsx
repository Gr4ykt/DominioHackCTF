import { PageHeader } from "@/components/dashboard/page-header"

export default async function ModulePage(
  props: PageProps<"/dashboard/modules/[slug]">
) {
  const { slug } = await props.params

  return (
    <PageHeader
      title={`Módulo: ${slug}`}
      description="Contenido teórico y preguntas de validación."
    />
  )
}
