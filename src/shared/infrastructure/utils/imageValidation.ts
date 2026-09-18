const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export const validateImageFile = async (file: File) => {
  if (file.size === 0) {
    return { success: false as const, error: "La imagen esta vacia" };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      success: false as const,
      error: `La imagen excede el tamano maximo permitido de 5MB. Tamano actual: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`,
    };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return {
      success: false as const,
      error: `Tipo de imagen no permitido. Solo se aceptan: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!fileExtension || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
    return {
      success: false as const,
      error: `Extension de archivo no valida. Solo se aceptan: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isValidImageBuffer(buffer, file.type)) {
    return {
      success: false as const,
      error: "El archivo no parece ser una imagen valida",
    };
  }

  return { success: true as const, buffer };
};

function isValidImageBuffer(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (mimeType === "image/gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  return false;
}
