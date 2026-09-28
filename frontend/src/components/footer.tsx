import Link from "next/link";

const columns = [
  {
    title: "Explorar",
    links: [
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Módulos", href: "/#modulos" },
      { label: "Labs", href: "/#labs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/legal/terms" },
      { label: "Privacidad", href: "/legal/privacy" },
    ],
  },
  {
    title: "Proyecto",
    links: [
      { label: "Acerca de", href: "/about" },
      { label: "GitHub", href: "https://github.com/Gr4ykt/DominioHackCTF" }, // reemplazar o quitar
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="font-mono text-lg font-semibold">
            <span className="text-primary">$</span> DominioHackCTF
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Plataforma de hacking ético en español: aprende con módulos
            teóricos y practica en laboratorios reales.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <h2 className="font-mono text-sm font-medium">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} DominioHackCTF</p>
          <p className="font-mono">Proyecto de título — INACAP</p>
        </div>
      </div>
    </footer>
  );
}