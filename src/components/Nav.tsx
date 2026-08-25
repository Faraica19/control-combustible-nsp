import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const ETIQUETA_ROL: Record<string, string> = {
  SOLICITANTE: "Solicitante",
  BODEGA: "Bodega",
  ADMIN: "Administrador",
  CONSULTA: "Consulta",
};

export default async function Nav() {
  const session = await auth();
  if (!session?.user) return null;

  const { rol, name } = session.user;

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Inicio" },
    { href: "/solicitudes", label: "Solicitudes" },
  ];

  if (rol === "BODEGA" || rol === "ADMIN" || rol === "CONSULTA") {
    links.push({ href: "/inventario", label: "Inventario" });
  }
  if (rol === "BODEGA" || rol === "ADMIN") {
    links.push({ href: "/equipos", label: "Equipos" });
  }
  if (rol === "ADMIN") {
    links.push({ href: "/usuarios", label: "Usuarios" });
    links.push({ href: "/reportes", label: "Reportes" });
  }
  links.push({ href: "/perfil", label: "Mi perfil" });

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nsp.png" alt="NSP" className="h-7 w-auto" />
            <span className="font-semibold text-zinc-900">Control de Combustible</span>
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {name} · {ETIQUETA_ROL[rol] ?? rol}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-sm text-zinc-600 hover:text-zinc-900">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
