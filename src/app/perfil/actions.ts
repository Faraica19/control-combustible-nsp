"use server";

import bcrypt from "bcryptjs";
import { requireSession } from "@/lib/permisos";
import { db } from "@/lib/db";

export async function cambiarPassword(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const session = await requireSession();
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (nueva.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }
  if (nueva !== confirmar) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Usuario no encontrado." };

  const valido = await bcrypt.compare(actual, user.passwordHash);
  if (!valido) return { error: "La contraseña actual es incorrecta." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(nueva, 10) },
  });

  return { ok: true };
}
