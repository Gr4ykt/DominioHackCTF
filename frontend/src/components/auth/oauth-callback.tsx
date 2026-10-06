"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { auth } from "@/lib/api"

function OAuthError() {
  return (
    <div className="space-y-4 text-center">
      <p role="alert" className="text-sm text-destructive">
        No se pudo iniciar sesión con Google.
      </p>
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        Volver a iniciar sesión
      </Link>
    </div>
  )
}

// El backend ya dejó la cookie de sesión: aquí solo se obtiene el access token.
export function OAuthCallback({ failed }: { failed: boolean }) {
  const router = useRouter()
  const [refreshFailed, setRefreshFailed] = useState(false)

  useEffect(() => {
    if (failed) return
    auth
      .refresh()
      .then(() => router.replace("/dashboard"))
      .catch(() => setRefreshFailed(true))
  }, [failed, router])

  if (failed || refreshFailed) return <OAuthError />

  return (
    <p className="text-center text-sm text-muted-foreground">
      Iniciando sesión...
    </p>
  )
}
