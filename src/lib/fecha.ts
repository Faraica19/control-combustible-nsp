const ZONA_HORARIA = "America/Managua";

export function formatFecha(fecha: Date): string {
  return fecha.toLocaleString("es", { timeZone: ZONA_HORARIA });
}

export function formatFechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es", { timeZone: ZONA_HORARIA });
}

export function formatHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es", { timeZone: ZONA_HORARIA });
}

/** Valor para un <input type="datetime-local"> mostrando la hora de Nicaragua. */
export function paraInputFechaLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fecha);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Interpreta un valor de <input type="datetime-local"> como hora de Nicaragua (UTC-6, sin horario de verano). */
export function parseFechaLocal(valor: string): Date {
  return new Date(`${valor}:00-06:00`);
}
