"use client"

import { useEffect, useState } from "react"
import { Download, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getApiErrorMessage, vpn, type VpnStatus } from "@/lib/api"

export function VpnPanel() {
  const [status, setStatus] = useState<VpnStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando estado de la VPN...</p>
  }

  const hasConfig = status?.has_config ?? false

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        {status?.connected ? (
          <ShieldCheck className="size-5 text-primary" />
        ) : (
          <ShieldOff className="size-5 text-muted-foreground" />
        )}
        <div className="text-sm">
          <p className="font-medium">
            {status?.connected ? "Conectado" : "Desconectado"}
          </p>
          <p className="text-muted-foreground">
            {hasConfig
              ? `Tu IP en la VPN: ${status?.assigned_ip}`
              : "Aún no has generado tu configuración."}
          </p>
        </div>
      </div>

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
    </div>
  )
}
