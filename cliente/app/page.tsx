import Link from "next/link";
import { Database, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50">
          <Database className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Herramienta CASE
        </h1>
        <p className="max-w-lg text-lg text-zinc-500">
          Diseña diagramas de bases de datos y genera proyectos Spring Boot de forma
          colaborativa, con ayuda inteligente.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/registro">
            Crear cuenta
            <Hammer className="opacity-70" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>

      <p className="text-sm text-zinc-400">
        Proyecto de clase · Gestión de cuentas
      </p>
    </main>
  );
}