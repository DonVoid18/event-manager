import { REPORT_TIPOS, type ReportFilters, type ReportTipo } from "@/features/reportes/domain/ReportRow";

export interface RawReportParams {
  eventId?: string | null;
  from?: string | null;
  to?: string | null;
  tipo?: string | null;
  tipoEvento?: string | null;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Normaliza los filtros recibidos por URL para reportes, impresión y exportación. */
export function parseReportParams(params: RawReportParams): { filters: ReportFilters; tipo: ReportTipo; query: string } {
  const tipo = REPORT_TIPOS.includes(params.tipo as ReportTipo) ? (params.tipo as ReportTipo) : "REGISTRO";
  const filters: ReportFilters = {
    eventId: params.eventId || undefined,
    from: params.from && DATE_PATTERN.test(params.from) ? params.from : undefined,
    to: params.to && DATE_PATTERN.test(params.to) ? params.to : undefined,
    eventType: params.tipoEvento === "GRATUITO" || params.tipoEvento === "PAGO" ? params.tipoEvento : undefined,
  };

  const search = new URLSearchParams();
  if (filters.eventId) search.set("eventId", filters.eventId);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.eventType) search.set("tipoEvento", filters.eventType);
  search.set("tipo", tipo);

  return { filters, tipo, query: search.toString() };
}
