import { db } from "@/lib/db";

export type FilaEficiencia = {
  equipoId: string;
  codigo: string;
  nombre: string;
  tipoMedidor: string;
  areaNombre: string;
  veces: number;
  cantidadTotal: number;
  deltaLectura: number | null;
  eficiencia: number | null;
};

export async function getEficienciaPorEquipo(
  desde: Date,
  hasta: Date,
): Promise<FilaEficiencia[]> {
  const solicitudes = await db.solicitud.findMany({
    where: {
      estado: "DESPACHADA",
      fechaDespacho: { gte: desde, lte: hasta },
    },
    include: { equipo: { include: { area: true } } },
    orderBy: { fechaDespacho: "asc" },
  });

  const porEquipo = new Map<
    string,
    {
      equipo: (typeof solicitudes)[number]["equipo"];
      cantidadTotal: number;
      lecturas: number[];
      veces: number;
    }
  >();

  for (const s of solicitudes) {
    const actual = porEquipo.get(s.equipoId) ?? {
      equipo: s.equipo,
      cantidadTotal: 0,
      lecturas: [],
      veces: 0,
    };
    actual.cantidadTotal += s.cantidadDespachada ?? 0;
    actual.lecturas.push(s.lecturaMedidor);
    actual.veces += 1;
    porEquipo.set(s.equipoId, actual);
  }

  return Array.from(porEquipo.entries()).map(([equipoId, datos]) => {
    const deltaLectura =
      datos.lecturas.length > 1
        ? Math.max(...datos.lecturas) - Math.min(...datos.lecturas)
        : null;
    return {
      equipoId,
      codigo: datos.equipo.codigo,
      nombre: datos.equipo.nombre,
      tipoMedidor: datos.equipo.tipoMedidor,
      areaNombre: datos.equipo.area.nombre,
      veces: datos.veces,
      cantidadTotal: datos.cantidadTotal,
      deltaLectura,
      eficiencia:
        deltaLectura && deltaLectura > 0
          ? datos.cantidadTotal / deltaLectura
          : null,
    };
  });
}
