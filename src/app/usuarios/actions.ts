"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRol } from "@/lib/permisos";
import { db } from "@/lib/db";
import type { PerfilSolicitante, Rol } from "@/generated/prisma/enums";

export async function crearUsuario(formData: FormData) {
  await requireRol("ADMIN");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = String(formData.get("rol") ?? "") as Rol;
  const perfilSolicitante = String(formData.get("perfilSolicitante") ?? "") as
    | PerfilSolicitante
    | "";
  const areaId = String(formData.get("areaId") ?? "");

  if (!nombre || !email || !areaId) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  if (!["SOLICITANTE", "BODEGA", "ADMIN", "CONSULTA"].includes(rol)) {
    throw new Error("Rol inválido.");
  }
  if (rol === "SOLICITANTE" && !perfilSolicitante) {
    throw new Error("Debe indicar el perfil del solicitante.");
  }

  const existente = await db.user.findUnique({ where: { email } });
  if (existente) throw new Error("Ya existe un usuario con ese correo.");

  await db.user.create({
    data: {
      nombre,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      rol,
      perfilSolicitante: rol === "SOLICITANTE" ? perfilSolicitante || null : null,
      areaId,
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function toggleActivoUsuario(id: string, activo: boolean) {
  await requireRol("ADMIN");
  await db.user.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function crearArea(formData: FormData) {
  await requireRol("ADMIN");
  const nombre = String(formData.get("nombreArea") ?? "").trim();
  if (!nombre) throw new Error("El nombre del área es obligatorio.");

  await db.area.upsert({
    where: { nombre },
    update: {},
    create: { nombre },
  });

  revalidatePath("/usuarios");
  revalidatePath("/equipos");
  redirect("/usuarios");
}
