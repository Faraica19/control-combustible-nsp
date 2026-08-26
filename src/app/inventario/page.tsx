import Link from "next/link";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { getSaldos, getCostoPromedio } from "@/lib/inventario";
import { eliminarEntrada } from "./actions";

export default async function InventarioPage() {
  const session = await requireRol("BODEGA", "ADMIN", "CONSULTA");
  const puedeRegistrar = session.user.rol === "BODEGA" || session.user.rol === "ADMIN";
  const esAdmin = session.user.rol === "ADMIN";

  const [saldos, costoPromedio] = await Promise.all([
    getSaldos(),
    getCostoPromedio(),
  ]);
  const movimientos = await db.movimientoInventario.findMany({
    include: { usuario: true, solicitud: { include: { equipo: true } } },
    orderBy: { fecha: "desc" },
    take: 200,
  });

  const entradas = movimientos.filter((m) => m.tipo === "ENTRADA");
  const salidas = movimientos.filter((m) => m.tipo === "SALIDA");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Inventario</h1>
        <div className="flex gap-2">
          <a
            href="/api/export/inventario"
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Exportar a Excel
          </a>
          {puedeRegistrar && (
            <Link
              href="/inventario/nueva-entrada"
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Registrar entrada
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Inventario diésel</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {saldos.DIESEL} L
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Inventario gasolina</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {saldos.GASOLINA} L
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Costo promedio diésel</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {costoPromedio.DIESEL != null
              ? `C$${costoPromedio.DIESEL.toFixed(2)}/L`
              : "N/D"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Costo promedio gasolina</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {costoPromedio.GASOLINA != null
              ? `C$${costoPromedio.GASOLINA.toFixed(2)}/L`
              : "N/D"}
          </p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-zinc-900">Entradas</h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Combustible</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Factura</th>
              <th className="px-3 py-2">Costo</th>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2">Registrado por</th>
              {esAdmin && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {entradas.map((m) => (
              <tr key={m.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{m.fecha.toLocaleString("es")}</td>
                <td className="px-3 py-2">{m.tipoCombustible}</td>
                <td className="px-3 py-2">+{m.cantidad} L</td>
                <td className="px-3 py-2">{m.numeroFactura ?? "—"}</td>
                <td className="px-3 py-2">
                  {m.costo != null ? `C$${m.costo.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2">{m.proveedor ?? "—"}</td>
                <td className="px-3 py-2">{m.usuario.nombre}</td>
                {esAdmin && (
                  <td className="px-3 py-2">
                    <form action={eliminarEntrada.bind(null, m.id)}>
                      <button className="text-red-600 underline hover:text-red-800">
                        Eliminar
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {entradas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-zinc-400">
                  Sin entradas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold text-zinc-900">Salidas / despachos</h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Combustible</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Solicitud</th>
              <th className="px-3 py-2">Despachado por</th>
            </tr>
          </thead>
          <tbody>
            {salidas.map((m) => (
              <tr key={m.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{m.fecha.toLocaleString("es")}</td>
                <td className="px-3 py-2">{m.tipoCombustible}</td>
                <td className="px-3 py-2">-{m.cantidad} L</td>
                <td className="px-3 py-2">
                  {m.solicitud
                    ? `#${m.solicitud.id} (${m.solicitud.equipo.nombre})`
                    : "—"}
                </td>
                <td className="px-3 py-2">{m.usuario.nombre}</td>
              </tr>
            ))}
            {salidas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-400">
                  Sin salidas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
