import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const difficultyStyles = {
  Easy: "border-success/30 bg-success/10 text-success",
  Medium: "border-primary/30 bg-primary/10 text-primary",
} as const

const labs = [
  {
    slug: "vulnera-web",
    name: "VulneraWeb",
    difficulty: "Easy" as const,
    tags: ["SQLi", "Broken Auth"],
    description:
      "Una aplicación de gestión con un login vulnerable a inyección SQL. Ideal para dar el primer paso.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
  },
  {
    slug: "fileleak",
    name: "FileLeak",
    difficulty: "Easy" as const,
    tags: ["LFI", "Path Traversal"],
    description:
      "Un servidor de archivos mal configurado expone rutas sensibles con validación insuficiente.",
    image: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80",
  },
  {
    slug: "shadowadmin",
    name: "ShadowAdmin",
    difficulty: "Medium" as const,
    tags: ["Priv Esc", "Misconfig"],
    description:
      "Compromete el panel inicial y escala privilegios explotando un binario mal permisado.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  },
]

export function LabsPreview() {
  return (
    <section id="labs" className="border-b border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-14">
          <p className="font-mono text-sm text-primary">$ nmap -sV labs.local</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Laboratorios
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground sm:text-lg">
            Máquinas vulnerables desplegadas bajo demanda, con dificultad
            progresiva. Estas son algunas de ejemplo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {labs.map((lab) => (
            <div
              key={lab.slug}
              className="group overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={lab.image}
                  alt={lab.name}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full border px-2.5 py-1 font-mono text-xs",
                    difficultyStyles[lab.difficulty]
                  )}
                >
                  {lab.difficulty}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-mono font-semibold">{lab.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lab.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lab.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Ver todos los laboratorios
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Cada laboratorio tiene tiempo de expiración automática
          </p>
        </div>
      </div>
    </section>
  )
}