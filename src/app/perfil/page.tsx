import { requireSession } from "@/lib/permisos";
import CambiarPasswordForm from "./CambiarPasswordForm";

const ETIQUETA_ROL: Record<string, string> = {
  SOLICITANTE: "Solicitante",
  BODEGA: "Bodega",
  ADMIN: "Administrador",
  CONSULTA: "Consulta",
};

export default async function PerfilPage() {
  const session = await requireSession();
  const { name, email, rol } = session.user;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">Mi perfil</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm">
        <p className="text-zinc-900">
          <span className="font-medium">{name}</span>
        </p>
        <p className="text-zinc-500">{email}</p>
        <p className="text-zinc-500">{ETIQUETA_ROL[rol] ?? rol}</p>
      </div>

      <h2 className="text-sm font-semibold text-zinc-900">Cambiar contraseña</h2>
      <CambiarPasswordForm />
    </div>
  );
}
