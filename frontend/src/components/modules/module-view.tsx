"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import {
  getApiErrorMessage,
  modules,
  type ModuleDetail,
  type UserQuestion,
} from "@/lib/api"

export function ModuleView({ slug }: { slug: string }) {
  const [mod, setMod] = useState<ModuleDetail | null>(null)
  const [questions, setQuestions] = useState<UserQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [busyQ, setBusyQ] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([modules.get(slug), modules.questions(slug)])
      .then(([m, q]) => {
        if (!active) return
        setMod(m)
        setQuestions(q)
      })
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [slug])

  async function answer(q: UserQuestion) {
    const value = (inputs[q.id] ?? "").trim()
    if (!value) return
    setBusyQ(q.id)
    setError(null)
    try {
      const r = await modules.answer(slug, q.id, value)
      setFeedback((f) => ({ ...f, [q.id]: r.correct }))
      if (r.correct) {
        setQuestions((qs) =>
          qs!.map((x) => (x.id === q.id ? { ...x, answered_correct: true } : x))
        )
        setMod((m) =>
          m ? { ...m, score: r.score, is_complete: r.module_complete } : m
        )
      }
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setBusyQ(null)
    }
  }

  if (error && !mod) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (!mod || !questions) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {mod.category}
        </span>
        {mod.total_questions > 0 ? (
          <span className="text-sm text-muted-foreground">
            {mod.score}/{mod.total_questions} preguntas correctas
          </span>
        ) : null}
        {mod.is_complete ? (
          <span className="flex items-center gap-1 text-sm font-medium text-green-500">
            <Trophy className="size-4" /> Completado
          </span>
        ) : null}
      </div>

      <Markdown>{mod.content}</Markdown>

      {questions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Preguntas de validación</h2>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          {questions.map((q, i) => {
            const done = q.answered_correct
            const fb = feedback[q.id]
            return (
              <div key={q.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                <p className="flex items-start gap-2 font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{q.question}</span>
                  {done ? <CheckCircle2 className="size-5 shrink-0 text-green-500" /> : null}
                </p>

                {done ? (
                  <p className="text-sm text-green-500">Respondida correctamente.</p>
                ) : q.type === "multiple_choice" ? (
                  <div className="space-y-2">
                    {q.options?.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={inputs[q.id] === o.id}
                          onChange={() => setInputs((v) => ({ ...v, [q.id]: o.id }))}
                        />
                        {o.text}
                      </label>
                    ))}
                    <Answer busy={busyQ === q.id} onClick={() => answer(q)} fb={fb} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={inputs[q.id] ?? ""}
                      onChange={(e) => setInputs((v) => ({ ...v, [q.id]: e.target.value }))}
                      placeholder="Tu respuesta"
                    />
                    <Answer busy={busyQ === q.id} onClick={() => answer(q)} fb={fb} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function Answer({
  busy,
  onClick,
  fb,
}: {
  busy: boolean
  onClick: () => void
  fb: boolean | undefined
}) {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm" onClick={onClick} disabled={busy}>
        {busy ? "Comprobando..." : "Responder"}
      </Button>
      {fb === false ? (
        <span className="text-sm text-destructive">Incorrecta, intenta de nuevo.</span>
      ) : null}
    </div>
  )
}
