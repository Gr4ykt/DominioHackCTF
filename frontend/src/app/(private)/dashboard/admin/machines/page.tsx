import { PageHeader } from "@/components/dashboard/page-header"
import { AdminGuard } from "@/components/admin/admin-guard"
import { MachinesAdmin } from "@/components/admin/machines-admin"

export default function AdminMachinesPage() {
  return (
    <>
      <PageHeader
        title="Administración de máquinas"
        description="Crea, edita, activa/desactiva máquinas y define sus flags."
      />
      <AdminGuard>
        <MachinesAdmin />
      </AdminGuard>
    </>
  )
}
