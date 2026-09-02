import { requireRol } from "@/lib/permisos";
import { getRendimientoActualPorEquipo } from "@/lib/reportes";

export default async function ReportesPage() {
  await requireRol("ADMIN");

  const filas = await getRendimientoActualPorEquipo();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          Rendimiento de combustible por equipo
        </h1>
        <a
          href="/api/export/reportes"
          className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exportar a Excel
        </a>
      </div>

      <p className="text-sm text-zinc-500">
        El rendimiento se calcula entre los dos rellenos más recientes de cada
        equipo. El Excel incluye el historial completo y el promedio global
        desde el primer relleno.
      </p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Lectura anterior</th>
              <th className="px-3 py-2">Lectura actual</th>
              <th className="px-3 py-2">Distancia/uso</th>
              <th className="px-3 py-2">Combustible</th>
              <th className="px-3 py-2">Rendimiento actual</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.equipoId} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {f.codigo} — {f.nombre}
                </td>
                <td className="px-3 py-2">{f.areaNombre}</td>
                <td className="px-3 py-2">{f.lecturaAnterior}</td>
                <td className="px-3 py-2">{f.lecturaActual}</td>
                <td className="px-3 py-2">
                  {f.distancia.toFixed(2)}{" "}
                  {f.tipoMedidor === "ODOMETRO" ? "km" : "h"}
                </td>
                <td className="px-3 py-2">{f.combustible.toFixed(2)} L</td>
                <td className="px-3 py-2 font-medium">
                  {f.rendimiento.toFixed(2)}{" "}
                  {f.tipoMedidor === "ODOMETRO" ? "km/L" : "h/L"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-400">
                  Aún no hay al menos dos rellenos registrados para ningún
                  equipo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
