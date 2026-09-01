"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import type { MaterialLlanta, TipoTrabajo } from "@/generated/prisma/enums";

export async function crearSolicitudTrabajo(formData: FormData) {
  const session = await requireRol("SOLICITANTE", "BODEGA", "ADMIN");

  const tipo = String(formData.get("tipo") ?? "") as TipoTrabajo;
  const equipoId = String(formData.get("equipoId") ?? "");
  const esPonchadura = formData.get("esPonchadura") === "on";
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!["MANTENIMIENTO", "REPARACION_LLANTA"].includes(tipo) || !equipoId) {
    throw new Error("Datos de la solicitud inválidos.");
  }

  const equipo = await db.equipo.findUnique({ where: { id: equipoId } });
  if (!equipo || !equipo.activo) throw new Error("Equipo no válido.");

  await db.solicitudTrabajo.create({
    data: {
      tipo,
      equipoId,
      solicitanteId: session.user.id,
      areaId: session.user.areaId,
      esPonchadura: tipo === "REPARACION_LLANTA" ? esPonchadura : false,
      descripcion: descripcion || null,
    },
  });

  revalidatePath("/mantenimiento");
  redirect("/mantenimiento");
}

async function cargarSolicitudTrabajo(id: number) {
  const solicitud = await db.solicitudTrabajo.findUnique({ where: { id } });
  if (!solicitud) throw new Error("Solicitud no encontrada.");
  return solicitud;
}

export async function aprobarYCompletarTrabajo(id: number, formData: FormData) {
  const session = await requireRol("BODEGA", "ADMIN");
  const solicitud = await cargarSolicitudTrabajo(id);

  if (solicitud.estado !== "PENDIENTE") {
    throw new Error("La solicitud ya no está pendiente.");
  }

  const materialesUsados = formData
    .getAll("materialesUsados")
    .map((v) => String(v)) as MaterialLlanta[];
  const horasTrabajoRaw = String(formData.get("horasTrabajo") ?? "").trim();
  const horasTrabajo = horasTrabajoRaw ? Number(horasTrabajoRaw) : null;
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (horasTrabajo != null && (Number.isNaN(horasTrabajo) || horasTrabajo < 0)) {
    throw new Error("Las horas de trabajo no son válidas.");
  }

  await db.solicitudTrabajo.update({
    where: { id },
    data: {
      estado: "COMPLETADA",
      bodegueroId: session.user.id,
      materialesUsados,
      horasTrabajo,
      comentario: comentario || null,
      fechaResolucion: new Date(),
    },
  });

  revalidatePath(`/mantenimiento/${id}`);
  revalidatePath("/mantenimiento");
  redirect(`/mantenimiento/${id}`);
}

export async function rechazarTrabajo(id: number, formData: FormData) {
  const session = await requireRol("BODEGA", "ADMIN");
  const solicitud = await cargarSolicitudTrabajo(id);
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (solicitud.estado !== "PENDIENTE") {
    throw new Error("La solicitud ya no está pendiente.");
  }
  if (!comentario) throw new Error("Debe indicar un motivo de rechazo.");

  await db.solicitudTrabajo.update({
    where: { id },
    data: {
      estado: "RECHAZADA",
      bodegueroId: session.user.id,
      comentario,
      fechaResolucion: new Date(),
    },
  });

  revalidatePath(`/mantenimiento/${id}`);
  revalidatePath("/mantenimiento");
  redirect(`/mantenimiento/${id}`);
}
