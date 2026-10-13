"use client"

import { useEffect, useState } from "react"
import { Flag, Pencil, Plus, Power, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  admin,
  getApiErrorMessage,
  type AdminMachine,
  type Difficulty,
  type MachineInput,
} from "@/lib/api"
import { DifficultyBadge } from "@/components/labs/difficulty-badge"

const EMPTY: MachineInput = {
  name: "",
  slug: "",
  description: "",
  difficulty: "easy",
  points: 30,
  docker_image: "",
  docker_internal_port: 80,
  category: "web",
}

export function MachinesAdmin() {
  const [machines, setMachines] = useState<AdminMachine[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminMachine | "new" | null>(null)
  const [flagsFor, setFlagsFor] = useState<AdminMachine | null>(null)

  function load() {
    return admin.machines
      .catalog()
      .then(setMachines)
      .catch((e) => setError(getApiErrorMessage(e)))
  }

  useEffect(() => {
    let active = true
    admin.machines
      .catalog()
      .then((m) => active && setMachines(m))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  async function toggle(m: AdminMachine) {
    setError(null)
    try {
      await admin.machines.toggle(m.slug)
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  async function remove(m: AdminMachine) {
    if (!confirm(`¿Eliminar la máquina "${m.name}"? Esta acción no se puede deshacer.`))
      return
    setError(null)
    try {
      await admin.machines.remove(m.slug)
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  if (error && !machines) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>
  }
  if (!machines) {
    return <p className="text-sm text-muted-foreground">Cargando máquinas...</p>
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : null}

      {editing === null ? (
        <Button onClick={() => setEditing("new")}>
          <Plus /> Nueva máquina
        </Button>
      ) : (
        <MachineForm
          machine={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
          onError={setError}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Máquina</th>
              <th className="px-3 py-2 font-medium">Imagen</th>
              <th className="px-3 py-2 font-medium">Dif.</th>
              <th className="px-3 py-2 font-medium">Pts</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.slug}</p>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {m.docker_image}:{m.docker_internal_port}
                </td>
                <td className="px-3 py-2">
                  <DifficultyBadge difficulty={m.difficulty} />
                </td>
                <td className="px-3 py-2">{m.points}</td>
                <td className="px-3 py-2">
                  {m.is_active ? (
                    <span className="text-green-500">activa</span>
                  ) : (
                    <span className="text-muted-foreground">inactiva</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>
                      <Pencil /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setFlagsFor(m)}>
                      <Flag /> Flags
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggle(m)}>
                      <Power /> {m.is_active ? "Desactivar" : "Activar"}
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

      {flagsFor ? (
        <FlagsForm
          machine={flagsFor}
          onClose={() => setFlagsFor(null)}
          onError={setError}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        Nota: la imagen Docker (<code className="font-mono">docker_image</code>)
        debe existir ya construida en el servidor. Registrar aquí la máquina no
        construye la imagen.
      </p>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function MachineForm({
  machine,
  onCancel,
  onSaved,
  onError,
}: {
  machine: AdminMachine | null
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (m: string) => void
}) {
  const [form, setForm] = useState<MachineInput>(
    machine
      ? {
          name: machine.name,
          slug: machine.slug,
          description: machine.description,
          difficulty: machine.difficulty,
          points: machine.points,
          docker_image: machine.docker_image,
          docker_internal_port: machine.docker_internal_port,
          category: machine.category,
          os: machine.os,
          writeup_es: machine.writeup_es ?? "",
          writeup_en: machine.writeup_en ?? "",
        }
      : EMPTY
  )
  const [busy, setBusy] = useState(false)

  function set<K extends keyof MachineInput>(key: K, value: MachineInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (machine) {
        await admin.machines.update(machine.slug, form)
      } else {
        await admin.machines.create(form)
      }
      await onSaved()
    } catch (err) {
      onError(getApiErrorMessage(err, "No se pudo guardar la máquina"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <p className="font-medium">
        {machine ? `Editar: ${machine.name}` : "Nueva máquina"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Slug (url)">
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Imagen Docker">
          <Input
            value={form.docker_image}
            onChange={(e) => set("docker_image", e.target.value)}
            placeholder="vulneraweb:latest"
          />
        </Field>
        <Field label="Puerto interno">
          <Input
            type="number"
            value={form.docker_internal_port}
            onChange={(e) => set("docker_internal_port", Number(e.target.value))}
          />
        </Field>
        <Field label="Categoría">
          <Input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </Field>
        <Field label="Puntos">
          <Input
            type="number"
            value={form.points}
            onChange={(e) => set("points", Number(e.target.value))}
          />
        </Field>
        <Field label="Dificultad">
          <select
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value as Difficulty)}
            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </Field>
      </div>
      <Field label="Descripción">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando..." : machine ? "Guardar cambios" : "Crear máquina"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function FlagsForm({
  machine,
  onClose,
  onError,
}: {
  machine: AdminMachine
  onClose: () => void
  onError: (m: string) => void
}) {
  const [userValue, setUserValue] = useState("")
  const [userPoints, setUserPoints] = useState(10)
  const [rootValue, setRootValue] = useState("")
  const [rootPoints, setRootPoints] = useState(20)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    admin.flags
      .get(machine.id)
      .then((flags) => {
        if (!active) return
        const u = flags.find((f) => f.type === "user")
        const r = flags.find((f) => f.type === "root")
        if (u) setUserPoints(u.points)
        if (r) setRootPoints(r.points)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [machine.id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await admin.flags.set(machine.id, [
        { type: "user", value: userValue.trim(), points: userPoints },
        { type: "root", value: rootValue.trim(), points: rootPoints },
      ])
      setMsg("Flags actualizadas.")
      setUserValue("")
      setRootValue("")
    } catch (err) {
      onError(getApiErrorMessage(err, "No se pudieron guardar las flags"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <p className="font-medium">Flags de {machine.name}</p>
      <p className="text-xs text-muted-foreground">
        Escribe el valor en texto plano; se guarda solo su hash. Debe coincidir
        con la flag dentro de la imagen de la máquina.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Flag user (valor)">
          <Input
            value={userValue}
            onChange={(e) => setUserValue(e.target.value)}
            placeholder="DHCTF{...}"
          />
        </Field>
        <Field label="Puntos user">
          <Input
            type="number"
            value={userPoints}
            onChange={(e) => setUserPoints(Number(e.target.value))}
          />
        </Field>
        <Field label="Flag root (valor)">
          <Input
            value={rootValue}
            onChange={(e) => setRootValue(e.target.value)}
            placeholder="DHCTF{...}"
          />
        </Field>
        <Field label="Puntos root">
          <Input
            type="number"
            value={rootPoints}
            onChange={(e) => setRootPoints(Number(e.target.value))}
          />
        </Field>
      </div>
      {msg ? <p className="text-sm text-green-500">{msg}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando..." : "Guardar flags"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </form>
  )
}
