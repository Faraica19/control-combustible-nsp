"use client";

import { useMemo, useState } from "react";
import { crearSolicitudTrabajo } from "../actions";

type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  tipoMedidor: "ODOMETRO" | "HOROMETRO";
  lecturaActual: number;
  requiereLectura: boolean;
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
  const [equipoId, setEquipoId] = useState(equipos[0]?.id ?? "");

  const equipoSeleccionado = useMemo(
    () => equipos.find((e) => e.id === equipoId),
    [equipos, equipoId],
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
          value={equipoId}
          onChange={(e) => setEquipoId(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {equipos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.codigo} — {e.nombre} · {e.area.nombre}
            </option>
          ))}
        </select>
      </div>

      {equipoSeleccionado?.requiereLectura && (
        <div className="flex flex-col gap-1">
          <label htmlFor="lecturaMedidor" className="text-sm font-medium text-zinc-700">
            {equipoSeleccionado.tipoMedidor === "ODOMETRO" ? "Odómetro" : "Horómetro"}{" "}
            actual (última registrada: {equipoSeleccionado.lecturaActual})
          </label>
          <input
            id="lecturaMedidor"
            name="lecturaMedidor"
            type="number"
            step="0.01"
            min={equipoSeleccionado.lecturaActual}
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-zinc-500">
            Debe ser mayor a {equipoSeleccionado.lecturaActual}.
          </p>
        </div>
      )}

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
