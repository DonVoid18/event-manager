const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;

const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const validateReceiptFile = async (file: File) => {
  if (file.size === 0) {
    return { success: false as const, error: "El comprobante de pago está vacío" };
  }

  if (file.size > MAX_RECEIPT_SIZE) {
    return {
      success: false as const,
      error: `El comprobante excede el tamaño máximo permitido de 10MB`,
    };
  }

  if (!ALLOWED_RECEIPT_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_TYPES)[number])) {
    return {
      success: false as const,
      error: "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return { success: true as const, buffer };
};
