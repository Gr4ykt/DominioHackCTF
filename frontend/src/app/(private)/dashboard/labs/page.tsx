import { PageHeader } from "@/components/dashboard/page-header"
import { MachinesList } from "@/components/labs/machines-list"

export default function LabsPage() {
  return (
    <>
      <PageHeader
        title="Laboratorios"
        description="Máquinas vulnerables disponibles. Inicia una para desplegarla y accede por la VPN."
      />
      <MachinesList />
    </>
  )
}
