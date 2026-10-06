import { PageHeader } from "@/components/dashboard/page-header"

export default async function LabPage(
  props: PageProps<"/dashboard/labs/[slug]">
) {
  const { slug } = await props.params

  return (
    <PageHeader
      title={`Laboratorio: ${slug}`}
      description="Iniciar o detener la máquina, tiempo restante e ingreso de flags."
    />
  )
}
