import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permisos";
import EstadoBadge from "@/components/EstadoBadge";
import { despacharBodega, rechazarBodega } from "../actions";

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (Number.isNaN(id)) notFound();

  const session = await requireSession();
  const solicitud = await db.solicitud.findUnique({
    where: { id },
    include: {
      equipo: true,
      solicitante: true,
      area: true,
      bodeguero: true,
    },
  });
  if (!solicitud) notFound();

  const { rol, id: userId } = session.user;
  const puedeVer =
    rol === "ADMIN" ||
    rol === "BODEGA" ||
    rol === "CONSULTA" ||
    (rol === "SOLICITANTE" && solicitud.solicitanteId === userId);
  if (!puedeVer) redirect("/solicitudes");

  const puedeDespachar =
    solicitud.estado === "PENDIENTE_BODEGA" && (rol === "ADMIN" || rol === "BODEGA");

  const despacharBodegaConId = despacharBodega.bind(null, id);
  const rechazarBodegaConId = rechazarBodega.bind(null, id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          Solicitud #{solicitud.id}
        </h1>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm">
        <Campo label="Equipo" valor={`${solicitud.equipo.codigo} — ${solicitud.equipo.nombre}`} />
        <Campo
          label={solicitud.equipo.tipoMedidor === "ODOMETRO" ? "Odómetro" : "Horómetro"}
          valor={String(solicitud.lecturaMedidor)}
        />
        <Campo label="Solicitante" valor={solicitud.solicitante.nombre} />
        <Campo label="Área" valor={solicitud.area.nombre} />
        <Campo label="Combustible" valor={solicitud.tipoCombustible} />
        <Campo label="Cantidad solicitada" valor={String(solicitud.cantidadSolicitada)} />
        <Campo
          label="Fecha de solicitud"
          valor={solicitud.fechaSolicitud.toLocaleString("es")}
        />
        {solicitud.bodeguero && (
          <Campo label="Bodeguero" valor={solicitud.bodeguero.nombre} />
        )}
        {solicitud.cantidadDespachada != null && (
          <Campo
            label="Cantidad despachada"
            valor={String(solicitud.cantidadDespachada)}
          />
        )}
        {solicitud.comentarioBodega && (
          <Campo label="Comentario bodega" valor={solicitud.comentarioBodega} />
        )}
      </div>

      {puedeDespachar && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-900">
            Aprobación y despacho de bodega
          </h2>
          <form action={despacharBodegaConId} className="flex flex-col gap-2">
            <label
              htmlFor="cantidadDespachada"
              className="text-sm font-medium text-zinc-700"
            >
              Cantidad a despachar
            </label>
            <input
              id="cantidadDespachada"
              name="cantidadDespachada"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={solicitud.cantidadSolicitada}
              required
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Aprobar y despachar
            </button>
          </form>
          <form action={rechazarBodegaConId} className="flex flex-col gap-2">
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
