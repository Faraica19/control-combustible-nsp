import { requireRol } from "@/lib/permisos";
import { getHistorialRendimientoPorEquipo } from "@/lib/reportes";
import { generarExcelMultihoja, respuestaExcel } from "@/lib/excel";
import { formatFecha } from "@/lib/fecha";

export async function GET() {
  await requireRol("ADMIN");

  const historial = await getHistorialRendimientoPorEquipo();

  const filasDetalle = historial.flatMap((h) =>
    h.segmentos.map((s) => ({
      equipo: `${h.codigo} — ${h.nombre}`,
      area: h.areaNombre,
      fecha: formatFecha(s.fecha),
      lecturaAnterior: s.lecturaAnterior,
      lecturaActual: s.lecturaActual,
      distancia: Number(s.distancia.toFixed(2)),
      combustible: Number(s.combustible.toFixed(2)),
      rendimiento: Number(s.rendimiento.toFixed(3)),
      unidad: s.tipoMedidor === "ODOMETRO" ? "km/L" : "h/L",
    })),
  );

  const filasPromedio = historial.map((h) => ({
    equipo: `${h.codigo} — ${h.nombre}`,
    area: h.areaNombre,
    segmentos: h.segmentos.length,
    promedioGlobal: Number(h.promedioGlobal.toFixed(3)),
    unidad: h.segmentos[0]?.tipoMedidor === "ODOMETRO" ? "km/L" : "h/L",
  }));

  const buffer = await generarExcelMultihoja([
    {
      nombre: "Promedio global",
      columnas: [
        { header: "Equipo", key: "equipo", width: 30 },
        { header: "Área", key: "area", width: 30 },
        { header: "Rellenos considerados", key: "segmentos", width: 20 },
        { header: "Promedio global", key: "promedioGlobal", width: 18 },
        { header: "Unidad", key: "unidad", width: 10 },
      ],
      filas: filasPromedio,
    },
    {
      nombre: "Historial detallado",
      columnas: [
        { header: "Equipo", key: "equipo", width: 30 },
        { header: "Área", key: "area", width: 30 },
        { header: "Fecha del relleno", key: "fecha", width: 20 },
        { header: "Lectura anterior", key: "lecturaAnterior", width: 16 },
        { header: "Lectura actual", key: "lecturaActual", width: 16 },
        { header: "Distancia/uso", key: "distancia", width: 16 },
        { header: "Combustible (L)", key: "combustible", width: 16 },
        { header: "Rendimiento", key: "rendimiento", width: 14 },
        { header: "Unidad", key: "unidad", width: 10 },
      ],
      filas: filasDetalle,
    },
  ]);

  return respuestaExcel(buffer, "rendimiento-combustible.xlsx");
}
