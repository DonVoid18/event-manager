"use server";

import { S3FileRepository } from "@/shared/infrastructure/repository/S3FileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

const bucketName = process.env.AWS_S3_BUCKET_NAME!;
const region = process.env.AWS_REGION || "us-east-1";

const fileRepository = new S3FileRepository(bucketName, region);
const fileService = new FileService(fileRepository);

export async function getImageUrlAction(
  imageKey: string | null
): Promise<string | null> {
  if (!imageKey) {
    return null;
  }

  try {
    // Obtener URL firmada válida por 1 hora (3600 segundos)
    const signedUrl = await fileService.getDownloadUrl(imageKey, 3600);
    return signedUrl;
  } catch (error) {
    await logServerError({
      error,
      event: "files.signed_url.failed",
      feature: "files",
      operation: "get_image_url",
      context: { imageKey },
    });
    return null;
  }
}
