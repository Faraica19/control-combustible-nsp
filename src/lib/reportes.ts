import { db } from "@/lib/db";

export type SegmentoRendimiento = {
  equipoId: string;
  codigo: string;
  nombre: string;
  areaNombre: string;
  tipoMedidor: string;
  lecturaAnterior: number;
  lecturaActual: number;
  distancia: number;
  combustible: number;
  fecha: Date;
  rendimiento: number;
};

type DatosEquipo = {
  codigo: string;
  nombre: string;
  tipoMedidor: string;
  areaNombre: string;
};

async function construirSegmentosPorEquipo(): Promise<
  Map<string, { equipo: DatosEquipo; segmentos: SegmentoRendimiento[] }>
> {
  const solicitudes = await db.solicitud.findMany({
    where: { estado: "DESPACHADA", lecturaMedidor: { not: null } },
    include: { equipo: { include: { area: true } } },
    orderBy: { fechaDespacho: "asc" },
  });

  const lecturasPorEquipo = new Map<
    string,
    {
      equipo: DatosEquipo;
      lecturas: { lectura: number; cantidad: number; fecha: Date }[];
    }
  >();

  for (const s of solicitudes) {
    if (s.lecturaMedidor == null || s.cantidadDespachada == null) continue;
    const actual = lecturasPorEquipo.get(s.equipoId) ?? {
      equipo: {
        codigo: s.equipo.codigo,
        nombre: s.equipo.nombre,
        tipoMedidor: s.equipo.tipoMedidor,
        areaNombre: s.equipo.area.nombre,
      },
      lecturas: [],
    };
    actual.lecturas.push({
      lectura: s.lecturaMedidor,
      cantidad: s.cantidadDespachada,
      fecha: s.fechaDespacho ?? s.fechaSolicitud,
    });
    lecturasPorEquipo.set(s.equipoId, actual);
  }

  const resultado = new Map<
    string,
    { equipo: DatosEquipo; segmentos: SegmentoRendimiento[] }
  >();

  for (const [equipoId, datos] of lecturasPorEquipo) {
    const segmentos: SegmentoRendimiento[] = [];
    for (let i = 1; i < datos.lecturas.length; i++) {
      const anterior = datos.lecturas[i - 1];
      const actual = datos.lecturas[i];
      const distancia = actual.lectura - anterior.lectura;
      const combustible = actual.cantidad;
      if (combustible > 0) {
        segmentos.push({
          equipoId,
          codigo: datos.equipo.codigo,
          nombre: datos.equipo.nombre,
          areaNombre: datos.equipo.areaNombre,
          tipoMedidor: datos.equipo.tipoMedidor,
          lecturaAnterior: anterior.lectura,
          lecturaActual: actual.lectura,
          distancia,
          combustible,
          fecha: actual.fecha,
          rendimiento: distancia / combustible,
        });
      }
    }
    resultado.set(equipoId, { equipo: datos.equipo, segmentos });
  }

  return resultado;
}

/** Para la pantalla: solo el último segmento (entre los dos rellenos más recientes) por equipo. */
export async function getRendimientoActualPorEquipo(): Promise<
  SegmentoRendimiento[]
> {
  const mapa = await construirSegmentosPorEquipo();
  const filas: SegmentoRendimiento[] = [];
  for (const { segmentos } of mapa.values()) {
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo) filas.push(ultimo);
  }
  return filas;
}

export type HistorialEquipo = {
  equipoId: string;
  codigo: string;
  nombre: string;
  areaNombre: string;
  segmentos: SegmentoRendimiento[];
  promedioGlobal: number;
};

/** Para el Excel: todos los segmentos de cada equipo, mas el promedio global desde el primer relleno. */
export async function getHistorialRendimientoPorEquipo(): Promise<
  HistorialEquipo[]
> {
  const mapa = await construirSegmentosPorEquipo();
  const filas: HistorialEquipo[] = [];
  for (const [equipoId, { equipo, segmentos }] of mapa) {
    if (segmentos.length === 0) continue;
    const promedioGlobal =
      segmentos.reduce((suma, s) => suma + s.rendimiento, 0) / segmentos.length;
    filas.push({
      equipoId,
      codigo: equipo.codigo,
      nombre: equipo.nombre,
      areaNombre: equipo.areaNombre,
      segmentos,
      promedioGlobal,
    });
  }
  return filas;
}
