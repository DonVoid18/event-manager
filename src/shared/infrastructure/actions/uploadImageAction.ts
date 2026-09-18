"use server";

import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { validateImageFile } from "@/shared/infrastructure/utils/imageValidation";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

interface UploadImageResult {
  success: boolean;
  data?: {
    id: string;
    key: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  };
  error?: string;
}

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No se proporcionó ninguna imagen",
      };
    }

    const validation = await validateImageFile(file);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Obtener el folder opcional del FormData
    const folder = formData.get("folder") as string | null;

    const fileRepository = new LocalFileRepository();
    const fileService = new FileService(fileRepository);

    // Subir la imagen
    const metadata = await fileService.uploadFile({
      file: validation.buffer,
      fileName: file.name,
      mimeType: file.type,
      folder: folder || "images",
    });

    // Obtener URL firmada para acceder a la imagen
    const url = await fileService.getDownloadUrl(metadata.key, 3600); // válida por 1 hora

    return {
      success: true,
      data: {
        id: metadata.id,
        key: metadata.key,
        fileName: metadata.fileName,
        url,
        mimeType: file.type,
        size: file.size,
      },
    };
  } catch (error) {
    await logServerError({
      error,
      event: "files.image_upload.failed",
      feature: "files",
      operation: "upload_image",
    });
    return {
      success: false,
      error: "No se pudo subir la imagen. Inténtalo nuevamente.",
    };
  }
}
