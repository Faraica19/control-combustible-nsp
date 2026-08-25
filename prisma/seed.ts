import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 10);
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

  const equipos: {
    codigo: string;
    nombre: string;
    tipo: string;
    tipoMedidor: "ODOMETRO" | "HOROMETRO";
    tipoCombustible: "DIESEL" | "GASOLINA";
    lecturaActual: number;
    areaId: string;
  }[] = [
    // Diésel
    {
      codigo: "EQ-001",
      nombre: "Camión Hino",
      tipo: "Camión",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "DIESEL",
      lecturaActual: 45000,
      areaId: areaOyM.id,
    },
    {
      codigo: "EQ-002",
      nombre: "Cisterna",
      tipo: "Camión cisterna",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "DIESEL",
      lecturaActual: 38000,
      areaId: areaOyM.id,
    },
    {
      codigo: "EQ-003",
      nombre: "Camioneta Isuzu",
      tipo: "Camioneta",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "DIESEL",
      lecturaActual: 62000,
      areaId: areaOyM.id,
    },
    {
      codigo: "EQ-004",
      nombre: "Tractor MF 6712",
      tipo: "Tractor",
      tipoMedidor: "HOROMETRO",
      tipoCombustible: "DIESEL",
      lecturaActual: 1800,
      areaId: areaOyM.id,
    },
    {
      codigo: "EQ-007",
      nombre: "Generador Kholer",
      tipo: "Generador",
      tipoMedidor: "HOROMETRO",
      tipoCombustible: "DIESEL",
      lecturaActual: 1500,
      areaId: areaSP.id,
    },
    // Gasolina
    {
      codigo: "EQ-005",
      nombre: "Motoguadaña",
      tipo: "Herramienta",
      tipoMedidor: "HOROMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 320,
      areaId: areaSP.id,
    },
    {
      codigo: "EQ-006",
      nombre: "Generador 220",
      tipo: "Planta eléctrica",
      tipoMedidor: "HOROMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 2400,
      areaId: areaSP.id,
    },
    {
      codigo: "EQ-008",
      nombre: "XWolf 300",
      tipo: "Motocicleta",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 8000,
      areaId: areaSS.id,
    },
    {
      codigo: "EQ-009",
      nombre: "XWolf 550",
      tipo: "Motocicleta",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 6500,
      areaId: areaSS.id,
    },
    {
      codigo: "EQ-010",
      nombre: "MT YBR",
      tipo: "Motocicleta",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 12000,
      areaId: areaSS.id,
    },
    {
      codigo: "EQ-011",
      nombre: "MT SX1",
      tipo: "Motocicleta",
      tipoMedidor: "ODOMETRO",
      tipoCombustible: "GASOLINA",
      lecturaActual: 9500,
      areaId: areaSS.id,
    },
  ];

  for (const equipo of equipos) {
    await db.equipo.upsert({
      where: { codigo: equipo.codigo },
      update: {},
      create: equipo,
    });
  }

  const inventarioExistente = await db.movimientoInventario.count();
  if (inventarioExistente === 0) {
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "DIESEL",
        cantidad: 1000,
        costo: 55000,
        numeroFactura: "FAC-0001",
        proveedor: "Distribuidora de Combustibles S.A.",
        usuarioId: bodega.id,
      },
    });
    await db.movimientoInventario.create({
      data: {
        tipo: "ENTRADA",
        tipoCombustible: "GASOLINA",
        cantidad: 400,
        costo: 24000,
        numeroFactura: "FAC-0002",
        proveedor: "Distribuidora de Combustibles S.A.",
        usuarioId: bodega.id,
      },
    });
  }

  console.log("Seed completado.");
  console.log({
    admin: admin.email,
    bodega: bodega.email,
    solicitanteOyM: solicitanteOyM.email,
    solicitanteSS: solicitanteSS.email,
    solicitanteSP: solicitanteSP.email,
    consultaWalkiria: consultaWalkiria.email,
    consultaMiguel: consultaMiguel.email,
    equipos: equipos.map((e) => `${e.codigo} (${e.tipoCombustible})`).join(", "),
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
