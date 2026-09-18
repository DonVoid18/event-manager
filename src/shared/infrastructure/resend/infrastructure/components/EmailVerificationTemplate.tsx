interface EmailVerificationTemplateProps {
  userName: string;
  verificationCode: string;
}

export function EmailVerificationTemplate({
  userName,
  verificationCode,
}: EmailVerificationTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9fafb",
        padding: "20px",
        color: "#111827",
      }}
    >
      {/* Contenedor central */}
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
        {/* Header */}
        <h1
          style={{
            fontSize: "22px",
            textAlign: "center",
            marginBottom: "20px",
            color: "#2563eb",
          }}
        >
          🔒 Verificación de Correo Electrónico
        </h1>

        {/* Saludo */}
        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
          ¡Hola <strong>{userName}</strong>!
        </p>
        <p
          style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "20px" }}
        >
          Gracias por registrarte. Para completar la verificación de tu cuenta,
          introduce el siguiente código:
        </p>

        {/* Código */}
        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f3f4f6",
            padding: "15px",
            borderRadius: "6px",
            fontSize: "24px",
            fontWeight: "bold",
            letterSpacing: "4px",
            color: "#111827",
            marginBottom: "20px",
          }}
        >
          {verificationCode}
        </div>

        {/* Nota */}
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Si no solicitaste esta verificación, puedes ignorar este correo.
        </p>
      </div>
    </div>
  );
}
