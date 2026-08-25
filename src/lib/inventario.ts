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
  return saldos as Record<TipoCombustible, number>;
}

export async function getSaldo(tipoCombustible: TipoCombustible) {
  const saldos = await getSaldos();
  return saldos[tipoCombustible];
}

export async function getCostoPromedio(): Promise<
  Record<TipoCombustible, number | null>
> {
  const entradas = await db.movimientoInventario.groupBy({
    by: ["tipoCombustible"],
    where: { tipo: "ENTRADA", costo: { not: null } },
    _sum: { cantidad: true, costo: true },
  });

  const promedio: Record<string, number | null> = {
    DIESEL: null,
    GASOLINA: null,
  };
  for (const e of entradas) {
    const cantidad = e._sum.cantidad ?? 0;
    const costo = e._sum.costo ?? 0;
    promedio[e.tipoCombustible] = cantidad > 0 ? costo / cantidad : null;
  }
  return promedio as Record<TipoCombustible, number | null>;
}
