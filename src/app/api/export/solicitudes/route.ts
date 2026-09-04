import { requireSession } from "@/lib/permisos";
import { db } from "@/lib/db";
import { generarExcel, respuestaExcel } from "@/lib/excel";
import { formatFecha } from "@/lib/fecha";

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE_BODEGA: "Pendiente bodega",
  DESPACHADA: "Despachada",
  RECHAZADA_BODEGA: "Rechazada",
};

export async function GET() {
  const session = await requireSession();
  const where =
    session.user.rol === "SOLICITANTE"
      ? { solicitanteId: session.user.id }
      : undefined;

  const solicitudes = await db.solicitud.findMany({
    where,
    include: { equipo: true, solicitante: true, area: true, bodeguero: true },
    orderBy: { fechaSolicitud: "desc" },
  });

  const buffer = await generarExcel(
    "Solicitudes",
    [
      { header: "Folio", key: "folio", width: 10 },
      { header: "Equipo", key: "equipo", width: 25 },
      { header: "Solicitante", key: "solicitante", width: 20 },
      { header: "Área", key: "area", width: 30 },
      { header: "Combustible", key: "combustible", width: 14 },
      { header: "Cantidad solicitada", key: "cantidadSolicitada", width: 18 },
      { header: "Cantidad despachada", key: "cantidadDespachada", width: 18 },
      { header: "Lectura odómetro/horómetro", key: "lectura", width: 22 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Fecha solicitud", key: "fechaSolicitud", width: 20 },
      { header: "Fecha despacho", key: "fechaDespacho", width: 20 },
      { header: "Bodeguero", key: "bodeguero", width: 20 },
      { header: "Comentario bodega", key: "comentarioBodega", width: 30 },
    ],
    solicitudes.map((s) => ({
      folio: s.id,
      equipo: `${s.equipo.codigo} — ${s.equipo.nombre}`,
      solicitante: s.solicitante.nombre,
      area: s.area.nombre,
      combustible: s.tipoCombustible,
      cantidadSolicitada: s.cantidadSolicitada,
      cantidadDespachada: s.cantidadDespachada ?? "",
      lectura: s.lecturaMedidor,
      estado: ETIQUETA_ESTADO[s.estado] ?? s.estado,
      fechaSolicitud: formatFecha(s.fechaSolicitud),
      fechaDespacho: s.fechaDespacho ? formatFecha(s.fechaDespacho) : "",
      bodeguero: s.bodeguero?.nombre ?? "",
      comentarioBodega: s.comentarioBodega ?? "",
    })),
  );

  return respuestaExcel(buffer, "solicitudes.xlsx");
}
