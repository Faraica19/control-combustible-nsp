const ESTILOS: Record<string, string> = {
  PENDIENTE_BODEGA: "bg-amber-100 text-amber-800",
  DESPACHADA: "bg-green-100 text-green-800",
  RECHAZADA_BODEGA: "bg-red-100 text-red-800",
};

const ETIQUETAS: Record<string, string> = {
  PENDIENTE_BODEGA: "Pendiente bodega",
  DESPACHADA: "Despachada",
  RECHAZADA_BODEGA: "Rechazada",
};

export default function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        ESTILOS[estado] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
