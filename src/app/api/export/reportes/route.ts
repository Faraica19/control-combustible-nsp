import type { NextRequest } from "next/server";
import { requireRol } from "@/lib/permisos";
import { getEficienciaPorEquipo } from "@/lib/reportes";
import { generarExcel, respuestaExcel } from "@/lib/excel";

export async function GET(request: NextRequest) {
  await requireRol("ADMIN");

  const { searchParams } = request.nextUrl;
  const hastaDefault = new Date();
  const desdeDefault = new Date(hastaDefault);
  desdeDefault.setDate(desdeDefault.getDate() - 7);

  const desdeParam = searchParams.get("desde");
  const hastaParam = searchParams.get("hasta");
  const desde = desdeParam ? new Date(desdeParam) : desdeDefault;
  const hasta = hastaParam ? new Date(hastaParam) : hastaDefault;
  hasta.setHours(23, 59, 59, 999);

  const filas = await getEficienciaPorEquipo(desde, hasta);

  const buffer = await generarExcel(
    "Eficiencia",
    [
      { header: "Equipo", key: "equipo", width: 30 },
      { header: "Área", key: "area", width: 30 },
      { header: "Veces despachado", key: "veces", width: 16 },
      { header: "Cantidad total (L)", key: "cantidadTotal", width: 18 },
      { header: "Uso registrado", key: "uso", width: 16 },
      { header: "Eficiencia (L/unidad)", key: "eficiencia", width: 20 },
    ],
    filas.map((f) => ({
      equipo: `${f.codigo} — ${f.nombre}`,
      area: f.areaNombre,
      veces: f.veces,
      cantidadTotal: Number(f.cantidadTotal.toFixed(2)),
      uso: f.deltaLectura != null ? Number(f.deltaLectura.toFixed(2)) : "",
      eficiencia: f.eficiencia != null ? Number(f.eficiencia.toFixed(3)) : "",
    })),
  );

  return respuestaExcel(buffer, "eficiencia-combustible.xlsx");
}
