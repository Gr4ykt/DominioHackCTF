import { PageHeader } from "@/components/dashboard/page-header"
import { AdminGuard } from "@/components/admin/admin-guard"
import { UsersAdmin } from "@/components/admin/users-admin"

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Administración de usuarios"
        description="Gestiona cuentas: roles (solo superusuario) y activar/desactivar."
      />
      <AdminGuard>
        <UsersAdmin />
      </AdminGuard>
    </>
  )
}
