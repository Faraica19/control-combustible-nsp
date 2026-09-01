import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import { getSaldos, getCostoPromedio } from "@/lib/inventario";
import { generarExcelMultihoja, respuestaExcel } from "@/lib/excel";

export async function GET() {
  await requireRol("BODEGA", "ADMIN", "CONSULTA");

  const [movimientos, saldos, costoPromedio] = await Promise.all([
    db.movimientoInventario.findMany({
      include: { usuario: true, solicitud: { include: { equipo: true } } },
      orderBy: { fecha: "desc" },
    }),
    getSaldos(),
    getCostoPromedio(),
  ]);

  const entradas = movimientos.filter((m) => m.tipo === "ENTRADA");
  const salidas = movimientos.filter((m) => m.tipo === "SALIDA");

  const buffer = await generarExcelMultihoja([
    {
      nombre: "Entradas",
      columnas: [
        { header: "Fecha", key: "fecha", width: 20 },
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad (L)", key: "cantidad", width: 14 },
        { header: "Número de factura", key: "factura", width: 20 },
        { header: "Costo (C$)", key: "costo", width: 14 },
        { header: "Proveedor", key: "proveedor", width: 35 },
        { header: "Registrado por", key: "usuario", width: 20 },
      ],
      filas: entradas.map((m) => ({
        fecha: m.fecha.toLocaleString("es"),
        combustible: m.tipoCombustible,
        cantidad: m.cantidad,
        factura: m.numeroFactura ?? "",
        costo: m.costo ?? "",
        proveedor: m.proveedor ?? "",
        usuario: m.usuario.nombre,
      })),
    },
    {
      nombre: "Salidas",
      columnas: [
        { header: "Fecha", key: "fecha", width: 20 },
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad (L)", key: "cantidad", width: 14 },
        { header: "Valor estimado (C$)", key: "valor", width: 18 },
        { header: "Solicitud", key: "solicitud", width: 30 },
        { header: "Despachado por", key: "usuario", width: 20 },
      ],
      filas: salidas.map((m) => {
        const costoUnitario = costoPromedio[m.tipoCombustible];
        return {
          fecha: m.fecha.toLocaleString("es"),
          combustible: m.tipoCombustible,
          cantidad: m.cantidad,
          valor:
            costoUnitario != null
              ? Number((m.cantidad * costoUnitario).toFixed(2))
              : "",
          solicitud: m.solicitud
            ? `#${m.solicitud.id} (${m.solicitud.equipo.nombre})`
            : "",
          usuario: m.usuario.nombre,
        };
      }),
    },
    {
      nombre: "Stock actual",
      columnas: [
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad en stock (L)", key: "cantidad", width: 20 },
        { header: "Costo promedio (C$/L)", key: "costoPromedio", width: 20 },
        { header: "Valor total en stock (C$)", key: "valorTotal", width: 22 },
      ],
      filas: (["DIESEL", "GASOLINA"] as const).map((tipo) => {
        const costoUnitario = costoPromedio[tipo];
        return {
          combustible: tipo,
          cantidad: saldos[tipo],
          costoPromedio: costoUnitario ?? "",
          valorTotal:
            costoUnitario != null
              ? Number((saldos[tipo] * costoUnitario).toFixed(2))
              : "",
        };
      }),
    },
  ]);

  return respuestaExcel(buffer, "inventario.xlsx");
}
