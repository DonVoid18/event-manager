interface PasswordResetTemplateProps {
  userName?: string | null;
  resetCode: string;
}

export function PasswordResetTemplate({
  userName,
  resetCode,
}: PasswordResetTemplateProps) {
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
          Recuperación de contraseña
        </h1>

        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
          Hola <strong>{userName ?? "usuario"}</strong>,
        </p>
        <p
          style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "20px" }}
        >
          Recibimos una solicitud para cambiar la contraseña de tu cuenta.
          Ingresa el siguiente código para continuar:
        </p>

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
          {resetCode}
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
      </div>
    </div>
  );
}
