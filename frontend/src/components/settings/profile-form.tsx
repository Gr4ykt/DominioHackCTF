"use client"

import { useState } from "react"

import { useSession } from "@/components/dashboard/session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage, users, type User } from "@/lib/api"

export function ProfileForm() {
  const { user, refreshUser } = useSession()
  if (!user) return <p className="text-sm text-muted-foreground">Cargando...</p>
  return <ProfileFormInner key={user.id} user={user} refreshUser={refreshUser} />
}

function ProfileFormInner({
  user,
  refreshUser,
}: {
  user: User
  refreshUser: () => Promise<void>
}) {
  const [username, setUsername] = useState(user.username)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const dirty =
    username.trim() !== user.username ||
    avatarUrl.trim() !== (user.avatar_url ?? "")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      await users.updateProfile(user.id, {
        username: username.trim(),
        avatar_url: avatarUrl.trim(),
      })
      await refreshUser()
      setOk(true)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
          required
        />
        <p className="text-xs text-muted-foreground">
          Letras, números, guiones y guion bajo. 3 a 20 caracteres.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">URL de avatar (opcional)</Label>
        <Input
          id="avatar"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          maxLength={500}
        />
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-green-500">Perfil actualizado.</p> : null}

      <Button type="submit" disabled={saving || !dirty}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  )
}
