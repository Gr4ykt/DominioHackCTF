"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { adminNavItems, dashboardNavItems, type DashboardNavItem } from "./nav-items"
import { useSession } from "./session-provider"

// "/dashboard" solo se marca activo en la ruta exacta; el resto también en sus subrutas.
function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  item,
  pathname,
}: {
  item: DashboardNavItem
  pathname: string
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useSession()
  const isAdmin = user?.role === "admin" || user?.role === "superuser"

  return (
    <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:w-60 md:border-r md:border-b-0">
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-2 px-4 text-lg font-bold"
      >
        <Image src="/image.png" alt="Logo DominioHackCTF" width={32} height={32} />
        <span>
          DominioHack<span className="text-primary">CTF</span>
        </span>
      </Link>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-4">
        {dashboardNavItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isAdmin ? (
          <>
            <p className="mt-3 px-3 pb-1 text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase max-md:hidden">
              Administración
            </p>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  )
}
