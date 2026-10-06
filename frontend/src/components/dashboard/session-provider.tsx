"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { auth, type User } from "@/lib/api"

type Session = {
  user: User | null
  logout: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>")
  }
  return session
}

// Carga el usuario al entrar al dashboard. El access token vive en memoria,
// así que tras recargar la página `auth.me()` lo recupera solo desde la cookie
// (el cliente renueva ante el 401). Sin sesión válida se vuelve a /login.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let active = true
    auth
      .me()
      .then((me) => {
        if (active) setUser(me)
      })
      .catch(() => {
        if (active) router.replace("/login")
      })
    return () => {
      active = false
    }
  }, [router])

  async function logout() {
    try {
      await auth.logout()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <SessionContext.Provider value={{ user, logout }}>
      {children}
    </SessionContext.Provider>
  )
}
