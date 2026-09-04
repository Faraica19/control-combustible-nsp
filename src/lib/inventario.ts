import { db } from "@/lib/db";
import type { TipoCombustible } from "@/generated/prisma/enums";

export async function getSaldos(): Promise<Record<TipoCombustible, number>> {
  const movimientos = await db.movimientoInventario.groupBy({
    by: ["tipoCombustible", "tipo"],
    _sum: { cantidad: true },
  });

  const saldos: Record<string, number> = { DIESEL: 0, GASOLINA: 0 };
  for (const m of movimientos) {
    const cantidad = m._sum.cantidad ?? 0;
    const signo = m.tipo === "ENTRADA" ? 1 : -1;
    saldos[m.tipoCombustible] += signo * cantidad;
  }
  for (const tipo of Object.keys(saldos)) {
    saldos[tipo] = Math.round(saldos[tipo] * 1000) / 1000;
  }
  return saldos as Record<TipoCombustible, number>;
}

export async function getSaldo(tipoCombustible: TipoCombustible) {
  const saldos = await getSaldos();
  return saldos[tipoCombustible];
}

export type CostoPromedio = { cordobas: number | null; usd: number | null };

export async function getCostoPromedio(): Promise<
  Record<TipoCombustible, CostoPromedio>
> {
  const [entradasCordobas, entradasUsd] = await Promise.all([
    db.movimientoInventario.groupBy({
      by: ["tipoCombustible"],
      where: { tipo: "ENTRADA", costo: { not: null } },
      _sum: { cantidad: true, costo: true },
    }),
    db.movimientoInventario.groupBy({
      by: ["tipoCombustible"],
      where: { tipo: "ENTRADA", costoUSD: { not: null } },
      _sum: { cantidad: true, costoUSD: true },
    }),
  ]);

  const promedio: Record<string, CostoPromedio> = {
    DIESEL: { cordobas: null, usd: null },
    GASOLINA: { cordobas: null, usd: null },
  };

  for (const e of entradasCordobas) {
    const cantidad = e._sum.cantidad ?? 0;
    const costo = e._sum.costo ?? 0;
    promedio[e.tipoCombustible].cordobas = cantidad > 0 ? costo / cantidad : null;
  }
  for (const e of entradasUsd) {
    const cantidad = e._sum.cantidad ?? 0;
    const costoUSD = e._sum.costoUSD ?? 0;
    promedio[e.tipoCombustible].usd = cantidad > 0 ? costoUSD / cantidad : null;
  }

  return promedio as Record<TipoCombustible, CostoPromedio>;
}
