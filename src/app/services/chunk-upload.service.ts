import { inject, Injectable, signal } from '@angular/core';
import { PhotoFile } from '../model/photo-file.model';
import PhotoFileStore from '../store/photo-file.store';

class Semaphore {
  private tasks: (() => void)[] = [];
  private counter: number;
  private readonly maxLimit: number;

  constructor(limit: number) {
    this.counter = limit;
    this.maxLimit = limit;
  }

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      if (this.counter > 0) {
        this.counter--;
        resolve(() => this.release());
      } else {
        this.tasks.push(() => resolve(() => this.release()));
      }
    });
  }

  private release() {
    if (this.counter >= this.maxLimit) {
      console.warn('Semaphore: release() called more times than acquire()');
      return;
    }

    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      next?.();
    } else {
      this.counter++;
    }
  }

  get availableSlots(): number {
    return this.counter;
  }

  get queuedTasks(): number {
    return this.tasks.length;
  }
}

interface CreateFileResponse {
  sessionUrl: string;
}

interface UploadResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class ChunkedUploadService {
  private readonly photoFileStore = inject(PhotoFileStore);
  private readonly putSemaphore = new Semaphore(5);
  private readonly chunkSize = 1024 * 1024; // 1 MB

  readonly progress = signal(0);

  async uploadFile(photoFile: PhotoFile, index: number): Promise<UploadResult> {
    const { file, id } = photoFile;

    try {
      await this.wait(100 * index);

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

        const response = await fetch('/api/test-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: { body: CreateFileResponse } = await response.json();
        return data.body.sessionUrl;
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
        await this.wait(Math.pow(2, attempt - 1) * 1000);
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

      await this.uploadChunk(chunk, file, fileId, sessionUrl, offset, end);

      offset = end;
      const progress = Math.round((offset / file.size) * 100);
      this.photoFileStore.updatePhotoProgress(fileId, progress);
    }
  }

  private async uploadChunk(
    chunk: Blob,
    file: File,
    fileId: string,
    sessionUrl: string,
    offset: number,
    end: number,
  ): Promise<void> {
    const release = await this.putSemaphore.acquire();

    try {
      const response = await fetch(
        `/api/test-upload?fileType=${encodeURIComponent(file.type)}&offset=${offset}&end=${end}&fileSize=${file.size}`,
        {
          method: 'PUT',
          body: chunk,
          headers: {
            'X-Session-URL': sessionUrl,
            'Content-Type': file.type,
            'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        // Upload complete
        return;
      } else if (response.status === 308) {
        // Chunk uploaded successfully, more chunks needed
        const range = response.headers.get('Range');
        if (range) {
          console.log(
            `Chunk uploaded successfully. Server has bytes: ${range}`,
          );
        }
        return;
      } else {
        throw new Error(
          `Chunk upload failed at offset ${offset}: ${response.status} ${response.statusText}`,
        );
      }
    } finally {
      release();
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // Utility methods for monitoring
  getSemaphoreStatus(): { available: number; queued: number } {
    return {
      available: this.putSemaphore.availableSlots,
      queued: this.putSemaphore.queuedTasks,
    };
  }

  // Method to cancel all pending uploads (if needed)
  cancelPendingUploads(): void {
    // Note: This would require additional implementation in the Semaphore class
    // to properly cancel queued tasks
    console.warn('Cancel functionality not yet implemented');
  }
}
