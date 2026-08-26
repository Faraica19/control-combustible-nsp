import { requireRol } from "@/lib/permisos";
import { getEficienciaPorEquipo } from "@/lib/reportes";

function formatoFecha(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requireRol("ADMIN");
  const params = await searchParams;

  const hastaDefault = new Date();
  const desdeDefault = new Date(hastaDefault);
  desdeDefault.setDate(desdeDefault.getDate() - 7);

  const desde = params.desde ? new Date(params.desde) : desdeDefault;
  const hasta = params.hasta ? new Date(params.hasta) : hastaDefault;
  hasta.setHours(23, 59, 59, 999);

  const filas = await getEficienciaPorEquipo(desde, hasta);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          Eficiencia de combustible por equipo
        </h1>
        <a
          href={`/api/export/reportes?desde=${formatoFecha(desde)}&hasta=${formatoFecha(hasta)}`}
          className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exportar a Excel
        </a>
      </div>

      <form className="flex items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs font-medium text-zinc-700">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={formatoFecha(desde)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className="text-xs font-medium text-zinc-700">
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={formatoFecha(hasta)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Veces despachado</th>
              <th className="px-3 py-2">Cantidad total</th>
              <th className="px-3 py-2">Uso registrado</th>
              <th className="px-3 py-2">Eficiencia</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.equipoId} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {f.codigo} — {f.nombre}
                </td>
                <td className="px-3 py-2">{f.areaNombre}</td>
                <td className="px-3 py-2">{f.veces}</td>
                <td className="px-3 py-2">{f.cantidadTotal.toFixed(2)} L</td>
                <td className="px-3 py-2">
                  {f.deltaLectura != null
                    ? `${f.deltaLectura.toFixed(2)} ${
                        f.tipoMedidor === "ODOMETRO" ? "km/mi" : "horas"
                      }`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  {f.eficiencia != null
                    ? `${f.eficiencia.toFixed(3)} L/unidad`
                    : "N/D"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-400">
                  No hay despachos en el período seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
