import {
  BookOpen,
  ChartNoAxesColumn,
  FlaskConical,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react"

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Módulos", href: "/dashboard/modules", icon: BookOpen },
  { label: "Laboratorios", href: "/dashboard/labs", icon: FlaskConical },
  { label: "VPN", href: "/dashboard/vpn", icon: ShieldCheck },
  { label: "Progreso", href: "/dashboard/progress", icon: ChartNoAxesColumn },
  { label: "Ranking", href: "/dashboard/leaderboard", icon: Trophy },
  { label: "Ajustes", href: "/dashboard/settings", icon: Settings },
]
