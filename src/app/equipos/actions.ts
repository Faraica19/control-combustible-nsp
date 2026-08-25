"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import type { TipoCombustible, TipoMedidor } from "@/generated/prisma/enums";

export async function crearEquipo(formData: FormData) {
  await requireRol("ADMIN", "BODEGA");

  const codigo = String(formData.get("codigo") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const tipoMedidor = String(formData.get("tipoMedidor") ?? "") as TipoMedidor;
  const tipoCombustible = String(
    formData.get("tipoCombustible") ?? "",
  ) as TipoCombustible;
  const lecturaActual = Number(formData.get("lecturaActual"));
  const areaId = String(formData.get("areaId") ?? "");

  if (!codigo || !nombre || !tipo || !areaId) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (!["ODOMETRO", "HOROMETRO"].includes(tipoMedidor)) {
    throw new Error("Tipo de medidor inválido.");
  }
  if (!["DIESEL", "GASOLINA"].includes(tipoCombustible)) {
    throw new Error("Tipo de combustible inválido.");
  }
  if (Number.isNaN(lecturaActual) || lecturaActual < 0) {
    throw new Error("Lectura inicial inválida.");
  }

  await db.equipo.create({
    data: { codigo, nombre, tipo, tipoMedidor, tipoCombustible, lecturaActual, areaId },
  });

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function toggleActivoEquipo(id: string, activo: boolean) {
  await requireRol("ADMIN", "BODEGA");
  await db.equipo.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/equipos");
  redirect("/equipos");
}
