import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permisos";
import EstadoBadge from "@/components/EstadoBadge";
import { formatFechaCorta } from "@/lib/fecha";

const ETIQUETA_TIPO: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION_LLANTA: "Reparación de llanta",
};

export default async function MantenimientoPage() {
  const session = await requireSession();
  const { rol, id: userId } = session.user;

  const where = rol === "SOLICITANTE" ? { solicitanteId: userId } : undefined;

  const solicitudes = await db.solicitudTrabajo.findMany({
    where,
    include: { equipo: true, solicitante: true, area: true },
    orderBy: { fechaSolicitud: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          Mantenimiento y reparación de llantas
        </h1>
        {rol !== "CONSULTA" && (
          <Link
            href="/mantenimiento/nueva"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Nueva solicitud
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Folio</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2">Solicitante</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono">#{s.id}</td>
                <td className="px-3 py-2">
                  {ETIQUETA_TIPO[s.tipo] ?? s.tipo}
                  {s.tipo === "REPARACION_LLANTA" && s.esPonchadura && " (ponchadura)"}
                </td>
                <td className="px-3 py-2">
                  {s.equipo.codigo} — {s.equipo.nombre}
                </td>
                <td className="px-3 py-2">{s.solicitante.nombre}</td>
                <td className="px-3 py-2">{s.area.nombre}</td>
                <td className="px-3 py-2">
                  {formatFechaCorta(s.fechaSolicitud)}
                </td>
                <td className="px-3 py-2">
                  <EstadoBadge estado={s.estado} />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/mantenimiento/${s.id}`}
                    className="text-zinc-600 underline hover:text-zinc-900"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-zinc-400">
                  No hay solicitudes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
