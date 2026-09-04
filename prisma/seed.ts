import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

type DatosEquipo = {
  codigo: string;
  nombre: string;
  tipo: string;
  tipoMedidor: "ODOMETRO" | "HOROMETRO";
  tipoCombustible: "DIESEL" | "GASOLINA";
  lecturaActual: number;
  requiereLectura: boolean;
  areaId: string;
};

type SalidaHistorica = {
  equipoId: string;
  areaId: string;
  tipoCombustible: "DIESEL" | "GASOLINA";
  cantidad: number;
  lecturaMedidor: number | null;
  solicitanteId: string;
  bodegueroId: string;
  fecha: Date;
  comentarioBodega?: string;
};

async function registrarSalidas(salidas: SalidaHistorica[]) {
  for (const s of salidas) {
    const solicitud = await db.solicitud.create({
      data: {
        equipoId: s.equipoId,
        solicitanteId: s.solicitanteId,
        areaId: s.areaId,
        tipoCombustible: s.tipoCombustible,
        cantidadSolicitada: s.cantidad,
        lecturaMedidor: s.lecturaMedidor,
        fechaSolicitud: s.fecha,
        estado: "DESPACHADA",
        cantidadDespachada: s.cantidad,
        fechaDespacho: s.fecha,
        bodegueroId: s.bodegueroId,
        comentarioBodega: s.comentarioBodega,
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "SALIDA",
        tipoCombustible: s.tipoCombustible,
        cantidad: s.cantidad,
        usuarioId: s.bodegueroId,
        solicitudId: solicitud.id,
        fecha: s.fecha,
      },
    });
    if (s.lecturaMedidor != null) {
      await db.equipo.update({
        where: { id: s.equipoId },
        data: { lecturaActual: s.lecturaMedidor },
      });
    }
  }
}

async function upsertEquipoPorNombre(datos: DatosEquipo) {
  const existente = await db.equipo.findFirst({
    where: { nombre: datos.nombre },
  });
  if (existente) {
    return db.equipo.update({ where: { id: existente.id }, data: datos });
  }
  return db.equipo.create({ data: datos });
}

async function main() {
  const areaOyM = await db.area.upsert({
    where: { nombre: "Operaciones y Mantenimiento (OyM)" },
    update: {},
    create: { nombre: "Operaciones y Mantenimiento (OyM)" },
  });
  const areaSP = await db.area.upsert({
    where: { nombre: "Servicios de Planta (SP)" },
    update: {},
    create: { nombre: "Servicios de Planta (SP)" },
  });
  const areaSS = await db.area.upsert({
    where: { nombre: "Supervisión y Seguridad (SS)" },
    update: {},
    create: { nombre: "Supervisión y Seguridad (SS)" },
  });

  const admin = await db.user.upsert({
    where: { email: "fpalacios@sunpower.com.ni" },
    update: {},
    create: {
      nombre: "Franklin Araica",
      email: "fpalacios@sunpower.com.ni",
      passwordHash: await hash("Franklin123!"),
      rol: "ADMIN",
      areaId: areaSP.id,
    },
  });

  const bodega = await db.user.upsert({
    where: { email: "l86644908@gmail.com" },
    update: {},
    create: {
      nombre: "Luis Corea",
      email: "l86644908@gmail.com",
      passwordHash: await hash("Luis123!"),
      rol: "BODEGA",
      areaId: areaSP.id,
    },
  });

  const solicitanteOyM = await db.user.upsert({
    where: { email: "jcaceres@sunpower.com.ni" },
    update: {},
    create: {
      nombre: "Francisco Caceres",
      email: "jcaceres@sunpower.com.ni",
      passwordHash: await hash("Francisco123!"),
      rol: "SOLICITANTE",
      perfilSolicitante: "OPERADOR",
      areaId: areaOyM.id,
    },
  });

  const solicitanteSS = await db.user.upsert({
    where: { email: "sequeirarolando526@gmail.com" },
    update: {},
    create: {
      nombre: "Rolando Sequeira",
      email: "sequeirarolando526@gmail.com",
      passwordHash: await hash("Rolando123!"),
      rol: "SOLICITANTE",
      perfilSolicitante: "SEGURIDAD",
      areaId: areaSS.id,
    },
  });

  const solicitanteSP = await db.user.upsert({
    where: { email: "aemilioaguilar1984@gmail.com" },
    update: {},
    create: {
      nombre: "Emilio Aguilar",
      email: "aemilioaguilar1984@gmail.com",
      passwordHash: await hash("Emilio123!"),
      rol: "SOLICITANTE",
      perfilSolicitante: "OPERADOR",
      areaId: areaSP.id,
    },
  });

  const consultaWalkiria = await db.user.upsert({
    where: { email: "ewdona@greenpower.com.ni" },
    update: {},
    create: {
      nombre: "Walkiria Doña",
      email: "ewdona@greenpower.com.ni",
      passwordHash: await hash("Walkiria123!"),
      rol: "CONSULTA",
      areaId: areaSP.id,
    },
  });

  const consultaMiguel = await db.user.upsert({
    where: { email: "mgranados@greenpower.com.ni" },
    update: {},
    create: {
      nombre: "Miguel Granados",
      email: "mgranados@greenpower.com.ni",
      passwordHash: await hash("Miguel123!"),
      rol: "CONSULTA",
      areaId: areaSP.id,
    },
  });

  // Servicios de Planta (SP)
  const camionHino = await upsertEquipoPorNombre({
    codigo: "M-442012",
    nombre: "Camión Hino",
    tipo: "Camión",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "DIESEL",
    lecturaActual: 45000,
    requiereLectura: true,
    areaId: areaSP.id,
  });
  const cisterna = await upsertEquipoPorNombre({
    codigo: "LE-32484",
    nombre: "Cisterna",
    tipo: "Camión cisterna",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "DIESEL",
    lecturaActual: 38000,
    requiereLectura: true,
    areaId: areaSP.id,
  });
  const camionetaIsuzu = await upsertEquipoPorNombre({
    codigo: "CI-01",
    nombre: "Camioneta Isuzu",
    tipo: "Camioneta",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "DIESEL",
    lecturaActual: 62000,
    requiereLectura: true,
    areaId: areaSP.id,
  });
  const motoguadana = await upsertEquipoPorNombre({
    codigo: "MTGÑ",
    nombre: "Motoguadaña",
    tipo: "Herramienta",
    tipoMedidor: "HOROMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 320,
    requiereLectura: false,
    areaId: areaSP.id,
  });
  const tractor = await upsertEquipoPorNombre({
    codigo: "T-001",
    nombre: "Tractor MF 6712",
    tipo: "Tractor",
    tipoMedidor: "HOROMETRO",
    tipoCombustible: "DIESEL",
    lecturaActual: 1800,
    requiereLectura: true,
    areaId: areaSP.id,
  });
  const generador220 = await upsertEquipoPorNombre({
    codigo: "GE-220",
    nombre: "Generador 220",
    tipo: "Planta eléctrica",
    tipoMedidor: "HOROMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 2400,
    requiereLectura: true,
    areaId: areaSP.id,
  });

  // Operaciones y Mantenimiento (OyM)
  const xwolf550 = await upsertEquipoPorNombre({
    codigo: "CC-001",
    nombre: "XWolf 550",
    tipo: "Cuadraciclo",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 6500,
    requiereLectura: true,
    areaId: areaOyM.id,
  });
  const xwolf300 = await upsertEquipoPorNombre({
    codigo: "CC-002",
    nombre: "XWolf 300",
    tipo: "Cuadraciclo",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 8000,
    requiereLectura: true,
    areaId: areaOyM.id,
  });
  const generadorKholer = await upsertEquipoPorNombre({
    codigo: "GE-KOH",
    nombre: "Generador Kholer",
    tipo: "Generador",
    tipoMedidor: "HOROMETRO",
    tipoCombustible: "DIESEL",
    lecturaActual: 1500,
    requiereLectura: true,
    areaId: areaOyM.id,
  });

  // Supervisión y Seguridad (SS)
  const ybr = await upsertEquipoPorNombre({
    codigo: "M-298786",
    nombre: "MT YBR",
    tipo: "Motocicleta",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 12000,
    requiereLectura: true,
    areaId: areaSS.id,
  });
  const sx1 = await upsertEquipoPorNombre({
    codigo: "MT-02",
    nombre: "MT SX1",
    tipo: "Motocicleta",
    tipoMedidor: "ODOMETRO",
    tipoCombustible: "GASOLINA",
    lecturaActual: 9500,
    requiereLectura: true,
    areaId: areaSS.id,
  });

  // --- Carga única de datos históricos reales (facturas y despachos ya ocurridos) ---
  const yaImportado = await db.movimientoInventario.findFirst({
    where: { numeroFactura: "254022" },
  });

  if (!yaImportado) {
    // Elimina los movimientos de demostración de la primera versión, si existen.
    await db.movimientoInventario.deleteMany({
      where: { numeroFactura: { in: ["FAC-0001", "FAC-0002"] } },
    });

    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 71.136,
        costo: 3438,
        numeroFactura: "254022",
        proveedor: "Agroservicios Nagarote",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-19T12:00:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 46.587,
        costo: 2010.09,
        numeroFactura: "55123",
        proveedor: "Puma San Sebastián",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-19T12:05:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 57.37,
        costo: 2510,
        numeroFactura: "254189",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-24T12:00:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 53.804,
        costo: 2600.35,
        numeroFactura: "254189",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-24T12:05:00"),
      },
    });

    const salidas: SalidaHistorica[] = [
      {
        equipoId: xwolf300.id,
        areaId: areaOyM.id,
        tipoCombustible: "GASOLINA",
        cantidad: 14,
        lecturaMedidor: 3370,
        solicitanteId: solicitanteOyM.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-19T09:00:00"),
      },
      {
        equipoId: sx1.id,
        areaId: areaSS.id,
        tipoCombustible: "GASOLINA",
        cantidad: 11,
        lecturaMedidor: 15159.7,
        solicitanteId: solicitanteSS.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-19T09:15:00"),
      },
      {
        equipoId: motoguadana.id,
        areaId: areaSP.id,
        tipoCombustible: "GASOLINA",
        cantidad: 4,
        lecturaMedidor: null,
        solicitanteId: bodega.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-19T09:30:00"),
      },
      {
        equipoId: xwolf550.id,
        areaId: areaOyM.id,
        tipoCombustible: "GASOLINA",
        cantidad: 22,
        lecturaMedidor: 5846,
        solicitanteId: solicitanteOyM.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-20T09:00:00"),
      },
      {
        equipoId: camionHino.id,
        areaId: areaSP.id,
        tipoCombustible: "DIESEL",
        cantidad: 46.58,
        lecturaMedidor: 35501,
        solicitanteId: admin.id,
        bodegueroId: admin.id,
        fecha: new Date("2026-08-20T09:15:00"),
      },
      {
        equipoId: ybr.id,
        areaId: areaSS.id,
        tipoCombustible: "GASOLINA",
        cantidad: 11,
        lecturaMedidor: 2130.6,
        solicitanteId: solicitanteSS.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-21T09:00:00"),
      },
      {
        equipoId: xwolf300.id,
        areaId: areaOyM.id,
        tipoCombustible: "GASOLINA",
        cantidad: 14,
        lecturaMedidor: 3478,
        solicitanteId: solicitanteOyM.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-21T09:15:00"),
      },
      {
        equipoId: motoguadana.id,
        areaId: areaSP.id,
        tipoCombustible: "GASOLINA",
        cantidad: 4,
        lecturaMedidor: null,
        solicitanteId: bodega.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-24T09:00:00"),
      },
      {
        equipoId: xwolf300.id,
        areaId: areaOyM.id,
        tipoCombustible: "GASOLINA",
        cantidad: 14,
        lecturaMedidor: 3563,
        solicitanteId: solicitanteOyM.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-24T09:15:00"),
      },
      {
        equipoId: sx1.id,
        areaId: areaSS.id,
        tipoCombustible: "GASOLINA",
        cantidad: 11,
        lecturaMedidor: 5390,
        solicitanteId: solicitanteSS.id,
        bodegueroId: bodega.id,
        fecha: new Date("2026-08-24T09:30:00"),
        comentarioBodega: "El odómetro se dañó el 23 de agosto.",
      },
      {
        equipoId: camionHino.id,
        areaId: areaSP.id,
        tipoCombustible: "DIESEL",
        cantidad: 57.37,
        lecturaMedidor: 35951,
        solicitanteId: admin.id,
        bodegueroId: admin.id,
        fecha: new Date("2026-08-24T09:45:00"),
      },
    ];

    await registrarSalidas(salidas);
  }

  // --- Inventario inicial: combustible que ya existía antes de usar el sistema ---
  const inventarioInicialYaCargado = await db.movimientoInventario.findFirst({
    where: { numeroFactura: "INV-INICIAL-DIESEL" },
  });
  if (!inventarioInicialYaCargado) {
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 61.06,
        numeroFactura: "INV-INICIAL-GASOLINA",
        proveedor: "Inventario inicial (existencia previa al sistema)",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-19T08:00:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 80,
        numeroFactura: "INV-INICIAL-DIESEL",
        proveedor: "Inventario inicial (existencia previa al sistema)",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-19T08:00:00"),
      },
    });
  }

  // --- Tercera carga histórica: compras y despachos del 3 de agosto ---
  const yaImportado3 = await db.movimientoInventario.findFirst({
    where: { costo: 3357.49, tipoCombustible: "GASOLINA" },
  });

  if (!yaImportado3) {
    const PRECIO_USD_GASOLINA = 1.3;

    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 43.5,
        costo: 1900.17,
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T07:00:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 69.47,
        costo: 3357.49,
        costoUSD: Number((69.47 * PRECIO_USD_GASOLINA).toFixed(2)),
        proveedor: "Agroservicios Nagarote",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T07:05:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 60.62,
        costo: 2930,
        costoUSD: Number((60.62 * PRECIO_USD_GASOLINA).toFixed(2)),
        proveedor: "Agroservicios Nagarote",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T07:10:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 50.89,
        costo: 2459.97,
        costoUSD: Number((50.89 * PRECIO_USD_GASOLINA).toFixed(2)),
        proveedor: "Agroservicios Nagarote",
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T07:15:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 59.5,
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T10:24:00"),
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 48.9,
        usuarioId: bodega.id,
        fecha: new Date("2026-08-03T11:29:00"),
      },
    });

    const salidas3: SalidaHistorica[] = [
      { equipoId: xwolf550.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 20, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:00:00") },
      { equipoId: sx1.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 11, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:05:00") },
      { equipoId: ybr.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 11, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:10:00") },
      { equipoId: xwolf550.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 22, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:15:00") },
      { equipoId: sx1.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 11, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:20:00") },
      { equipoId: camionHino.id, areaId: areaSP.id, tipoCombustible: "DIESEL", cantidad: 59.5, lecturaMedidor: null, solicitanteId: bodega.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:25:00") },
      { equipoId: xwolf300.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 15, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:30:00") },
      { equipoId: xwolf550.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 19, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:35:00") },
      { equipoId: xwolf300.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 13, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:40:00") },
      { equipoId: motoguadana.id, areaId: areaSP.id, tipoCombustible: "GASOLINA", cantidad: 4, lecturaMedidor: null, solicitanteId: bodega.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:45:00") },
      { equipoId: sx1.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 11, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:50:00") },
      { equipoId: xwolf550.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 10, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T10:55:00") },
      { equipoId: xwolf300.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 9, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:00:00") },
      { equipoId: ybr.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 12, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:05:00") },
      { equipoId: xwolf300.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 13, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:10:00") },
      { equipoId: sx1.id, areaId: areaSS.id, tipoCombustible: "GASOLINA", cantidad: 11, lecturaMedidor: null, solicitanteId: solicitanteSS.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:15:00") },
      { equipoId: xwolf300.id, areaId: areaOyM.id, tipoCombustible: "GASOLINA", cantidad: 17, lecturaMedidor: null, solicitanteId: solicitanteOyM.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:20:00") },
      { equipoId: motoguadana.id, areaId: areaSP.id, tipoCombustible: "GASOLINA", cantidad: 4, lecturaMedidor: null, solicitanteId: bodega.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:25:00") },
      { equipoId: camionHino.id, areaId: areaSP.id, tipoCombustible: "DIESEL", cantidad: 48.9, lecturaMedidor: null, solicitanteId: bodega.id, bodegueroId: bodega.id, fecha: new Date("2026-08-03T11:30:00") },
    ];

    await registrarSalidas(salidas3);
  }

  // --- Correcciones puntuales pedidas por el usuario ---
  await db.movimientoInventario.deleteMany({
    where: { numeroFactura: "N5550" },
  });
  await db.movimientoInventario.updateMany({
    where: { numeroFactura: "254189", proveedor: null },
    data: { proveedor: "Agroservicios Nagarote" },
  });

  console.log("Seed completado.");
  console.log({
    admin: admin.email,
    bodega: bodega.email,
    solicitanteOyM: solicitanteOyM.email,
    solicitanteSS: solicitanteSS.email,
    solicitanteSP: solicitanteSP.email,
    consultaWalkiria: consultaWalkiria.email,
    consultaMiguel: consultaMiguel.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
