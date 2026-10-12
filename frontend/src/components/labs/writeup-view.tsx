"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { getApiErrorMessage, machines } from "@/lib/api"

export function WriteupView({ slug }: { slug: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    machines
      .writeup(slug)
      .then((w) => active && setContent(w.content))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [slug])

  if (error) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Link
          href={`/dashboard/labs/${slug}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Volver al laboratorio
        </Link>
      </div>
    )
  }
  if (content === null) {
    return <p className="text-sm text-muted-foreground">Cargando writeup...</p>
  }
  // Markdown en crudo (dentro de <pre>) por ahora; render enriquecido es mejora futura.
  return (
    <pre className="max-w-2xl overflow-x-auto rounded-lg border border-border bg-card p-5 text-sm whitespace-pre-wrap">
      {content}
    </pre>
  )
}
