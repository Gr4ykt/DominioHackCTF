import {
  BookOpen,
  ChartNoAxesColumn,
  FlaskConical,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
  Server,
  Users,
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

export const adminNavItems: DashboardNavItem[] = [
  { label: "Usuarios", href: "/dashboard/admin/users", icon: Users },
  { label: "Máquinas", href: "/dashboard/admin/machines", icon: Server },
  { label: "Módulos", href: "/dashboard/admin/modules", icon: BookOpen },
]
