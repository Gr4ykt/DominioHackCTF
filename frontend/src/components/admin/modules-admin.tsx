"use client"

import { useEffect, useState } from "react"
import { BookOpen, ListChecks, Pencil, Plus, Power, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  admin,
  getApiErrorMessage,
  type AdminModuleListItem,
  type ModuleFull,
  type ModuleInput,
} from "@/lib/api"

const EMPTY: ModuleInput = {
  slug: "",
  title_es: "",
  title_en: "",
  content_es: "",
  content_en: "",
  category: "SQLi",
  order: 1,
}

export function ModulesAdmin() {
  const [modules, setModules] = useState<AdminModuleListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ModuleFull | "new" | null>(null)
  const [questionsFor, setQuestionsFor] = useState<AdminModuleListItem | null>(null)

  function load() {
    return admin.modules
      .catalog()
      .then(setModules)
      .catch((e) => setError(getApiErrorMessage(e)))
  }

  useEffect(() => {
    let active = true
    admin.modules
      .catalog()
      .then((m) => active && setModules(m))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  async function openEdit(m: AdminModuleListItem) {
    setError(null)
    try {
      setEditing(await admin.modules.full(m.slug))
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  async function toggle(m: AdminModuleListItem) {
    setError(null)
    try {
      await admin.modules.toggle(m.slug)
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  async function remove(m: AdminModuleListItem) {
    if (!confirm(`¿Eliminar el módulo "${m.title_es}"?`)) return
    setError(null)
    try {
      await admin.modules.remove(m.slug)
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  if (error && !modules) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>
  }
  if (!modules) {
    return <p className="text-sm text-muted-foreground">Cargando módulos...</p>
  }

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      {editing === null && questionsFor === null ? (
        <Button onClick={() => setEditing("new")}>
          <Plus /> Nuevo módulo
        </Button>
      ) : null}

      {editing !== null ? (
        <ModuleForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
          onError={setError}
        />
      ) : null}

      {questionsFor !== null ? (
        <QuestionsEditor
          module={questionsFor}
          onClose={() => setQuestionsFor(null)}
          onSaved={async () => {
            setQuestionsFor(null)
            await load()
          }}
          onError={setError}
        />
      ) : null}

      {editing === null && questionsFor === null ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Módulo</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium">Preguntas</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-medium">{m.title_es}</p>
                    <p className="text-xs text-muted-foreground">{m.slug}</p>
                  </td>
                  <td className="px-3 py-2">{m.category}</td>
                  <td className="px-3 py-2">{m.total_questions}</td>
                  <td className="px-3 py-2">
                    {m.is_active ? (
                      <span className="text-green-500">publicado</span>
                    ) : (
                      <span className="text-muted-foreground">borrador</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                        <Pencil /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setQuestionsFor(m)}>
                        <ListChecks /> Preguntas
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggle(m)}>
                        <Power /> {m.is_active ? "Despublicar" : "Publicar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => remove(m)}
                      >
                        <Trash2 /> Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
    />
  )
}

function ModuleForm({
  initial,
  onCancel,
  onSaved,
  onError,
}: {
  initial: ModuleFull | null
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (m: string) => void
}) {
  const [form, setForm] = useState<ModuleInput>(
    initial
      ? {
          slug: initial.slug,
          title_es: initial.title_es,
          title_en: initial.title_en,
          content_es: initial.content_es,
          content_en: initial.content_en,
          category: initial.category,
          order: initial.order,
        }
      : EMPTY
  )
  const [busy, setBusy] = useState(false)

  function set<K extends keyof ModuleInput>(k: K, v: ModuleInput[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (initial) await admin.modules.update(initial.slug, form)
      else await admin.modules.create(form)
      await onSaved()
    } catch (err) {
      onError(getApiErrorMessage(err, "No se pudo guardar el módulo"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 font-medium">
        <BookOpen className="size-4" />
        {initial ? `Editar: ${initial.title_es}` : "Nuevo módulo"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Slug (url)">
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="sqli-intro" />
        </Field>
        <Field label="Categoría">
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="SQLi" />
        </Field>
        <Field label="Título (ES)">
          <Input value={form.title_es} onChange={(e) => set("title_es", e.target.value)} />
        </Field>
        <Field label="Título (EN)">
          <Input value={form.title_en} onChange={(e) => set("title_en", e.target.value)} />
        </Field>
        <Field label="Orden">
          <Input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Contenido ES (markdown)">
        <Area rows={6} value={form.content_es} onChange={(e) => set("content_es", e.target.value)} />
      </Field>
      <Field label="Contenido EN (markdown)">
        <Area rows={6} value={form.content_en} onChange={(e) => set("content_en", e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando..." : initial ? "Guardar cambios" : "Crear módulo"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
      {!initial ? (
        <p className="text-xs text-muted-foreground">
          Tras crearlo, usa «Preguntas» en la lista para agregar sus preguntas, y
          «Publicar» cuando esté listo.
        </p>
      ) : null}
    </form>
  )
}

type QEdit = {
  question_es: string
  question_en: string
  type: "multiple_choice" | "fill_blank"
  answer: string
  options: { text_es: string; text_en: string; is_correct: boolean }[]
}

function emptyQuestion(): QEdit {
  return {
    question_es: "",
    question_en: "",
    type: "multiple_choice",
    answer: "",
    options: [
      { text_es: "", text_en: "", is_correct: true },
      { text_es: "", text_en: "", is_correct: false },
    ],
  }
}

function QuestionsEditor({
  module,
  onClose,
  onSaved,
  onError,
}: {
  module: AdminModuleListItem
  onClose: () => void
  onSaved: () => void | Promise<void>
  onError: (m: string) => void
}) {
  const [questions, setQuestions] = useState<QEdit[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    admin.modules
      .full(module.slug)
      .then((full) => {
        if (!active) return
        setQuestions(
          full.questions.map((q) => ({
            question_es: q.question_es,
            question_en: q.question_en,
            type: q.type,
            answer: q.answer ?? "",
            options:
              q.options && q.options.length
                ? q.options.map((o) => ({
                    text_es: o.text_es,
                    text_en: o.text_en,
                    is_correct: o.is_correct,
                  }))
                : [
                    { text_es: "", text_en: "", is_correct: true },
                    { text_es: "", text_en: "", is_correct: false },
                  ],
          }))
        )
      })
      .catch((e) => active && onError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [module.slug, onError])

  function patch(i: number, p: Partial<QEdit>) {
    setQuestions((qs) => qs!.map((q, idx) => (idx === i ? { ...q, ...p } : q)))
  }
  function patchOption(i: number, j: number, p: Partial<QEdit["options"][number]>) {
    setQuestions((qs) =>
      qs!.map((q, idx) =>
        idx === i
          ? { ...q, options: q.options.map((o, k) => (k === j ? { ...o, ...p } : o)) }
          : q
      )
    )
  }
  function setCorrect(i: number, j: number) {
    setQuestions((qs) =>
      qs!.map((q, idx) =>
        idx === i
          ? { ...q, options: q.options.map((o, k) => ({ ...o, is_correct: k === j })) }
          : q
      )
    )
  }

  async function save() {
    if (!questions) return
    setBusy(true)
    try {
      await admin.modules.setQuestions(
        module.slug,
        questions.map((q, i) => ({
          question_es: q.question_es,
          question_en: q.question_en,
          type: q.type,
          order: i + 1,
          answer: q.type === "fill_blank" ? q.answer : undefined,
          options: q.type === "multiple_choice" ? q.options : undefined,
        }))
      )
      await onSaved()
    } catch (e) {
      onError(getApiErrorMessage(e, "No se pudieron guardar las preguntas"))
    } finally {
      setBusy(false)
    }
  }

  if (!questions) {
    return <p className="text-sm text-muted-foreground">Cargando preguntas...</p>
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 font-medium">
        <ListChecks className="size-4" /> Preguntas de {module.title_es}
      </p>

      {questions.map((q, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pregunta {i + 1}</span>
            <div className="flex items-center gap-2">
              <select
                value={q.type}
                onChange={(e) => patch(i, { type: e.target.value as QEdit["type"] })}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="multiple_choice">opción múltiple</option>
                <option value="fill_blank">completar</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setQuestions((qs) => qs!.filter((_, idx) => idx !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={q.question_es}
              onChange={(e) => patch(i, { question_es: e.target.value })}
              placeholder="Pregunta (ES)"
            />
            <Input
              value={q.question_en}
              onChange={(e) => patch(i, { question_en: e.target.value })}
              placeholder="Pregunta (EN)"
            />
          </div>

          {q.type === "fill_blank" ? (
            <Input
              value={q.answer}
              onChange={(e) => patch(i, { answer: e.target.value })}
              placeholder="Respuesta esperada"
            />
          ) : (
            <div className="space-y-2">
              {q.options.map((o, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={o.is_correct}
                    onChange={() => setCorrect(i, j)}
                    title="Correcta"
                  />
                  <Input
                    value={o.text_es}
                    onChange={(e) => patchOption(i, j, { text_es: e.target.value })}
                    placeholder={`Opción ${j + 1} (ES)`}
                  />
                  <Input
                    value={o.text_en}
                    onChange={(e) => patchOption(i, j, { text_en: e.target.value })}
                    placeholder={`Opción ${j + 1} (EN)`}
                  />
                  {q.options.length > 2 ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        patch(i, { options: q.options.filter((_, k) => k !== j) })
                      }
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              ))}
              {q.options.length < 8 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patch(i, {
                      options: [...q.options, { text_es: "", text_en: "", is_correct: false }],
                    })
                  }
                >
                  <Plus /> Opción
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setQuestions((qs) => [...qs!, emptyQuestion()])}
        >
          <Plus /> Agregar pregunta
        </Button>
        <Button onClick={save} disabled={busy}>
          {busy ? "Guardando..." : "Guardar preguntas"}
        </Button>
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Opción múltiple: marca la correcta con el círculo (≥2 opciones).
        Completar: la respuesta se compara sin distinguir mayúsculas.
      </p>
    </div>
  )
}
