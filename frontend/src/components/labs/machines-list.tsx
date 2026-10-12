"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, FlaskConical, Play } from "lucide-react"

import { getApiErrorMessage, labs, machines, type LabStatus, type Machine } from "@/lib/api"
import { DifficultyBadge } from "./difficulty-badge"

export function MachinesList() {
  const [items, setItems] = useState<Machine[] | null>(null)
  const [lab, setLab] = useState<LabStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([machines.list(), labs.status()])
      .then(([m, s]) => {
        if (!active) return
        setItems(m)
        setLab(s)
      })
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">Cargando máquinas...</p>
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay máquinas disponibles.
      </p>
    )
  }

  const activeSlug = lab && lab.status !== "none" ? lab.machine_slug : null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => {
        const isActive = m.slug === activeSlug
        return (
          <Link
            key={m.id}
            href={`/dashboard/labs/${m.slug}`}
            className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-5 text-primary" />
                <span className="font-medium">{m.name}</span>
              </div>
              {m.progress.is_complete ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : null}
            </div>

            <p className="line-clamp-2 text-sm text-muted-foreground">
              {m.description}
            </p>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DifficultyBadge difficulty={m.difficulty} />
                <span className="text-xs text-muted-foreground">
                  {m.points} pts
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FlagMark label="user" done={m.progress.user_flag_obtained} />
                <FlagMark label="root" done={m.progress.root_flag_obtained} />
              </div>
            </div>

            {isActive ? (
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <Play className="size-3" /> Laboratorio activo
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}

function FlagMark({ label, done }: { label: string; done: boolean }) {
  return (
    <span className="flex items-center gap-1" title={`Flag ${label}`}>
      {done ? (
        <CheckCircle2 className="size-3 text-green-500" />
      ) : (
        <Circle className="size-3" />
      )}
      {label}
    </span>
  )
}
