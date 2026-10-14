import { PageHeader } from "@/components/dashboard/page-header"
import { ModuleView } from "@/components/modules/module-view"

export default async function ModulePage(
  props: PageProps<"/dashboard/modules/[slug]">
) {
  const { slug } = await props.params
  return (
    <>
      <PageHeader title="Módulo" description="Lee el contenido y responde las preguntas." />
      <ModuleView slug={slug} />
    </>
  )
}
