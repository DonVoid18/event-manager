import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { auth } from "@/shared/infrastructure/libs/auth";
import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await auth();

  if (!session) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { key } = await params;
  const fileKey = key.join("/");
  const repository = new LocalFileRepository();

  try {
    const file = await repository.download(fileKey);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": getContentType(fileKey),
      },
    });
  } catch (error) {
    await logServerError({
      error,
      event: "files.private_download.failed",
      feature: "files",
      operation: "download_private_file",
      context: { userId: session.user?.id, fileKey },
    });
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }
}

function getContentType(key: string) {
  const extension = key.toLowerCase().match(/\.[^.]+$/)?.[0];

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
