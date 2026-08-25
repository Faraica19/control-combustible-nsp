import { requireRol } from "@/lib/permisos";
import { registrarEntrada } from "../actions";

export default async function NuevaEntradaPage() {
  await requireRol("BODEGA", "ADMIN");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">
        Registrar entrada de inventario
      </h1>

      <form
        action={registrarEntrada}
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
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
          <label htmlFor="cantidad" className="text-sm font-medium text-zinc-700">
            Cantidad (galones)
          </label>
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="numeroFactura" className="text-sm font-medium text-zinc-700">
            Número de factura
          </label>
          <input
            id="numeroFactura"
            name="numeroFactura"
            type="text"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="costo" className="text-sm font-medium text-zinc-700">
            Costo total de la factura (C$, opcional)
          </label>
          <input
            id="costo"
            name="costo"
            type="number"
            step="0.01"
            min="0"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-zinc-500">
            Se usa para calcular el costo promedio por galón despachado.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="proveedor" className="text-sm font-medium text-zinc-700">
            Proveedor (opcional)
          </label>
          <input
            id="proveedor"
            name="proveedor"
            type="text"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Registrar entrada
        </button>
      </form>
    </div>
  );
}
