"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import type { TipoCombustible } from "@/generated/prisma/enums";

export async function registrarEntrada(formData: FormData) {
  const session = await requireRol("BODEGA", "ADMIN");

  const tipoCombustible = String(
    formData.get("tipoCombustible") ?? "",
  ) as TipoCombustible;
  const cantidad = Number(formData.get("cantidad"));
  const numeroFactura = String(formData.get("numeroFactura") ?? "").trim();
  const proveedor = String(formData.get("proveedor") ?? "").trim();
  const costoRaw = String(formData.get("costo") ?? "").trim();
  const costo = costoRaw ? Number(costoRaw) : null;
  const costoUSDRaw = String(formData.get("costoUSD") ?? "").trim();
  const costoUSD = costoUSDRaw ? Number(costoUSDRaw) : null;

  if (!["DIESEL", "GASOLINA"].includes(tipoCombustible) || !(cantidad > 0)) {
    throw new Error("Datos de inventario inválidos.");
  }
  if (!numeroFactura) {
    throw new Error("El número de factura es obligatorio.");
  }
  if (costo != null && (Number.isNaN(costo) || costo < 0)) {
    throw new Error("El costo en córdobas no es válido.");
  }
  if (costoUSD != null && (Number.isNaN(costoUSD) || costoUSD < 0)) {
    throw new Error("El costo en dólares no es válido.");
  }

  await db.movimientoInventario.create({
    data: {
      tipo: "ENTRADA",
      tipoCombustible,
      cantidad,
      numeroFactura,
      costo,
      costoUSD,
      proveedor: proveedor || null,
      usuarioId: session.user.id,
    },
  });

  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function editarFechaMovimiento(id: string, formData: FormData) {
  await requireRol("ADMIN");

  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  if (!fechaRaw) throw new Error("Fecha inválida.");
  const fecha = new Date(fechaRaw);
  if (Number.isNaN(fecha.getTime())) throw new Error("Fecha inválida.");

  const movimiento = await db.movimientoInventario.findUnique({ where: { id } });
  if (!movimiento) throw new Error("Movimiento no encontrado.");

  await db.movimientoInventario.update({ where: { id }, data: { fecha } });

  if (movimiento.solicitudId) {
    await db.solicitud.update({
      where: { id: movimiento.solicitudId },
      data: { fechaDespacho: fecha },
    });
  }

  revalidatePath("/inventario");
  revalidatePath("/solicitudes");
}

export async function eliminarEntrada(id: string) {
  await requireRol("ADMIN");

  const movimiento = await db.movimientoInventario.findUnique({ where: { id } });
  if (!movimiento) throw new Error("Movimiento no encontrado.");
  if (movimiento.tipo !== "ENTRADA") {
    throw new Error("Solo se pueden eliminar entradas, no despachos.");
  }

  await db.movimientoInventario.delete({ where: { id } });
  revalidatePath("/inventario");
}
