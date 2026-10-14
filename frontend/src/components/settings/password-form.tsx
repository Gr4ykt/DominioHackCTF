"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, getApiErrorMessage } from "@/lib/api"

export function PasswordForm() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)
    if (next !== confirm) {
      setError("La nueva contraseña y su confirmación no coinciden.")
      return
    }
    setSaving(true)
    try {
      await auth.changePassword({ current_password: current, new_password: next })
      setOk(true)
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Contraseña actual</Label>
        <Input
          id="current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="next">Nueva contraseña</Label>
        <Input
          id="next"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una mayúscula y un número.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {ok ? (
        <p className="text-sm text-green-500">
          Contraseña actualizada. Las demás sesiones se cerraron.
        </p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  )
}
