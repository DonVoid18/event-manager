import {
  FileMetadata,
  IFileRepository,
  SignedUrlOptions,
  UploadFileParams,
} from "@/shared/domain/S3File";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export class S3FileRepository implements IFileRepository {
  private s3Client: S3Client;
  private bucket: string;

  constructor(bucket: string, region: string = "us-east-1") {
    this.bucket = bucket;
    this.s3Client = new S3Client({
      region,
      // Credenciales se toman automáticamente de las variables de entorno
      // AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY
    });
  }

  async upload(params: UploadFileParams): Promise<FileMetadata> {
    const id = uuidv4();
    const key = params.folder
      ? `${params.folder}/${id}-${params.fileName}`
      : `${id}-${params.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: params.file,
      ContentType: params.mimeType,
      Metadata: {
        originalName: params.fileName,
        uploadedAt: new Date().toISOString(),
        ...(params.tags || {}),
      },
    });

    await this.s3Client.send(command);

    return {
      id,
      key,
      bucket: this.bucket,
      fileName: params.fileName,
      mimeType: params.mimeType,
      size: params.file.length,
      uploadedAt: new Date(),
      tags: params.tags,
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body;

    if (!stream) {
      throw new Error("No se pudo obtener el archivo");
    }

    // Convertir stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: options?.responseContentDisposition,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: options?.expiresIn || 3600, // 1 hora por defecto
    });

    return signedUrl;
  }

  async getSignedUploadUrl(
    key: string,
    mimeType: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: options?.expiresIn || 3600,
    });

    return signedUrl;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  async list(prefix?: string): Promise<FileMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    const files: FileMetadata[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          files.push({
            id: object.Key.split("-")[0] || "",
            key: object.Key,
            bucket: this.bucket,
            fileName: object.Key.split("/").pop() || object.Key,
            mimeType: "application/octet-stream",
            size: object.Size || 0,
            uploadedAt: object.LastModified || new Date(),
          });
        }
      }
    }

    return files;
  }

  async update(
    key: string,
    params: Partial<UploadFileParams>
  ): Promise<FileMetadata> {
    // Verificar que el archivo existe
    const exists = await this.exists(key);
    if (!exists) {
      throw new Error("El archivo no existe");
    }

    // Si se proporciona un nuevo contenido, reemplazar el archivo
    if (params.file) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.file,
        ContentType: params.mimeType,
        Metadata: {
          originalName: params.fileName || "",
          updatedAt: new Date().toISOString(),
          ...(params.tags || {}),
        },
      });

      await this.s3Client.send(command);

      return {
        id: key.split("-")[0] || "",
        key,
        bucket: this.bucket,
        fileName: params.fileName || key,
        mimeType: params.mimeType || "application/octet-stream",
        size: params.file.length,
        uploadedAt: new Date(),
        tags: params.tags,
      };
    }

    // Si solo se actualizan metadatos, copiar el archivo con nuevos metadatos
    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${key}`,
      Key: key,
      ContentType: params.mimeType,
      Metadata: {
        originalName: params.fileName || "",
        updatedAt: new Date().toISOString(),
        ...(params.tags || {}),
      },
      MetadataDirective: "REPLACE",
    });

    await this.s3Client.send(copyCommand);

    // Obtener información actualizada
    const headCommand = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const headResponse = await this.s3Client.send(headCommand);

    return {
      id: key.split("-")[0] || "",
      key,
      bucket: this.bucket,
      fileName: params.fileName || key,
      mimeType:
        params.mimeType ||
        headResponse.ContentType ||
        "application/octet-stream",
      size: headResponse.ContentLength || 0,
      uploadedAt: new Date(),
      tags: params.tags,
    };
  }
}
