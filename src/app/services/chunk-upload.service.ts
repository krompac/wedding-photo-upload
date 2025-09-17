import { inject, Injectable } from '@angular/core';
import { PhotoFile } from '../model/photo-file.model';
import PhotoFileStore from '../store/photo-file.store';
import { Semaphore } from '../utils/semaphore.utils';
import { wait } from '../utils/wait.util';

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
  private readonly putSemaphore = new Semaphore(10);

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
    // 1. probe speed
    const speedBps = await this.probeUploadSpeed(file, fileId, sessionUrl);
    // 2. choose starting chunk size
    let chunkSize = this.pickInitialChunkSize(speedBps);
    const minChunkSize = 256 * 1024;
    const maxChunkSize = 5 * 1024 * 1024;

    let offset = 256 * 1024; // because we already sent first 256KB in probe
    this.photoFileStore.updatePhotoProgress(
      fileId,
      Math.round((offset / file.size) * 100),
    );

    // 3. adaptive loop
    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);

      const startTime = performance.now();
      await this.uploadChunk(chunk, file, fileId, sessionUrl, offset, end);
      const duration = (performance.now() - startTime) / 1000;

      offset = end;
      this.photoFileStore.updatePhotoProgress(
        fileId,
        Math.round((offset / file.size) * 100),
      );

      // adjust chunk size dynamically:
      if (duration > 3 && chunkSize > minChunkSize) {
        chunkSize = Math.max(minChunkSize, Math.floor(chunkSize / 2));
      } else if (duration < 1 && chunkSize < maxChunkSize) {
        chunkSize = Math.min(maxChunkSize, Math.floor(chunkSize * 2));
      }
    }
  }

  private async probeUploadSpeed(
    file: File,
    fileId: string,
    sessionUrl: string,
  ): Promise<number> {
    // Probe with a 256KB slice
    const probeSize = 256 * 1024;
    const chunk = file.slice(0, probeSize);

    const startTime = performance.now();
    await this.uploadChunk(chunk, file, fileId, sessionUrl, 0, probeSize);
    const duration = (performance.now() - startTime) / 1000; // seconds

    // bytes/sec
    const speed = probeSize / duration;
    console.log(`Probe upload speed: ${(speed / 1024).toFixed(0)} KB/s`);

    return speed; // in bytes per second
  }

  private pickInitialChunkSize(speedBps: number): number {
    // aim for ~1.5 seconds per chunk
    const desiredDuration = 1.5; // seconds
    const chunkSize = Math.round(speedBps * desiredDuration);

    // clamp between 256KB and 5MB
    return Math.min(5 * 1024 * 1024, Math.max(256 * 1024, chunkSize));
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
