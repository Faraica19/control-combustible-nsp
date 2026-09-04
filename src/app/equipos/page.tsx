import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { crearEquipo, toggleActivoEquipo } from "./actions";
import { formatFechaCorta } from "@/lib/fecha";

export default async function EquiposPage() {
  await requireRol("ADMIN", "BODEGA");

  const [equipos, areas] = await Promise.all([
    db.equipo.findMany({
      include: {
        area: true,
        solicitudes: {
          where: { estado: "DESPACHADA" },
          orderBy: { fechaDespacho: "desc" },
          include: { solicitante: true },
        },
      },
      orderBy: { codigo: "asc" },
    }),
    db.area.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Equipos rodantes</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Medidor</th>
              <th className="px-3 py-2">Combustible</th>
              <th className="px-3 py-2">Lectura actual</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {equipos.map((e) => (
              <tr key={e.id} className="border-t border-zinc-100 align-top">
                <td className="px-3 py-2 font-mono">{e.codigo}</td>
                <td className="px-3 py-2">{e.nombre}</td>
                <td className="px-3 py-2">{e.tipo}</td>
                <td className="px-3 py-2">
                  {e.requiereLectura
                    ? e.tipoMedidor === "ODOMETRO"
                      ? "Odómetro"
                      : "Horómetro"
                    : "No aplica"}
                </td>
                <td className="px-3 py-2">{e.tipoCombustible}</td>
                <td className="px-3 py-2">{e.lecturaActual}</td>
                <td className="px-3 py-2">{e.area.nombre}</td>
                <td className="px-3 py-2">{e.activo ? "Activo" : "Inactivo"}</td>
                <td className="px-3 py-2">
                  <form action={toggleActivoEquipo.bind(null, e.id, e.activo)}>
                    <button className="text-zinc-600 underline hover:text-zinc-900">
                      {e.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <details>
                    <summary className="cursor-pointer text-zinc-600 underline hover:text-zinc-900">
                      Ver despachos ({e.solicitudes.length})
                    </summary>
                    <ul className="mt-2 flex max-h-48 min-w-64 flex-col gap-1 overflow-y-auto text-xs text-zinc-600">
                      {e.solicitudes.map((s) => (
                        <li key={s.id}>
                          {s.fechaDespacho ? formatFechaCorta(s.fechaDespacho) : ""} ·{" "}
                          {s.cantidadDespachada} L · {s.solicitante.nombre}
                        </li>
                      ))}
                      {e.solicitudes.length === 0 && <li>Sin despachos aún.</li>}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}
            {equipos.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-zinc-400">
                  No hay equipos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="max-w-lg">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Registrar nuevo equipo
        </h2>
        <form
          action={crearEquipo}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="codigo" className="text-sm font-medium text-zinc-700">
              Código
            </label>
            <input
              id="codigo"
              name="codigo"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tipo" className="text-sm font-medium text-zinc-700">
              Tipo de equipo
            </label>
            <input
              id="tipo"
              name="tipo"
              placeholder="Ej: Camión, Excavadora, Pickup"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tipoMedidor" className="text-sm font-medium text-zinc-700">
              Tipo de medidor
            </label>
            <select
              id="tipoMedidor"
              name="tipoMedidor"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="ODOMETRO">Odómetro</option>
              <option value="HOROMETRO">Horómetro</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="requiereLectura"
              name="requiereLectura"
              type="checkbox"
              defaultChecked
              className="h-4 w-4"
            />
            <label htmlFor="requiereLectura" className="text-sm text-zinc-700">
              Exigir lectura de odómetro/horómetro al solicitar combustible
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tipoCombustible" className="text-sm font-medium text-zinc-700">
              Tipo de combustible
            </label>
            <select
              id="tipoCombustible"
              name="tipoCombustible"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="DIESEL">Diésel</option>
              <option value="GASOLINA">Gasolina</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lecturaActual" className="text-sm font-medium text-zinc-700">
              Lectura inicial
            </label>
            <input
              id="lecturaActual"
              name="lecturaActual"
              type="number"
              step="0.01"
              min="0"
              defaultValue={0}
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="areaId" className="text-sm font-medium text-zinc-700">
              Área
            </label>
            <select
              id="areaId"
              name="areaId"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Crear equipo
          </button>
        </form>
      </div>
    </div>
  );
}
