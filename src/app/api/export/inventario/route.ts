import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import { generarExcel, respuestaExcel } from "@/lib/excel";

export async function GET() {
  await requireRol("BODEGA", "ADMIN", "CONSULTA");

  const movimientos = await db.movimientoInventario.findMany({
    include: { usuario: true, solicitud: { include: { equipo: true } } },
    orderBy: { fecha: "desc" },
  });

  const buffer = await generarExcel(
    "Inventario",
    [
      { header: "Fecha", key: "fecha", width: 20 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Combustible", key: "combustible", width: 14 },
      { header: "Cantidad", key: "cantidad", width: 12 },
      { header: "Número de factura", key: "factura", width: 20 },
      { header: "Costo (C$)", key: "costo", width: 14 },
      { header: "Proveedor / Solicitud", key: "origen", width: 35 },
      { header: "Registrado por", key: "usuario", width: 20 },
    ],
    movimientos.map((m) => ({
      fecha: m.fecha.toLocaleString("es"),
      tipo: m.tipo === "ENTRADA" ? "Entrada" : "Salida",
      combustible: m.tipoCombustible,
      cantidad: m.tipo === "ENTRADA" ? m.cantidad : -m.cantidad,
      factura: m.numeroFactura ?? "",
      costo: m.costo ?? "",
      origen: m.solicitud
        ? `Solicitud #${m.solicitud.id} (${m.solicitud.equipo.nombre})`
        : (m.proveedor ?? ""),
      usuario: m.usuario.nombre,
    })),
  );

  return respuestaExcel(buffer, "inventario.xlsx");
}
