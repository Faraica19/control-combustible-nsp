"use client";

import { useState } from "react";
import { crearSolicitudTrabajo } from "../actions";

type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  area: { nombre: string };
};

export default function NuevaSolicitudTrabajoForm({
  equipos,
}: {
  equipos: Equipo[];
}) {
  const [tipo, setTipo] = useState<"MANTENIMIENTO" | "REPARACION_LLANTA">(
    "MANTENIMIENTO",
  );

  return (
    <form
      action={crearSolicitudTrabajo}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-zinc-700">
          Tipo de solicitud
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) =>
            setTipo(e.target.value as "MANTENIMIENTO" | "REPARACION_LLANTA")
          }
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="REPARACION_LLANTA">Reparación de llanta</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="equipoId" className="text-sm font-medium text-zinc-700">
          Equipo
        </label>
        <select
          id="equipoId"
          name="equipoId"
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {equipos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.codigo} — {e.nombre} · {e.area.nombre}
            </option>
          ))}
        </select>
      </div>

      {tipo === "REPARACION_LLANTA" && (
        <div className="flex items-center gap-2">
          <input
            id="esPonchadura"
            name="esPonchadura"
            type="checkbox"
            className="h-4 w-4"
          />
          <label htmlFor="esPonchadura" className="text-sm text-zinc-700">
            ¿Es ponchadura?
          </label>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-zinc-700">
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          placeholder="Describe el problema o el trabajo necesario"
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Enviar solicitud
      </button>
    </form>
  );
}
