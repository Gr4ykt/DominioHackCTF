import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">

      <h1 className="font-mono text-7xl font-semibold text-primary">404</h1>

      <p className="font-mono text-sm text-muted-foreground">
        No se ha encontrado la ruta solicitada
      </p>

      <Link href="/" className={buttonVariants()}>
        Volver al dashboard
      </Link>
    </main>
  );
}