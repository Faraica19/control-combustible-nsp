import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRol(...roles: string[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.rol)) redirect("/");
  return session;
}
