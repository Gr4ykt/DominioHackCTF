import { cn } from "cn"
import type { Difficulty } from "@/lib/api"

const STYLES: Record<Difficulty, string> = {
  easy: "bg-green-500/15 text-green-500",
  medium: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/15 text-red-500",
}
const LABELS: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[difficulty]
      )}
    >
      {LABELS[difficulty]}
    </span>
  )
}
