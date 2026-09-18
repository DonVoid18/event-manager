import {
  FileMetadata,
  IFileRepository,
  UploadFileParams,
} from "@/shared/domain/S3File";

export class FileService {
  constructor(private fileRepository: IFileRepository) {}

  async uploadFile(params: UploadFileParams): Promise<FileMetadata> {
    return await this.fileRepository.upload(params);
  }

  async downloadFile(key: string): Promise<Buffer> {
    return await this.fileRepository.download(key);
  }

  async deleteFile(key: string): Promise<void> {
    await this.fileRepository.delete(key);
  }

  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return await this.fileRepository.getSignedUrl(key, { expiresIn });
  }

  async getUploadUrl(
    key: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return await this.fileRepository.getSignedUploadUrl(key, mimeType, {
      expiresIn,
    });
  }

  async listFiles(prefix?: string): Promise<FileMetadata[]> {
    return await this.fileRepository.list(prefix);
  }

  async updateFile(
    key: string,
    params: Partial<UploadFileParams>
  ): Promise<FileMetadata> {
    return await this.fileRepository.update(key, params);
  }

  async fileExists(key: string): Promise<boolean> {
    return await this.fileRepository.exists(key);
  }
}
