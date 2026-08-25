"use client";

import { useMemo, useState } from "react";
import { crearSolicitud } from "../actions";

type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  tipoMedidor: "ODOMETRO" | "HOROMETRO";
  tipoCombustible: "DIESEL" | "GASOLINA";
  lecturaActual: number;
};

export default function NuevaSolicitudForm({ equipos }: { equipos: Equipo[] }) {
  const [tipoCombustible, setTipoCombustible] = useState<"DIESEL" | "GASOLINA">(
    "DIESEL",
  );

  const equiposFiltrados = useMemo(
    () => equipos.filter((e) => e.tipoCombustible === tipoCombustible),
    [equipos, tipoCombustible],
  );

  return (
    <form
      action={crearSolicitud}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="tipoCombustible" className="text-sm font-medium text-zinc-700">
          Tipo de combustible
        </label>
        <select
          id="tipoCombustible"
          name="tipoCombustible"
          value={tipoCombustible}
          onChange={(e) =>
            setTipoCombustible(e.target.value as "DIESEL" | "GASOLINA")
          }
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="DIESEL">Diésel</option>
          <option value="GASOLINA">Gasolina</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="equipoId" className="text-sm font-medium text-zinc-700">
          Equipo
        </label>
        {equiposFiltrados.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay equipos de {tipoCombustible === "DIESEL" ? "diésel" : "gasolina"}{" "}
            en tu área.
          </p>
        ) : (
          <select
            id="equipoId"
            name="equipoId"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            {equiposFiltrados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.codigo} — {e.nombre} (
                {e.tipoMedidor === "ODOMETRO" ? "odómetro" : "horómetro"}:{" "}
                {e.lecturaActual})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lecturaMedidor" className="text-sm font-medium text-zinc-700">
          Lectura actual de odómetro/horómetro
        </label>
        <input
          id="lecturaMedidor"
          name="lecturaMedidor"
          type="number"
          step="0.01"
          min="0"
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="cantidadSolicitada"
          className="text-sm font-medium text-zinc-700"
        >
          Cantidad solicitada (galones)
        </label>
        <input
          id="cantidadSolicitada"
          name="cantidadSolicitada"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={equiposFiltrados.length === 0}
        className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        Enviar solicitud
      </button>
    </form>
  );
}
