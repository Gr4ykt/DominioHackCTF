"use client"

import Link from "next/link"
import { Download, FlaskConical, Trophy } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { useSession } from "./session-provider"

const shortcuts = [
  { href: "/dashboard/labs", label: "Ver laboratorios", icon: FlaskConical },
  { href: "/dashboard/vpn", label: "Descargar VPN", icon: Download },
  { href: "/dashboard/leaderboard", label: "Ranking", icon: Trophy },
]

export function DashboardHome() {
  const { user } = useSession()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Bienvenido de vuelta,</p>
        <p className="text-2xl font-semibold">{user?.username ?? "…"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Puntos acumulados:{" "}
          <span className="font-mono font-medium text-foreground">
            {user?.total_points ?? 0}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={buttonVariants({ variant: "outline" })}>
            <Icon />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
