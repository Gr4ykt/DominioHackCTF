import { SessionProvider } from "@/components/dashboard/session-provider"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"

// Sin cookie de sesión, `src/proxy.ts` redirige antes de llegar aquí;
// SessionProvider valida la sesión contra la API y carga el usuario.
export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-1 flex-col bg-background font-sans md:flex-row">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
