"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Play,
  Square,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getApiErrorMessage,
  labs,
  machines,
  type LabStatus,
  type Machine,
} from "@/lib/api"
import { DifficultyBadge } from "./difficulty-badge"

function formatTime(total: number | null): string {
  if (total == null) return "--:--"
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function LabDetail({ slug }: { slug: string }) {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [lab, setLab] = useState<LabStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flag, setFlag] = useState("")
  const [flagMsg, setFlagMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  )
  const [now, setNow] = useState(() => Date.now())

  function refresh() {
    return Promise.all([machines.get(slug), labs.status()])
      .then(([m, s]) => {
        setMachine(m)
        setLab(s)
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    Promise.all([machines.get(slug), labs.status()])
      .then(([m, s]) => {
        if (!active) return
        setMachine(m)
        setLab(s)
      })
      .catch((e) => active && setError(getApiErrorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  const isLive =
    !!lab && lab.status !== "none" && lab.machine_slug === machine?.slug
  const otherActive =
    !!lab && lab.status !== "none" && lab.machine_slug !== machine?.slug
  const expiresAt = isLive ? lab?.expires_at : null

  // Cuenta regresiva: `now` avanza cada segundo y secondsLeft se deriva de
  // expires_at (no se desincroniza y no hay setState en el cuerpo del efecto).
  const secondsLeft = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
    : null

  useEffect(() => {
    if (!expiresAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  // Sondea el estado mientras el lab está vivo.
  useEffect(() => {
    if (!isLive) return
    const t = setInterval(() => {
      labs.status().then(setLab).catch(() => undefined)
    }, 15000)
    return () => clearInterval(t)
  }, [isLive])

  async function handleStart() {
    if (!machine) return
    setBusy(true)
    setError(null)
    try {
      setLab(await labs.start(machine.id))
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo iniciar el laboratorio"))
    } finally {
      setBusy(false)
    }
  }

  async function handleStop() {
    setBusy(true)
    setError(null)
    try {
      await labs.stop()
      await refresh()
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleExtend() {
    setBusy(true)
    setError(null)
    try {
      setLab(await labs.extend())
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo extender el tiempo"))
    } finally {
      setBusy(false)
    }
  }

  async function handleFlag(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFlagMsg(null)
    try {
      const r = await labs.submitFlag(flag.trim())
      if (r.correct && r.already_owned) {
        setFlagMsg({ ok: true, text: `Flag ${r.type} ya conseguida.` })
      } else if (r.correct) {
        setFlagMsg({
          ok: true,
          text: `¡Correcto! Flag ${r.type} (+${r.points_awarded} pts)${
            r.machine_complete ? " — ¡máquina completada!" : ""
          }`,
        })
      } else {
        setFlagMsg({ ok: false, text: "Flag incorrecta." })
      }
      setFlag("")
      if (r.correct) await refresh()
    } catch (e) {
      setFlagMsg({ ok: false, text: getApiErrorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }
  if (!machine) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error ?? "Máquina no encontrada."}
      </p>
    )
  }

  const p = machine.progress

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info de la máquina */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{machine.name}</h2>
          <DifficultyBadge difficulty={machine.difficulty} />
          <span className="text-sm text-muted-foreground">
            {machine.points} pts
          </span>
          {p.is_complete ? (
            <CheckCircle2 className="size-5 text-green-500" />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{machine.description}</p>
        <div className="flex gap-4 text-sm">
          <Mark label="Flag user" done={p.user_flag_obtained} />
          <Mark label="Flag root" done={p.root_flag_obtained} />
        </div>
        {p.writeup_unlocked ? (
          <Link
            href={`/dashboard/labs/${machine.slug}/writeup`}
            className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
          >
            <BookOpen className="size-4" /> Ver writeup
          </Link>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* Estado del laboratorio */}
      {otherActive ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          Tienes otro laboratorio activo
          {lab?.machine_slug ? ` (${lab.machine_slug})` : ""}. Deténlo antes de
          iniciar este.
        </div>
      ) : isLive ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-muted-foreground">IP del laboratorio</p>
              <p className="font-mono font-medium">
                {lab?.lab_ip}
                {lab?.internal_port ? `:${lab.internal_port}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tiempo restante</p>
              <p className="flex items-center gap-1 font-mono font-medium">
                <Clock className="size-4" />
                {formatTime(secondsLeft)}
                {lab?.status === "expiring" ? (
                  <span className="text-xs text-yellow-500">(por expirar)</span>
                ) : null}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Conéctate por la VPN y accede a la máquina en{" "}
            <code className="font-mono">{lab?.lab_ip}</code>.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={handleStop} disabled={busy}>
              <Square /> Detener
            </Button>
            {lab?.status === "expiring" ? (
              <Button variant="outline" onClick={handleExtend} disabled={busy}>
                <Clock /> Extender +30 min
              </Button>
            ) : null}
          </div>

          {/* Envío de flags */}
          <form onSubmit={handleFlag} className="space-y-2 border-t border-border pt-4">
            <label htmlFor="flag" className="text-sm font-medium">
              Enviar flag
            </label>
            <div className="flex gap-2">
              <Input
                id="flag"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="DHCTF{...}"
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || flag.trim().length === 0}>
                <Flag /> Enviar
              </Button>
            </div>
            {flagMsg ? (
              <p
                role="alert"
                className={flagMsg.ok ? "text-sm text-green-500" : "text-sm text-destructive"}
              >
                {flagMsg.text}
              </p>
            ) : null}
          </form>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Inicia el laboratorio para desplegar la máquina. Tendrás 1 hora
            (extensible). Necesitas tu VPN activa para acceder.
          </p>
          <Button onClick={handleStart} disabled={busy}>
            <Play /> {busy ? "Iniciando..." : "Iniciar laboratorio"}
          </Button>
        </div>
      )}
    </div>
  )
}

function Mark({ label, done }: { label: string; done: boolean }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      {done ? (
        <CheckCircle2 className="size-4 text-green-500" />
      ) : (
        <Circle className="size-4" />
      )}
      {label}
    </span>
  )
}
