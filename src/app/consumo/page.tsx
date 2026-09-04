import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { getConsumoPorEquipo } from "@/lib/reportes";
import { formatFechaCorta } from "@/lib/fecha";

function paraInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ConsumoPage({
  searchParams,
}: {
  searchParams: Promise<{ equipoId?: string; desde?: string; hasta?: string }>;
}) {
  await requireRol("BODEGA", "ADMIN", "CONSULTA");
  const params = await searchParams;

  const hastaDefault = new Date();
  const desdeDefault = new Date(hastaDefault);
  desdeDefault.setDate(desdeDefault.getDate() - 30);

  const desde = params.desde ? new Date(params.desde) : desdeDefault;
  const hasta = params.hasta ? new Date(params.hasta) : hastaDefault;
  hasta.setHours(23, 59, 59, 999);
  const equipoId = params.equipoId || undefined;

  const [equipos, consumo] = await Promise.all([
    db.equipo.findMany({ orderBy: { codigo: "asc" } }),
    getConsumoPorEquipo(desde, hasta, equipoId),
  ]);

  const equipoSeleccionado = equipoId
    ? consumo.find((c) => c.equipoId === equipoId)
    : undefined;
  const totalGeneral = consumo.reduce((suma, c) => suma + c.totalLitros, 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">
        Consumo de combustible por equipo
      </h1>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="equipoId" className="text-xs font-medium text-zinc-700">
            Equipo
          </label>
          <select
            id="equipoId"
            name="equipoId"
            defaultValue={equipoId ?? ""}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {equipos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.codigo} — {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs font-medium text-zinc-700">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={paraInputDate(desde)}
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
            defaultValue={paraInputDate(hasta)}
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

      {!equipoSeleccionado && (
        <>
          <p className="text-sm text-zinc-500">
            Total consumido en el período: <strong>{totalGeneral.toFixed(2)} L</strong>
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Equipo</th>
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2">Combustible</th>
                  <th className="px-3 py-2">Veces despachado</th>
                  <th className="px-3 py-2">Total consumido</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {consumo.map((c) => (
                  <tr key={c.equipoId} className="border-t border-zinc-100">
                    <td className="px-3 py-2">
                      {c.codigo} — {c.nombre}
                    </td>
                    <td className="px-3 py-2">{c.areaNombre}</td>
                    <td className="px-3 py-2">{c.tipoCombustible}</td>
                    <td className="px-3 py-2">{c.veces}</td>
                    <td className="px-3 py-2 font-medium">
                      {c.totalLitros.toFixed(2)} L
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`/consumo?equipoId=${c.equipoId}&desde=${paraInputDate(desde)}&hasta=${paraInputDate(hasta)}`}
                        className="text-zinc-600 underline hover:text-zinc-900"
                      >
                        Ver detalle
                      </a>
                    </td>
                  </tr>
                ))}
                {consumo.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-zinc-400">
                      No hay despachos en el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {equipoSeleccionado && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Equipo</p>
              <p className="text-lg font-semibold text-zinc-900">
                {equipoSeleccionado.codigo} — {equipoSeleccionado.nombre}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Total consumido</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {equipoSeleccionado.totalLitros.toFixed(2)} L
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Veces despachado</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {equipoSeleccionado.veces}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Folio</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {equipoSeleccionado.detalle.map((d) => (
                  <tr key={d.folio} className="border-t border-zinc-100">
                    <td className="px-3 py-2 font-mono">#{d.folio}</td>
                    <td className="px-3 py-2">{formatFechaCorta(d.fecha)}</td>
                    <td className="px-3 py-2">{d.cantidad.toFixed(2)} L</td>
                    <td className="px-3 py-2">{d.solicitante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
