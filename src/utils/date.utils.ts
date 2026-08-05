import { appConfig } from "@/config";

const MONTHS_ES = [
  "ene.", "feb.", "mar.", "abr.", "may.", "jun.",
  "jul.", "ago.", "sep.", "oct.", "nov.", "dic.",
] as const;

function getDateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: appConfig.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  return {
    day: parseInt(value("day"), 10),
    month: parseInt(value("month"), 10) - 1,
    year: value("year"),
    hour24: parseInt(value("hour"), 10),
    minute: value("minute"),
  };
}

export function formatDate(iso: string): string {
  const { day, month, year, hour24, minute } = getDateParts(iso);
  const period = hour24 >= 12 ? "p. m." : "a. m.";
  const hour12 = hour24 % 12 || 12;
  return `${day} ${MONTHS_ES[month]} ${year}, ${hour12}:${minute} ${period}`;
}

export function formatShortDate(iso: string): string {
  const dateStr = iso.length === 7 ? `${iso}-01T12:00:00-05:00` : iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: appConfig.timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(dateStr));

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const month = parseInt(value("month"), 10) - 1;
  return `${MONTHS_ES[month]} ${value("year")}`;
}

export function formatDateOnly(iso: string): string {
  const dateStr = iso.length === 10 ? `${iso}T12:00:00-05:00` : iso;
  const { day, month, year } = getDateParts(dateStr);
  return `${day} ${MONTHS_ES[month]} ${year}`;
}

export function formatDateRange(inicio: string, fin: string): string {
  return `${formatDateOnly(inicio)} — ${formatDateOnly(fin)}`;
}

export function buildFechaMuestreo(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00-05:00`;
}

export function parseFechaMuestreo(iso: string): { fecha: string; hora: string } {
  const { day, month, year, hour24, minute } = getDateParts(iso);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const h = String(hour24).padStart(2, "0");
  return {
    fecha: `${year}-${m}-${d}`,
    hora: `${h}:${minute}`,
  };
}
