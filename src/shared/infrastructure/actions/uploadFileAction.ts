"use server";

import { S3FileRepository } from "@/shared/infrastructure/repository/S3FileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

interface UploadFileResult {
  success: boolean;
  data?: {
    id: string;
    key: string;
    fileName: string;
    url: string;
  };
  error?: string;
}

export async function uploadFileAction(
  formData: FormData
): Promise<UploadFileResult> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No se proporcionó ningún archivo",
      };
    }

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `El archivo excede el tamaño máximo permitido de 5MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // Validar que sea un archivo válido
    if (file.size === 0) {
      return {
        success: false,
        error: "El archivo está vacío",
      };
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obtener el folder opcional del FormData
    const folder = formData.get("folder") as string | null;

    // Inicializar el servicio de archivos
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!bucketName) {
      return {
        success: false,
        error: "Configuración de S3 incompleta. Falta AWS_S3_BUCKET_NAME",
      };
    }

    const fileRepository = new S3FileRepository(bucketName, region);
    const fileService = new FileService(fileRepository);

    // Subir el archivo
    const metadata = await fileService.uploadFile({
      file: buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      folder: folder || undefined,
    });

    // Obtener URL firmada para acceder al archivo
    const url = await fileService.getDownloadUrl(metadata.key, 3600); // válida por 1 hora

    return {
      success: true,
      data: {
        id: metadata.id,
        key: metadata.key,
        fileName: metadata.fileName,
        url,
      },
    };
  } catch (error) {
    await logServerError({
      error,
      event: "files.upload.failed",
      feature: "files",
      operation: "upload_file",
    });
    return {
      success: false,
      error: "No se pudo subir el archivo. Inténtalo nuevamente.",
    };
  }
}
