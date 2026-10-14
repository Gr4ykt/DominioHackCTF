"use client"

import { useEffect, useState } from "react"
import { BookOpen, CheckCircle2, Circle, Server, Star } from "lucide-react"

import { useSession } from "@/components/dashboard/session-provider"
import { getApiErrorMessage, users, type UserProgress } from "@/lib/api"

export function ProgressView() {
  const { user } = useSession()
  const [data, setData] = useState<UserProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    users
      .progress(user.id)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [user])

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (!data) return <p className="text-sm text-muted-foreground">Cargando progreso...</p>

  const machinesDone = data.machines.filter((m) => m.is_complete).length
  const modulesDone = data.modules.filter((m) => m.is_complete).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Star className="size-5 text-primary" />} label="Puntos" value={data.total_points} />
        <Stat
          icon={<Server className="size-5 text-primary" />}
          label="Máquinas resueltas"
          value={`${machinesDone}/${data.machines_total}`}
        />
        <Stat
          icon={<BookOpen className="size-5 text-primary" />}
          label="Módulos completados"
          value={`${modulesDone}/${data.modules_total}`}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Máquinas</h2>
        {data.machines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has iniciado ninguna máquina.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Máquina</th>
                  <th className="w-20 px-4 py-2 text-center font-medium">User</th>
                  <th className="w-20 px-4 py-2 text-center font-medium">Root</th>
                  <th className="w-28 px-4 py-2 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.machines.map((m) => (
                  <tr key={m.slug} className="border-t border-border">
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2 text-center"><Flag on={m.user_flag} /></td>
                    <td className="px-4 py-2 text-center"><Flag on={m.root_flag} /></td>
                    <td className="px-4 py-2 text-center text-xs">
                      {m.is_complete ? (
                        <span className="text-green-500">Completada</span>
                      ) : (
                        <span className="text-muted-foreground">En curso</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Módulos</h2>
        {data.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has empezado ningún módulo.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Módulo</th>
                  <th className="w-32 px-4 py-2 font-medium">Categoría</th>
                  <th className="w-28 px-4 py-2 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.modules.map((m) => (
                  <tr key={`${m.category}-${m.title}`} className="border-t border-border">
                    <td className="px-4 py-2">{m.title}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-2 text-center text-xs">
                      {m.is_complete ? (
                        <span className="text-green-500">Completado</span>
                      ) : (
                        <span className="text-muted-foreground">En curso</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function Flag({ on }: { on: boolean }) {
  return on ? (
    <CheckCircle2 className="mx-auto size-4 text-green-500" />
  ) : (
    <Circle className="mx-auto size-4 text-muted-foreground/40" />
  )
}
