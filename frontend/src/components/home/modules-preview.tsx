import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const modules = [
  {
    slug: "sqli",
    title: "SQL Injection",
    description:
      "Explota fallos de validación en consultas SQL para extraer o manipular datos de una base de datos.",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80",
  },
  {
    slug: "xss",
    title: "Cross-Site Scripting",
    description:
      "Inyecta scripts en páginas confiables para comprometer sesiones y datos de otros usuarios.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
  },
  {
    slug: "lfi",
    title: "Local File Inclusion",
    description:
      "Accede a archivos sensibles del servidor abusando de rutas mal validadas en la aplicación.",
    image: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&q=80",
  },
  {
    slug: "privesc",
    title: "Privilege Escalation",
    description:
      "Encuentra configuraciones débiles o binarios mal permisados para escalar de usuario a root.",
    image: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=800&q=80",
  },
]

export function ModulesPreview() {
  return (
    <section id="modulos" className="border-b border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-primary">$ ls /modulos</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Módulos de aprendizaje
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground sm:text-lg">
              Categorías de vulnerabilidad con teoría progresiva y preguntas
              de validación. Esta es solo una muestra.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => (
            <div
              key={mod.slug}
              className="group overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={mod.image}
                  alt={mod.title}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{mod.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mod.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Ver todos los módulos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}