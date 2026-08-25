"use client";

import { useActionState } from "react";
import { cambiarPassword } from "./actions";

export default function CambiarPasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="actual" className="text-sm font-medium text-zinc-700">
          Contraseña actual
        </label>
        <input
          id="actual"
          name="actual"
          type="password"
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva" className="text-sm font-medium text-zinc-700">
          Nueva contraseña
        </label>
        <input
          id="nueva"
          name="nueva"
          type="password"
          required
          minLength={6}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmar" className="text-sm font-medium text-zinc-700">
          Confirmar nueva contraseña
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          minLength={6}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-green-700">Contraseña actualizada correctamente.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
