"use client"

import { useEffect, useState } from "react"
import { Download, RefreshCw, RotateCw, ShieldCheck, ShieldOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getApiErrorMessage, vpn, type VpnStatus } from "@/lib/api"

export function VpnPanel() {
  const [status, setStatus] = useState<VpnStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadStatus() {
    return vpn
      .status()
      .then(setStatus)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    vpn
      .status()
      .then((s) => {
        if (active) setStatus(s)
      })
      .catch((e) => {
        if (active) setError(getApiErrorMessage(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Descarga (primera vez) o regeneración: ambas entregan un .conf con llaves
  // nuevas e invalidan el anterior.
  async function handleDownload(regenerate: boolean) {
    setBusy(true)
    setError(null)
    try {
      await (regenerate ? vpn.regenerate() : vpn.download())
      await loadStatus()
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo generar la configuración"))
    } finally {
      setBusy(false)
    }
  }

  async function handleRecheck() {
    setChecking(true)
    setError(null)
    await loadStatus()
    setChecking(false)
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando estado de la VPN...</p>
    )
  }

  const hasConfig = status?.has_config ?? false

  return (
    <div className="max-w-2xl space-y-6">
      {/* Estado de conexión */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        {status?.connected ? (
          <ShieldCheck className="size-5 text-primary" />
        ) : (
          <ShieldOff className="size-5 text-muted-foreground" />
        )}
        <div className="flex-1 text-sm">
          <p className="font-medium">
            {status?.connected ? "Conectado" : "Desconectado"}
          </p>
          <p className="text-muted-foreground">
            {hasConfig
              ? `Tu IP en la VPN: ${status?.assigned_ip}`
              : "Aún no has generado tu configuración."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRecheck}
          disabled={checking}
        >
          <RotateCw />
          Comprobar
        </Button>
      </div>

      {/* Descarga */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Descarga tu archivo <code className="font-mono">.conf</code> e
          impórtalo en tu cliente WireGuard. Al generar uno nuevo, el anterior
          deja de funcionar.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleDownload(false)} disabled={busy}>
            <Download />
            {hasConfig ? "Descargar de nuevo" : "Descargar configuración"}
          </Button>
          {hasConfig ? (
            <Button
              variant="outline"
              onClick={() => handleDownload(true)}
              disabled={busy}
            >
              <RefreshCw />
              Regenerar llaves
            </Button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      {/* Tutorial de conexión */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Cómo conectarte en 3 pasos</h2>

        <Step
          n={1}
          title="Descargar la configuración"
          body={
            <>
              Pulsa <strong>Descargar configuración</strong> (arriba). Se
              guardará el archivo{" "}
              <code className="font-mono">dominiohackctf.conf</code>. Necesitas
              tener instalado un cliente de{" "}
              <a
                href="https://www.wireguard.com/install/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                WireGuard
              </a>
              .
            </>
          }
        />

        <Step
          n={2}
          title="Iniciar la VPN"
          body={
            <>
              <p className="mb-2">
                <strong>Linux / macOS</strong> — en una terminal, desde la
                carpeta donde se descargó el archivo:
              </p>
              <Code>sudo wg-quick up ./dominiohackctf.conf</Code>
              <p className="mt-2">
                <strong>Windows / Android / iOS</strong> — abre la app
                WireGuard, elige <em>Importar túnel desde archivo</em>,
                selecciona <code className="font-mono">dominiohackctf.conf</code>{" "}
                y activa el túnel.
              </p>
            </>
          }
        />

        <Step
          n={3}
          title="Comprobar que estás conectado"
          body={
            <>
              <p className="mb-2">
                Vuelve a esta página y pulsa <strong>Comprobar</strong>: el
                estado de arriba debe pasar a <strong>Conectado</strong>.
              </p>
              <p className="mb-2">
                También puedes verificarlo en la terminal (debe mostrar un{" "}
                <em>latest handshake</em> reciente):
              </p>
              <Code>sudo wg show</Code>
              <p className="mt-2 text-muted-foreground">
                Una vez conectado e iniciado un laboratorio, podrás acceder a la
                máquina por su IP a través del túnel.
              </p>
            </>
          }
        />
      </div>

      {/* Desactivar */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="mb-1 font-medium">Al terminar los retos</p>
        <p className="mb-2 text-muted-foreground">
          Desactiva la VPN para cerrar el túnel:
        </p>
        <Code>sudo wg-quick down ./dominiohackctf.conf</Code>
        <p className="mt-2 text-muted-foreground">
          En Windows / Android / iOS, desactiva el túnel desde la app de
          WireGuard. No olvides también <strong>detener tu laboratorio</strong>{" "}
          desde su página cuando termines.
        </p>
      </div>
    </div>
  )
}

function Step({
  n,
  title,
  body,
}: {
  n: number
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
        {n}
      </span>
      <div className="space-y-1 text-sm">
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
      <code>{children}</code>
    </pre>
  )
}
