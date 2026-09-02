import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permisos";
import EstadoBadge from "@/components/EstadoBadge";
import {
  aprobarYCompletarTrabajo,
  rechazarTrabajo,
  editarLecturaTrabajo,
} from "../actions";

const ETIQUETA_TIPO: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION_LLANTA: "Reparación de llanta",
};

const ETIQUETA_MATERIAL: Record<string, string> = {
  PARCHE: "Parche",
  MECHA: "Mecha",
  NEUMATICO: "Neumático",
};

export default async function SolicitudTrabajoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (Number.isNaN(id)) notFound();

  const session = await requireSession();
  const solicitud = await db.solicitudTrabajo.findUnique({
    where: { id },
    include: { equipo: true, solicitante: true, area: true, bodeguero: true },
  });
  if (!solicitud) notFound();

  const { rol, id: userId } = session.user;
  const puedeVer =
    rol === "ADMIN" ||
    rol === "BODEGA" ||
    rol === "CONSULTA" ||
    (rol === "SOLICITANTE" && solicitud.solicitanteId === userId);
  if (!puedeVer) redirect("/mantenimiento");

  const puedeResolver =
    solicitud.estado === "PENDIENTE" && (rol === "ADMIN" || rol === "BODEGA");

  const aprobarConId = aprobarYCompletarTrabajo.bind(null, id);
  const rechazarConId = rechazarTrabajo.bind(null, id);
  const editarLecturaConId = editarLecturaTrabajo.bind(null, id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          Solicitud de trabajo #{solicitud.id}
        </h1>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm">
        <Campo label="Tipo" valor={ETIQUETA_TIPO[solicitud.tipo] ?? solicitud.tipo} />
        <Campo
          label="Equipo"
          valor={`${solicitud.equipo.codigo} — ${solicitud.equipo.nombre}`}
        />
        {solicitud.tipo === "REPARACION_LLANTA" && (
          <Campo label="¿Es ponchadura?" valor={solicitud.esPonchadura ? "Sí" : "No"} />
        )}
        {solicitud.lecturaMedidor != null && (
          <Campo
            label={solicitud.equipo.tipoMedidor === "ODOMETRO" ? "Odómetro" : "Horómetro"}
            valor={String(solicitud.lecturaMedidor)}
          />
        )}
        <Campo label="Solicitante" valor={solicitud.solicitante.nombre} />
        <Campo label="Área" valor={solicitud.area.nombre} />
        <Campo
          label="Fecha de solicitud"
          valor={solicitud.fechaSolicitud.toLocaleString("es")}
        />
        {solicitud.descripcion && (
          <Campo label="Descripción" valor={solicitud.descripcion} />
        )}
        {solicitud.bodeguero && (
          <Campo label="Atendido por" valor={solicitud.bodeguero.nombre} />
        )}
        {solicitud.materialesUsados.length > 0 && (
          <Campo
            label="Materiales usados"
            valor={solicitud.materialesUsados
              .map((m) => ETIQUETA_MATERIAL[m] ?? m)
              .join(", ")}
          />
        )}
        {solicitud.horasTrabajo != null && (
          <Campo label="Horas de trabajo" valor={`${solicitud.horasTrabajo} h`} />
        )}
        {solicitud.comentario && (
          <Campo label="Comentario" valor={solicitud.comentario} />
        )}
      </div>

      {rol === "ADMIN" && solicitud.equipo.requiereLectura && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-900">
            Editar lectura ({solicitud.equipo.tipoMedidor === "ODOMETRO" ? "odómetro" : "horómetro"})
          </h2>
          <form action={editarLecturaConId} className="flex items-end gap-2">
            <input
              name="lecturaMedidor"
              type="number"
              step="0.01"
              min="0"
              defaultValue={solicitud.lecturaMedidor ?? undefined}
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Guardar
            </button>
          </form>
        </div>
      )}

      {puedeResolver && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-900">
            Aprobar y completar trabajo
          </h2>
          <form action={aprobarConId} className="flex flex-col gap-3">
            {solicitud.tipo === "REPARACION_LLANTA" && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-700">
                  Materiales usados
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm text-zinc-700">
                    <input type="checkbox" name="materialesUsados" value="PARCHE" />
                    Parche
                  </label>
                  <label className="flex items-center gap-1 text-sm text-zinc-700">
                    <input type="checkbox" name="materialesUsados" value="MECHA" />
                    Mecha
                  </label>
                  <label className="flex items-center gap-1 text-sm text-zinc-700">
                    <input type="checkbox" name="materialesUsados" value="NEUMATICO" />
                    Neumático
                  </label>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="horasTrabajo" className="text-sm font-medium text-zinc-700">
                Horas que se tardó en realizar el trabajo
              </label>
              <input
                id="horasTrabajo"
                name="horasTrabajo"
                type="number"
                step="0.25"
                min="0"
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="comentario-completar" className="text-sm font-medium text-zinc-700">
                Comentario (opcional)
              </label>
              <textarea
                id="comentario-completar"
                name="comentario"
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Aprobar y completar
            </button>
          </form>
          <form action={rechazarConId} className="flex flex-col gap-2">
            <textarea
              name="comentario"
              placeholder="Motivo de rechazo"
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Rechazar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-zinc-900">{valor}</span>
    </div>
  );
}
