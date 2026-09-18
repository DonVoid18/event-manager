import { ReportRow } from "@/features/reportes/domain/ReportRow";

const INVITATION_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CONFIRMADA: "Confirmada",
};

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportReportToCsv(rows: ReportRow[], tipo: "REGISTRO" | "INVITACIONES" | "CHECKIN") {
  const headers =
    tipo === "CHECKIN"
      ? ["Evento", "Código", "Nombre", "Documento", "Correo", "Ingreso registrado"]
      : tipo === "INVITACIONES"
        ? ["Evento", "Código", "Nombre", "Documento", "Correo", "Estado invitación", "Fecha de envío"]
        : ["Evento", "Código", "Nombre", "Documento", "Correo", "Tipo evento", "Fecha de registro"];

  const dataRows = rows.map((row) => {
    const nombre = `${row.firstName} ${row.lastName}`;
    if (tipo === "CHECKIN") {
      return [
        row.eventName,
        row.eventCode,
        nombre,
        row.documentId,
        row.email,
        row.checkedInAt ? new Date(row.checkedInAt).toLocaleString("es-PE") : "Sin ingreso",
      ];
    }
    if (tipo === "INVITACIONES") {
      return [
        row.eventName,
        row.eventCode,
        nombre,
        row.documentId,
        row.email,
        row.invitationStatus ? INVITATION_LABELS[row.invitationStatus] : "Sin invitación",
        row.invitationSentAt ? new Date(row.invitationSentAt).toLocaleString("es-PE") : "-",
      ];
    }
    return [
      row.eventName,
      row.eventCode,
      nombre,
      row.documentId,
      row.email,
      row.eventType === "PAGO" ? "De pago" : "Gratuito",
      new Date(row.registeredAt).toLocaleString("es-PE"),
    ];
  });

  const csvContent = [headers, ...dataRows]
    .map((line) => line.map((cell) => escapeCsvValue(String(cell))).join(","))
    .join("\n");

  const blob = new Blob([`﻿${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-${tipo.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
