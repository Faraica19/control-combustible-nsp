import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permisos";
import { getSaldos } from "@/lib/inventario";

export default async function DashboardPage() {
  const session = await requireSession();
  const { rol, id: userId, name } = session.user;

  if (rol === "CONSULTA") {
    const saldos = await getSaldos();
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-900">Hola, {name}</h1>
        <div className="grid grid-cols-2 gap-4">
          <Tarjeta titulo="Inventario diésel" valor={`${saldos.DIESEL} L`} />
          <Tarjeta titulo="Inventario gasolina" valor={`${saldos.GASOLINA} L`} />
        </div>
        <Link
          href="/inventario"
          className="w-fit text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Ver inventario y despachos
        </Link>
      </div>
    );
  }

  if (rol === "SOLICITANTE") {
    const pendientes = await db.solicitud.count({
      where: { solicitanteId: userId, estado: "PENDIENTE_BODEGA" },
    });
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-900">Hola, {name}</h1>
        <Tarjeta titulo="Tus solicitudes en trámite" valor={pendientes} />
        <Link
          href="/solicitudes/nueva"
          className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nueva solicitud
        </Link>
      </div>
    );
  }

  if (rol === "BODEGA") {
    const [pendientes, saldos] = await Promise.all([
      db.solicitud.count({ where: { estado: "PENDIENTE_BODEGA" } }),
      getSaldos(),
    ]);
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-zinc-900">Hola, {name}</h1>
        <div className="grid grid-cols-3 gap-4">
          <Tarjeta titulo="Pendientes de despacho" valor={pendientes} />
          <Tarjeta titulo="Inventario diésel" valor={`${saldos.DIESEL} L`} />
          <Tarjeta titulo="Inventario gasolina" valor={`${saldos.GASOLINA} L`} />
        </div>
        <Link
          href="/solicitudes/nueva"
          className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nueva solicitud
        </Link>
      </div>
    );
  }

  // ADMIN
  const [pendBodega, despachadas, saldos] = await Promise.all([
    db.solicitud.count({ where: { estado: "PENDIENTE_BODEGA" } }),
    db.solicitud.count({ where: { estado: "DESPACHADA" } }),
    getSaldos(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">Hola, {name}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tarjeta titulo="Pendientes de despacho" valor={pendBodega} />
        <Tarjeta titulo="Despachadas (total)" valor={despachadas} />
        <Tarjeta titulo="Inventario diésel" valor={`${saldos.DIESEL} L`} />
        <Tarjeta titulo="Inventario gasolina" valor={`${saldos.GASOLINA} L`} />
      </div>
      <div className="flex gap-4">
        <Link
          href="/solicitudes/nueva"
          className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nueva solicitud
        </Link>
        <Link
          href="/reportes"
          className="w-fit self-center text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Ver reporte de rendimiento
        </Link>
      </div>
    </div>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <p className="text-xs text-zinc-500">{titulo}</p>
      <p className="text-2xl font-semibold text-zinc-900">{valor}</p>
    </div>
  );
}
