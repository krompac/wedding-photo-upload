import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PhotoFile } from '../model/photo-file.model';
import PhotoFileStore from '../store/photo-file.store';
import { wait } from '../utils/wait.util';

interface UploadResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class ChunkedUploadService {
  /* Dependency injections */
  private readonly httpClient = inject(HttpClient);
  private readonly photoFileStore = inject(PhotoFileStore);
  private readonly chunkSize = 1024 * 1024; // 1 MB

  async uploadFile(photoFile: PhotoFile, index: number): Promise<UploadResult> {
    const { file, id } = photoFile;

    try {
      await wait(100 * index);

      const sessionUrl = await this.createFileSession(file);

      await this.uploadChunks(file, id, sessionUrl);

      // Mark as complete
      this.photoFileStore.updatePhotoProgress(id, 100);
      this.photoFileStore.updateStatus(id, 'success');

      return { success: true };
    } catch (error) {
      console.error(`Upload failed for file ${file.name}:`, error);
      this.photoFileStore.updateStatus(id, 'error');
      this.photoFileStore.updatePhotoProgress(id, 0);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async createFileSession(file: File, maxRetries = 5): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await firstValueFrom(
          this.httpClient.post<{ status: number; body: { signedUrl: string } }>(
            '/api/drive-upload',
            {
              fileName: file.name,
              mimeType: file.type,
              folderPath: 'vjencanje',
            },
          ),
        );

        clearTimeout(timeoutId);

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.body.signedUrl;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(
            `Create file session timeout (attempt ${attempt}/${maxRetries})`,
          );
        } else {
          console.warn(
            `Create file session failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`,
          );
        }

        if (isLastAttempt) {
          throw new Error(
            `Failed to create file session after ${maxRetries} attempts. Last error: ${errorMessage}`,
          );
        }

        // Wait before retrying (exponential backoff)
        await wait(Math.pow(2, attempt - 1) * 1000);
      }
    }

    throw new Error('Unexpected error in createFileSession');
  }

  private async uploadChunks(
    file: File,
    fileId: string,
    sessionUrl: string,
  ): Promise<void> {
    let offset = 0;
    this.photoFileStore.updatePhotoProgress(fileId, 0);

    while (offset < file.size) {
      const end = Math.min(offset + this.chunkSize, file.size);
      const chunk = file.slice(offset, end);

      await firstValueFrom(
        this.httpClient.put(sessionUrl, chunk, {
          headers: new HttpHeaders({
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
          }),
          reportProgress: true,
          observe: 'events',
        }),
      );

      offset = end;
      const progress = Math.round((offset / file.size) * 100);
      this.photoFileStore.updatePhotoProgress(fileId, progress);
    }
  }
}
