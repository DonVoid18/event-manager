// types/file.types.ts
export interface FileMetadata {
  id: string;
  key: string;
  bucket: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  tags?: Record<string, string>;
}

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
  tags?: Record<string, string>;
}

export interface SignedUrlOptions {
  expiresIn?: number; // segundos
  responseContentDisposition?: string;
}

// repositories/interfaces/file-repository.interface.ts
export interface IFileRepository {
  upload(params: UploadFileParams): Promise<FileMetadata>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  getSignedUploadUrl(
    key: string,
    mimeType: string,
    options?: SignedUrlOptions
  ): Promise<string>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<FileMetadata[]>;
  update(key: string, params: Partial<UploadFileParams>): Promise<FileMetadata>;
}
