import { PageHeader } from "@/components/dashboard/page-header"
import { LabDetail } from "@/components/labs/lab-detail"

export default async function LabPage(
  props: PageProps<"/dashboard/labs/[slug]">
) {
  const { slug } = await props.params
  return (
    <>
      <PageHeader title="Laboratorio" description="Despliega la máquina y envía tus flags." />
      <LabDetail slug={slug} />
    </>
  )
}
