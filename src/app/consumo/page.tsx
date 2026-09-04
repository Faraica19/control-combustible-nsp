import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { getConsumoPorEquipo } from "@/lib/reportes";
import { getCostoPromedio } from "@/lib/inventario";
import { formatFechaCorta } from "@/lib/fecha";

function paraInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function limitesDelMes(mesParam: string) {
  const [anioStr, mesStr] = mesParam.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const desde = new Date(`${anioStr}-${mesStr}-01T00:00:00-06:00`);
  const hasta = new Date(
    `${anioStr}-${mesStr}-${String(ultimoDia).padStart(2, "0")}T23:59:59-06:00`,
  );
  return { desde, hasta };
}

export default async function ConsumoPage({
  searchParams,
}: {
  searchParams: Promise<{ equipoId?: string; mes?: string; desde?: string; hasta?: string }>;
}) {
  await requireRol("BODEGA", "ADMIN", "CONSULTA");
  const params = await searchParams;

  const hastaDefault = new Date();
  const desdeDefault = new Date(hastaDefault);
  desdeDefault.setDate(desdeDefault.getDate() - 30);

  let desde: Date;
  let hasta: Date;
  if (params.mes) {
    ({ desde, hasta } = limitesDelMes(params.mes));
  } else {
    desde = params.desde ? new Date(params.desde) : desdeDefault;
    hasta = params.hasta ? new Date(params.hasta) : hastaDefault;
    hasta.setHours(23, 59, 59, 999);
  }
  const equipoId = params.equipoId || undefined;

  const [equipos, consumo, costoPromedio] = await Promise.all([
    db.equipo.findMany({ orderBy: { codigo: "asc" } }),
    getConsumoPorEquipo(desde, hasta, equipoId),
    getCostoPromedio(),
  ]);

  const equipoSeleccionado = equipoId
    ? consumo.find((c) => c.equipoId === equipoId)
    : undefined;
  const totalGeneral = consumo.reduce((suma, c) => suma + c.totalLitros, 0);

  function costoDe(litros: number, tipoCombustible: "DIESEL" | "GASOLINA") {
    const { cordobas, usd } = costoPromedio[tipoCombustible];
    return {
      cordobas: cordobas != null ? litros * cordobas : null,
      usd: usd != null ? litros * usd : null,
    };
  }

  const costoGeneral = consumo.reduce(
    (suma, c) => {
      const costo = costoDe(c.totalLitros, c.tipoCombustible as "DIESEL" | "GASOLINA");
      return {
        cordobas: suma.cordobas + (costo.cordobas ?? 0),
        usd: suma.usd + (costo.usd ?? 0),
      };
    },
    { cordobas: 0, usd: 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">
        Consumo de combustible por equipo
      </h1>

      <form className="flex flex-wrap items-end gap-6 rounded-lg border border-zinc-200 bg-white p-5">
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
          <label htmlFor="mes" className="text-xs font-medium text-zinc-700">
            Mes
          </label>
          <input
            id="mes"
            name="mes"
            type="month"
            defaultValue={params.mes ?? ""}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-end gap-3 border-l border-zinc-200 pl-6">
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
        </div>
        <button
          type="submit"
          className="ml-auto rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Filtrar
        </button>
      </form>
      <p className="-mt-2 text-xs text-zinc-500">
        Si eliges un mes, se usa ese mes completo y se ignoran los campos Desde/Hasta.
      </p>

      {!equipoSeleccionado && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Total consumido en el período</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {totalGeneral.toFixed(2)} L
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Costo estimado (C$)</p>
              <p className="text-2xl font-semibold text-zinc-900">
                C${costoGeneral.cordobas.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-xs text-zinc-500">Costo estimado (US$)</p>
              <p className="text-2xl font-semibold text-zinc-900">
                US${costoGeneral.usd.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Equipo</th>
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2">Combustible</th>
                  <th className="px-3 py-2">Veces despachado</th>
                  <th className="px-3 py-2">Total consumido</th>
                  <th className="px-3 py-2">Costo (C$)</th>
                  <th className="px-3 py-2">Costo (US$)</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {consumo.map((c) => {
                  const costo = costoDe(
                    c.totalLitros,
                    c.tipoCombustible as "DIESEL" | "GASOLINA",
                  );
                  return (
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
                        {costo.cordobas != null ? `C$${costo.cordobas.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {costo.usd != null ? `US$${costo.usd.toFixed(2)}` : "—"}
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
                  );
                })}
                {consumo.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-zinc-400">
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
          {(() => {
            const costoTotal = costoDe(
              equipoSeleccionado.totalLitros,
              equipoSeleccionado.tipoCombustible as "DIESEL" | "GASOLINA",
            );
            return (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
                <div className="rounded-lg border border-zinc-200 bg-white p-6">
                  <p className="text-xs text-zinc-500">Costo estimado (C$)</p>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {costoTotal.cordobas != null
                      ? `C$${costoTotal.cordobas.toFixed(2)}`
                      : "N/D"}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-6">
                  <p className="text-xs text-zinc-500">Costo estimado (US$)</p>
                  <p className="text-2xl font-semibold text-zinc-900">
                    {costoTotal.usd != null ? `US$${costoTotal.usd.toFixed(2)}` : "N/D"}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Folio</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Costo (C$)</th>
                  <th className="px-3 py-2">Costo (US$)</th>
                  <th className="px-3 py-2">Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {equipoSeleccionado.detalle.map((d) => {
                  const costo = costoDe(
                    d.cantidad,
                    equipoSeleccionado.tipoCombustible as "DIESEL" | "GASOLINA",
                  );
                  return (
                    <tr key={d.folio} className="border-t border-zinc-100">
                      <td className="px-3 py-2 font-mono">#{d.folio}</td>
                      <td className="px-3 py-2">{formatFechaCorta(d.fecha)}</td>
                      <td className="px-3 py-2">{d.cantidad.toFixed(2)} L</td>
                      <td className="px-3 py-2">
                        {costo.cordobas != null ? `C$${costo.cordobas.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {costo.usd != null ? `US$${costo.usd.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2">{d.solicitante}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
