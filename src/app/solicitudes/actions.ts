"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import { getSaldo } from "@/lib/inventario";

export async function crearSolicitud(formData: FormData) {
  const session = await requireRol("SOLICITANTE", "BODEGA", "ADMIN");

  const equipoId = String(formData.get("equipoId") ?? "");
  const cantidadSolicitada = Number(formData.get("cantidadSolicitada"));
  const lecturaMedidorRaw = String(formData.get("lecturaMedidor") ?? "").trim();
  const lecturaMedidor = lecturaMedidorRaw ? Number(lecturaMedidorRaw) : null;

  if (!equipoId || !(cantidadSolicitada > 0)) {
    throw new Error("Datos de la solicitud inválidos.");
  }
  if (
    lecturaMedidor != null &&
    (Number.isNaN(lecturaMedidor) || lecturaMedidor < 0)
  ) {
    throw new Error("Lectura de odómetro/horómetro inválida.");
  }

  const equipo = await db.equipo.findUnique({ where: { id: equipoId } });
  if (!equipo || !equipo.activo) throw new Error("Equipo no válido.");
  if (equipo.requiereLectura && lecturaMedidor == null) {
    throw new Error("Este equipo requiere la lectura de odómetro/horómetro.");
  }

  await db.solicitud.create({
    data: {
      equipoId,
      solicitanteId: session.user.id,
      areaId: session.user.areaId,
      tipoCombustible: equipo.tipoCombustible,
      cantidadSolicitada,
      lecturaMedidor,
    },
  });

  revalidatePath("/solicitudes");
  redirect("/solicitudes");
}

async function cargarSolicitud(id: number) {
  const solicitud = await db.solicitud.findUnique({ where: { id } });
  if (!solicitud) throw new Error("Solicitud no encontrada.");
  return solicitud;
}

export async function despacharBodega(id: number, formData: FormData) {
  const session = await requireRol("BODEGA", "ADMIN");
  const solicitud = await cargarSolicitud(id);
  const cantidadDespachada = Number(formData.get("cantidadDespachada"));
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (solicitud.estado !== "PENDIENTE_BODEGA") {
    throw new Error("La solicitud ya no está pendiente de despacho.");
  }
  if (!(cantidadDespachada > 0)) {
    throw new Error("La cantidad despachada debe ser mayor a cero.");
  }

  const saldo = await getSaldo(solicitud.tipoCombustible);
  if (cantidadDespachada > saldo) {
    throw new Error(
      `Stock insuficiente. Inventario disponible: ${saldo} L de ${solicitud.tipoCombustible}.`,
    );
  }

  await db.$transaction([
    db.solicitud.update({
      where: { id },
      data: {
        estado: "DESPACHADA",
        cantidadDespachada,
        fechaDespacho: new Date(),
        bodegueroId: session.user.id,
        comentarioBodega: comentario || null,
      },
    }),
    db.movimientoInventario.create({
      data: {
        tipo: "SALIDA",
        tipoCombustible: solicitud.tipoCombustible,
        cantidad: cantidadDespachada,
        usuarioId: session.user.id,
        solicitudId: id,
      },
    }),
    ...(solicitud.lecturaMedidor != null
      ? [
          db.equipo.update({
            where: { id: solicitud.equipoId },
            data: { lecturaActual: solicitud.lecturaMedidor },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/solicitudes/${id}`);
  revalidatePath("/solicitudes");
  revalidatePath("/inventario");
  revalidatePath("/equipos");
  redirect(`/solicitudes/${id}`);
}

export async function rechazarBodega(id: number, formData: FormData) {
  const session = await requireRol("BODEGA", "ADMIN");
  const solicitud = await cargarSolicitud(id);
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (solicitud.estado !== "PENDIENTE_BODEGA") {
    throw new Error("La solicitud ya no está pendiente de despacho.");
  }
  if (!comentario) throw new Error("Debe indicar un motivo de rechazo.");

  await db.solicitud.update({
    where: { id },
    data: {
      estado: "RECHAZADA_BODEGA",
      bodegueroId: session.user.id,
      comentarioBodega: comentario,
    },
  });

  revalidatePath(`/solicitudes/${id}`);
  revalidatePath("/solicitudes");
  redirect(`/solicitudes/${id}`);
}
