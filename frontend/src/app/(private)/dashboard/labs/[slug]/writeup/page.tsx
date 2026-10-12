import { PageHeader } from "@/components/dashboard/page-header"
import { WriteupView } from "@/components/labs/writeup-view"

export default async function LabWriteupPage(
  props: PageProps<"/dashboard/labs/[slug]/writeup">
) {
  const { slug } = await props.params
  return (
    <>
      <PageHeader title="Writeup" description="Disponible tras completar la máquina." />
      <WriteupView slug={slug} />
    </>
  )
}
