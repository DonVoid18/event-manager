import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

import { getReportData } from "@/features/reportes/infrastructure/queries/getReportData";
import { parseReportParams } from "@/features/reportes/infrastructure/utils/parseReportParams";
import { auth } from "@/shared/infrastructure/libs/auth";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIPO_LABELS = {
  REGISTRO: "Registro de asistentes",
  INVITACIONES: "Invitaciones",
  CHECKIN: "Check-in",
} as const;

const INVITATION_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CONFIRMADA: "Confirmada",
};

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0369A1" } };

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle" };
  row.height = 22;
}

/** Exporta el reporte filtrado a un libro de Excel (.xlsx) con resumen, detalle por evento y registros. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user.isActive) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const { filters, tipo } = parseReportParams({
    eventId: sp.get("eventId"),
    from: sp.get("from"),
    to: sp.get("to"),
    tipo: sp.get("tipo"),
    tipoEvento: sp.get("tipoEvento"),
  });

  try {
    const { rows, summary, byEvent } = await getReportData(filters);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TUMITECH S.A.C.";
    workbook.created = new Date();

    const resumen = workbook.addWorksheet("Resumen");
    resumen.columns = [{ width: 34 }, { width: 18 }];
    resumen.addRow(["TUMITECH S.A.C. — Reporte de gestión de eventos"]).font = { bold: true, size: 14 };
    resumen.addRow([`Tipo de reporte: ${TIPO_LABELS[tipo]}`]);
    resumen.addRow([`Generado: ${new Date().toLocaleString("es-PE")}`]);
    resumen.addRow([]);
    styleHeader(resumen.addRow(["Indicador", "Valor"]));
    resumen.addRows([
      ["Eventos", summary.totalEventos],
      ["Asistentes registrados", summary.totalAsistentes],
      ["Invitaciones enviadas", summary.invitacionesEnviadas],
      ["Invitaciones confirmadas", summary.invitacionesConfirmadas],
      ["Check-ins realizados", summary.totalCheckins],
      ["Tasa de asistencia", summary.tasaConfirmacion],
      ["Incidencias registradas", summary.totalIncidencias],
    ]);
    resumen.getCell("B11").numFmt = "0.0%";

    const eventos = workbook.addWorksheet("Por evento");
    eventos.columns = [
      { header: "Código", key: "code", width: 14 },
      { header: "Evento", key: "name", width: 44 },
      { header: "Fecha", key: "date", width: 18 },
      { header: "Aforo", key: "capacity", width: 10 },
      { header: "Registrados", key: "registrados", width: 13 },
      { header: "Invitados", key: "invitados", width: 12 },
      { header: "Asistieron", key: "asistentes", width: 12 },
      { header: "Asistencia", key: "tasa", width: 12 },
      { header: "Incidencias", key: "incidencias", width: 12 },
    ];
    styleHeader(eventos.getRow(1));
    byEvent.forEach((e) =>
      eventos.addRow({
        code: e.eventCode,
        name: e.eventName,
        date: new Date(e.eventDate),
        capacity: e.capacity,
        registrados: e.registrados,
        invitados: e.invitados,
        asistentes: e.asistentes,
        tasa: e.registrados ? e.asistentes / e.registrados : 0,
        incidencias: e.incidencias,
      })
    );
    eventos.getColumn("date").numFmt = "dd/mm/yyyy hh:mm";
    eventos.getColumn("tasa").numFmt = "0.0%";

    const detalle = workbook.addWorksheet(TIPO_LABELS[tipo]);
    const displayRows = tipo === "CHECKIN" ? rows.filter((r) => r.checkedInAt) : rows;
    detalle.columns = [
      { header: "Evento", key: "evento", width: 40 },
      { header: "Código", key: "codigo", width: 14 },
      { header: "Asistente", key: "asistente", width: 30 },
      { header: "Documento", key: "documento", width: 14 },
      { header: "Correo", key: "correo", width: 32 },
      ...(tipo === "REGISTRO"
        ? [{ header: "Tipo de evento", key: "tipoEvento", width: 14 }, { header: "Fecha de registro", key: "fecha", width: 20 }]
        : tipo === "INVITACIONES"
          ? [{ header: "Estado de invitación", key: "estado", width: 20 }, { header: "Fecha de envío", key: "fecha", width: 20 }]
          : [{ header: "Hora de ingreso", key: "fecha", width: 20 }]),
    ];
    styleHeader(detalle.getRow(1));
    displayRows.forEach((r) =>
      detalle.addRow({
        evento: r.eventName,
        codigo: r.eventCode,
        asistente: `${r.firstName} ${r.lastName}`,
        documento: r.documentId,
        correo: r.email,
        tipoEvento: r.eventType === "PAGO" ? "De pago" : "Gratuito",
        estado: r.invitationStatus ? INVITATION_LABELS[r.invitationStatus] : "Sin invitación",
        fecha:
          tipo === "REGISTRO"
            ? new Date(r.registeredAt)
            : tipo === "INVITACIONES"
              ? (r.invitationSentAt ? new Date(r.invitationSentAt) : null)
              : (r.checkedInAt ? new Date(r.checkedInAt) : null),
      })
    );
    detalle.getColumn("fecha").numFmt = "dd/mm/yyyy hh:mm";
    detalle.views = [{ state: "frozen", ySplit: 1 }];
    eventos.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `reporte-${tipo.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await logServerError({
      error,
      event: "reportes.excel.failed",
      feature: "reportes",
      operation: "export_excel",
    });
    return new NextResponse("No se pudo generar el reporte.", { status: 500 });
  }
}
