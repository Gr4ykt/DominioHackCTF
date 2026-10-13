"use client"

import { useEffect, useState } from "react"
import { Ban, CheckCircle2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSession } from "@/components/dashboard/session-provider"
import { admin, getApiErrorMessage, type AdminUser, type Role } from "@/lib/api"

export function UsersAdmin() {
  const { user: me } = useSession()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const isSuper = me?.role === "superuser"

  function load() {
    return admin.users
      .list()
      .then((r) => setUsers(r.items))
      .catch((e) => setError(getApiErrorMessage(e)))
  }

  useEffect(() => {
    let active = true
    admin.users
      .list()
      .then((r) => active && setUsers(r.items))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await fn()
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  if (error && !users) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>
  }
  if (!users) {
    return <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === me?.id
              const isTargetSuper = u.role === "superuser"
              const busy = busyId === u.id
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">
                    {u.username}
                    {isSelf ? (
                      <span className="ml-1 text-xs text-muted-foreground">(tú)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2">
                    {isSuper && !isTargetSuper && !isSelf ? (
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) =>
                          run(u.id, () =>
                            admin.users.setRole(u.id, e.target.value as Role)
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className="flex items-center gap-1">
                        {isTargetSuper ? (
                          <ShieldCheck className="size-4 text-primary" />
                        ) : null}
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.is_active ? (
                      <span className="text-green-500">activa</span>
                    ) : (
                      <span className="text-destructive">desactivada</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!isTargetSuper && !isSelf ? (
                      u.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(u.id, () => admin.users.setActive(u.id, false))
                          }
                        >
                          <Ban /> Desactivar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(u.id, () => admin.users.setActive(u.id, true))
                          }
                        >
                          <CheckCircle2 /> Activar
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!isSuper ? (
        <p className="text-xs text-muted-foreground">
          Solo el superusuario puede cambiar roles.
        </p>
      ) : null}
    </div>
  )
}
