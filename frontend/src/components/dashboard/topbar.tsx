"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useSession } from "./session-provider"

export function DashboardTopbar() {
  const { user, logout } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-card px-4 md:px-6">
      {user ? (
        <span className="text-sm font-medium">{user.username}</span>
      ) : (
        <span className="h-4 w-24 animate-pulse rounded bg-muted" />
      )}
      <ModeToggle />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut />
      </Button>
    </header>
  )
}
