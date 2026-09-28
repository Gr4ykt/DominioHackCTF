import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
        <p className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
          <span className="text-success">●</span> Plataforma en español
        </p>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Aprende hacking ético.
          <br />
          <span className="text-primary">Practícalo de verdad.</span>
        </h1>

        <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg">
          Módulos teóricos progresivos y laboratorios vulnerables reales,
          desplegados bajo demanda. Sin videos de relleno, sin plataformas en
          inglés que no explican el porqué.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Regístrate gratis
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">$</span> whoami&gt;&gt;{" "}
          <span className="text-foreground"> futuro pentester</span>
        </p>
      </div>
    </section>
  );
}