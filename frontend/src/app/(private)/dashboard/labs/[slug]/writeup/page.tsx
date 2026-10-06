import { PageHeader } from "@/components/dashboard/page-header"

export default async function LabWriteupPage(
  props: PageProps<"/dashboard/labs/[slug]/writeup">
) {
  const { slug } = await props.params

  return (
    <PageHeader
      title={`Writeup: ${slug}`}
      description="Disponible solo después de resolver el laboratorio."
    />
  )
}
