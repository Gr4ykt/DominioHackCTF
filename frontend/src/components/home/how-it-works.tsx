import { BookOpen, Terminal, Flag } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "Aprende un módulo",
    description:
      "Elige una categoría de vulnerabilidad (SQLi, XSS, LFI...) y avanza por contenido teórico progresivo, validando tu comprensión con preguntas antes de pasar al siguiente nivel.",
  },
  {
    number: "02",
    icon: Terminal,
    title: "Activa un laboratorio",
    description:
      "Despliega una máquina vulnerable bajo demanda. Se te asigna una configuración VPN personal para conectarte a tu propio entorno aislado, sin interferir con otros usuarios.",
  },
  {
    number: "03",
    icon: Flag,
    title: "Captura la flag",
    description:
      "Aplica lo aprendido para comprometer la máquina y encontrar la user flag y la root flag. Al resolverla, desbloqueas el writeup oficial y sumas puntos a tu progreso.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-b border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-14 text-center">
          <p className="font-mono text-sm text-primary">$ cat como-funciona.md</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            Tres pasos entre la teoría y el primer shell.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative rounded-lg border border-border bg-card p-6">
              <span className="font-mono text-sm text-muted-foreground">
                {number}
              </span>

              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}