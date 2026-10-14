import { PageHeader } from "@/components/dashboard/page-header"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader title="Ranking" description="Clasificación global por puntos." />
      <LeaderboardTable />
    </>
  )
}
