"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, CheckCircle2 } from "lucide-react"

import { getApiErrorMessage, modules, type UserModuleListItem } from "@/lib/api"

export function ModulesList() {
  const [items, setItems] = useState<UserModuleListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    modules
      .list()
      .then((m) => active && setItems(m))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (!items) return <p className="text-sm text-muted-foreground">Cargando módulos...</p>
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay módulos publicados.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <Link
          key={m.id}
          href={`/dashboard/modules/${m.slug}`}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <span className="font-medium">{m.title}</span>
            </div>
            {m.is_complete ? <CheckCircle2 className="size-5 text-green-500" /> : null}
          </div>
          <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {m.category}
          </span>
          <p className="mt-auto text-xs text-muted-foreground">
            {m.total_questions > 0
              ? `${m.score}/${m.total_questions} preguntas correctas`
              : "Sin preguntas"}
          </p>
        </Link>
      ))}
    </div>
  )
}
