import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import { getSaldos, getCostoPromedio } from "@/lib/inventario";
import { generarExcelMultihoja, respuestaExcel } from "@/lib/excel";
import { formatFechaCorta, formatHora } from "@/lib/fecha";

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
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Hora", key: "hora", width: 12 },
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad (L)", key: "cantidad", width: 14 },
        { header: "Número de factura", key: "factura", width: 20 },
        { header: "Costo (C$)", key: "costo", width: 14 },
        { header: "Costo (US$)", key: "costoUSD", width: 14 },
        { header: "Proveedor", key: "proveedor", width: 35 },
        { header: "Registrado por", key: "usuario", width: 20 },
      ],
      filas: entradas.map((m) => ({
        fecha: formatFechaCorta(m.fecha),
        hora: formatHora(m.fecha),
        combustible: m.tipoCombustible,
        cantidad: m.cantidad,
        factura: m.numeroFactura ?? "",
        costo: m.costo ?? "",
        costoUSD: m.costoUSD ?? "",
        proveedor: m.proveedor ?? "",
        usuario: m.usuario.nombre,
      })),
    },
    {
      nombre: "Salidas",
      columnas: [
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Hora", key: "hora", width: 12 },
        { header: "Código equipo", key: "codigoEquipo", width: 16 },
        { header: "Equipo", key: "equipo", width: 28 },
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad (L)", key: "cantidad", width: 14 },
        { header: "Valor estimado (C$)", key: "valor", width: 18 },
        { header: "Valor estimado (US$)", key: "valorUSD", width: 18 },
        { header: "Folio solicitud", key: "folio", width: 14 },
        { header: "Despachado por", key: "usuario", width: 20 },
      ],
      filas: salidas.map((m) => {
        const costoCordobas = costoPromedio[m.tipoCombustible].cordobas;
        const costoUsd = costoPromedio[m.tipoCombustible].usd;
        return {
          fecha: formatFechaCorta(m.fecha),
          hora: formatHora(m.fecha),
          codigoEquipo: m.solicitud?.equipo.codigo ?? "",
          equipo: m.solicitud?.equipo.nombre ?? "",
          combustible: m.tipoCombustible,
          cantidad: m.cantidad,
          valor:
            costoCordobas != null
              ? Number((m.cantidad * costoCordobas).toFixed(2))
              : "",
          valorUSD:
            costoUsd != null ? Number((m.cantidad * costoUsd).toFixed(2)) : "",
          folio: m.solicitud ? m.solicitud.id : "",
          usuario: m.usuario.nombre,
        };
      }),
    },
    {
      nombre: "Stock actual",
      columnas: [
        { header: "Combustible", key: "combustible", width: 14 },
        { header: "Cantidad en stock (L)", key: "cantidad", width: 20 },
        { header: "Costo promedio (C$/L)", key: "costoPromedioCordobas", width: 20 },
        { header: "Costo promedio (US$/L)", key: "costoPromedioUsd", width: 20 },
        { header: "Valor total en stock (C$)", key: "valorTotalCordobas", width: 22 },
        { header: "Valor total en stock (US$)", key: "valorTotalUsd", width: 22 },
      ],
      filas: (["DIESEL", "GASOLINA"] as const).map((tipo) => {
        const costoCordobas = costoPromedio[tipo].cordobas;
        const costoUsd = costoPromedio[tipo].usd;
        return {
          combustible: tipo,
          cantidad: saldos[tipo],
          costoPromedioCordobas: costoCordobas ?? "",
          costoPromedioUsd: costoUsd ?? "",
          valorTotalCordobas:
            costoCordobas != null
              ? Number((saldos[tipo] * costoCordobas).toFixed(2))
              : "",
          valorTotalUsd:
            costoUsd != null ? Number((saldos[tipo] * costoUsd).toFixed(2)) : "",
        };
      }),
    },
  ]);

  return respuestaExcel(buffer, "inventario.xlsx");
}
