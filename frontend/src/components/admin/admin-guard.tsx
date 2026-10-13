"use client"

import { useSession } from "@/components/dashboard/session-provider"

/** Muestra el contenido solo a admin/superuser (o solo superuser). */
export function AdminGuard({
  children,
  requireSuperuser = false,
}: {
  children: React.ReactNode
  requireSuperuser?: boolean
}) {
  const { user } = useSession()
  if (!user) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }
  const allowed = requireSuperuser
    ? user.role === "superuser"
    : user.role === "admin" || user.role === "superuser"
  if (!allowed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No tienes permiso para ver esta sección.
      </p>
    )
  }
  return <>{children}</>
}
