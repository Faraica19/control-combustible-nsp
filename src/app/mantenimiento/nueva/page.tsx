import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import NuevaSolicitudTrabajoForm from "./NuevaSolicitudTrabajoForm";

export default async function NuevaSolicitudTrabajoPage() {
  await requireRol("SOLICITANTE", "BODEGA", "ADMIN");

  const equipos = await db.equipo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      tipoMedidor: true,
      lecturaActual: true,
      requiereLectura: true,
      area: { select: { nombre: true } },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">
        Nueva solicitud de mantenimiento / reparación de llanta
      </h1>

      {equipos.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No hay equipos activos registrados. Contacta a un administrador.
        </p>
      ) : (
        <NuevaSolicitudTrabajoForm equipos={equipos} />
      )}
    </div>
  );
}
