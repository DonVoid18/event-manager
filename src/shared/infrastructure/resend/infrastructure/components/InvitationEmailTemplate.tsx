interface InvitationEmailTemplateProps {
  attendeeName: string;
  eventName: string;
  eventDateLabel: string;
  invitationCode: string;
}

export function InvitationEmailTemplate({
  attendeeName,
  eventName,
  eventDateLabel,
  invitationCode,
}: InvitationEmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9fafb",
        padding: "20px",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            textAlign: "center",
            marginBottom: "20px",
            color: "#2563eb",
          }}
        >
          🎉 Invitación a {eventName}
        </h1>

        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
          ¡Hola <strong>{attendeeName}</strong>!
        </p>
        <p style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "20px" }}>
          Confirmamos tu registro para <strong>{eventName}</strong>, el{" "}
          <strong>{eventDateLabel}</strong>. Presenta el siguiente código el día del evento para
          realizar tu check-in:
        </p>

        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f3f4f6",
            padding: "15px",
            borderRadius: "6px",
            fontSize: "22px",
            fontWeight: "bold",
            letterSpacing: "2px",
            color: "#111827",
            marginBottom: "20px",
          }}
        >
          {invitationCode}
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
      </div>
    </div>
  );
}
