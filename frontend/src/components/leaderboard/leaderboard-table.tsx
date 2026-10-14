"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"

import { useSession } from "@/components/dashboard/session-provider"
import { getApiErrorMessage, users, type LeaderboardItem } from "@/lib/api"
import { cn } from "cn"

export function LeaderboardTable() {
  const { user } = useSession()
  const [items, setItems] = useState<LeaderboardItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    users
      .leaderboard(1, 50)
      .then((r) => active && setItems(r.items))
      .catch((e) => active && setError(getApiErrorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (!items) return <p className="text-sm text-muted-foreground">Cargando ranking...</p>
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay puntajes.</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="w-16 px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Usuario</th>
            <th className="w-28 px-4 py-2 text-right font-medium">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const isMe = user?.id === it.id
            return (
              <tr
                key={it.id}
                className={cn(
                  "border-t border-border",
                  isMe && "bg-primary/10 font-medium"
                )}
              >
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1">
                    {it.rank <= 3 ? (
                      <Trophy
                        className={cn(
                          "size-4",
                          it.rank === 1 && "text-yellow-500",
                          it.rank === 2 && "text-zinc-400",
                          it.rank === 3 && "text-amber-700"
                        )}
                      />
                    ) : null}
                    {it.rank}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {it.username}
                  {isMe ? <span className="text-muted-foreground"> (tú)</span> : null}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{it.total_points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
