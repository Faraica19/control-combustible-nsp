import Link from "next/link";
import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { getSaldos, getCostoPromedio } from "@/lib/inventario";

export default async function InventarioPage() {
  const session = await requireRol("BODEGA", "ADMIN", "CONSULTA");
  const puedeRegistrar = session.user.rol === "BODEGA" || session.user.rol === "ADMIN";

  const [saldos, costoPromedio] = await Promise.all([
    getSaldos(),
    getCostoPromedio(),
  ]);
  const movimientos = await db.movimientoInventario.findMany({
    include: { usuario: true, solicitud: { include: { equipo: true } } },
    orderBy: { fecha: "desc" },
    take: 100,
  });

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
          <p className="text-xs text-zinc-500">Saldo diésel</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {saldos.DIESEL} gal
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Saldo gasolina</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {saldos.GASOLINA} gal
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Costo promedio diésel</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {costoPromedio.DIESEL != null
              ? `C$${costoPromedio.DIESEL.toFixed(2)}/gal`
              : "N/D"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Costo promedio gasolina</p>
          <p className="text-2xl font-semibold text-zinc-900">
            {costoPromedio.GASOLINA != null
              ? `C$${costoPromedio.GASOLINA.toFixed(2)}/gal`
              : "N/D"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Combustible</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Factura</th>
              <th className="px-3 py-2">Costo</th>
              <th className="px-3 py-2">Proveedor / Solicitud</th>
              <th className="px-3 py-2">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{m.fecha.toLocaleString("es")}</td>
                <td className="px-3 py-2">
                  {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                </td>
                <td className="px-3 py-2">{m.tipoCombustible}</td>
                <td className="px-3 py-2">
                  {m.tipo === "ENTRADA" ? "+" : "-"}
                  {m.cantidad}
                </td>
                <td className="px-3 py-2">{m.numeroFactura ?? "—"}</td>
                <td className="px-3 py-2">
                  {m.costo != null ? `C$${m.costo.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2">
                  {m.solicitud
                    ? `Solicitud #${m.solicitud.id} (${m.solicitud.equipo.nombre})`
                    : (m.proveedor ?? "—")}
                </td>
                <td className="px-3 py-2">{m.usuario.nombre}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-zinc-400">
                  Sin movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
