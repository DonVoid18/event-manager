import {
  FileMetadata,
  IFileRepository,
  UploadFileParams,
} from "@/shared/domain/S3File";
import { getPrivateFileUrl } from "@/shared/infrastructure/utils/privateFileUrl";
import { randomUUID } from "crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";

export class LocalFileRepository implements IFileRepository {
  constructor(private rootPath = path.join(process.cwd(), "private")) {}

  async upload(params: UploadFileParams): Promise<FileMetadata> {
    const id = randomUUID();
    const fileName = sanitizeFileName(params.fileName);
    const key = params.folder ? `${params.folder}/${id}-${fileName}` : `${id}-${fileName}`;
    const absolutePath = this.resolveKey(key);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, params.file);

    return {
      id,
      key,
      bucket: this.rootPath,
      fileName,
      mimeType: params.mimeType,
      size: params.file.length,
      uploadedAt: new Date(),
      tags: params.tags,
    };
  }

  async download(key: string): Promise<Buffer> {
    return await readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  async getSignedUrl(key: string): Promise<string> {
    return getPrivateFileUrl(key);
  }

  async getSignedUploadUrl(): Promise<string> {
    throw new Error("Las URLs de subida directa no estan soportadas para archivos locales");
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix = ""): Promise<FileMetadata[]> {
    const basePath = this.resolveKey(prefix);
    const files = await this.walk(basePath);

    return await Promise.all(
      files.map(async (filePath) => {
        const fileStat = await stat(filePath);
        const key = path.relative(this.rootPath, filePath).replaceAll(path.sep, "/");
        const fileName = path.basename(filePath);

        return {
          id: fileName.split("-")[0] || "",
          key,
          bucket: this.rootPath,
          fileName,
          mimeType: "application/octet-stream",
          size: fileStat.size,
          uploadedAt: fileStat.birthtime,
        };
      })
    );
  }

  async update(key: string, params: Partial<UploadFileParams>): Promise<FileMetadata> {
    const exists = await this.exists(key);
    if (!exists) {
      throw new Error("El archivo no existe");
    }

    if (params.file) {
      await writeFile(this.resolveKey(key), params.file);
    }

    const fileStat = await stat(this.resolveKey(key));

    return {
      id: key.split("-")[0] || "",
      key,
      bucket: this.rootPath,
      fileName: params.fileName || path.basename(key),
      mimeType: params.mimeType || "application/octet-stream",
      size: fileStat.size,
      uploadedAt: fileStat.birthtime,
      tags: params.tags,
    };
  }

  private resolveKey(key: string) {
    const absolutePath = path.resolve(this.rootPath, key);
    const rootPath = path.resolve(this.rootPath);

    if (absolutePath !== rootPath && !absolutePath.startsWith(`${rootPath}${path.sep}`)) {
      throw new Error("Ruta de archivo no permitida");
    }

    return absolutePath;
  }

  private async walk(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? this.walk(entryPath) : Promise.resolve([entryPath]);
      })
    );

    return files.flat();
  }
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
