import { db } from "@/lib/db";
import { requireRol } from "@/lib/permisos";
import { crearUsuario, toggleActivoUsuario, crearArea } from "./actions";

const ETIQUETA_ROL: Record<string, string> = {
  SOLICITANTE: "Solicitante",
  BODEGA: "Bodega",
  ADMIN: "Administrador",
  CONSULTA: "Consulta",
};

export default async function UsuariosPage() {
  await requireRol("ADMIN");

  const [usuarios, areas] = await Promise.all([
    db.user.findMany({ include: { area: true }, orderBy: { nombre: "asc" } }),
    db.area.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Usuarios</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Perfil</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">{u.nombre}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{ETIQUETA_ROL[u.rol] ?? u.rol}</td>
                <td className="px-3 py-2">{u.perfilSolicitante ?? "—"}</td>
                <td className="px-3 py-2">{u.area.nombre}</td>
                <td className="px-3 py-2">{u.activo ? "Activo" : "Inactivo"}</td>
                <td className="px-3 py-2">
                  <form action={toggleActivoUsuario.bind(null, u.id, u.activo)}>
                    <button className="text-zinc-600 underline hover:text-zinc-900">
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            Crear nuevo usuario
          </h2>
          <form
            action={crearUsuario}
            className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                required
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rol" className="text-sm font-medium text-zinc-700">
                Rol
              </label>
              <select
                id="rol"
                name="rol"
                required
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="SOLICITANTE">Solicitante</option>
                <option value="BODEGA">Bodega</option>
                <option value="ADMIN">Administrador</option>
                <option value="CONSULTA">Consulta (solo ver inventario)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="perfilSolicitante"
                className="text-sm font-medium text-zinc-700"
              >
                Perfil de solicitante (solo si el rol es Solicitante)
              </label>
              <select
                id="perfilSolicitante"
                name="perfilSolicitante"
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="CAPA">Capa</option>
                <option value="AYUDANTE">Ayudante</option>
                <option value="OPERADOR">Operador</option>
                <option value="SEGURIDAD">Seguridad</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="areaId" className="text-sm font-medium text-zinc-700">
                Área
              </label>
              <select
                id="areaId"
                name="areaId"
                required
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Crear usuario
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            Áreas registradas
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6">
            <ul className="flex flex-col gap-1 text-sm text-zinc-700">
              {areas.map((a) => (
                <li key={a.id}>{a.nombre}</li>
              ))}
            </ul>
            <form action={crearArea} className="flex gap-2">
              <input
                name="nombreArea"
                placeholder="Nueva área"
                required
                className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Agregar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
