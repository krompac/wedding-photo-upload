import { inject, Injectable, signal } from '@angular/core';
import { PhotoFile } from '../model/photo-file.model';
import PhotoFileStore from '../store/photo-file.store';

class Semaphore {
  private tasks: (() => void)[] = [];
  private counter: number;

  constructor(limit: number) {
    this.counter = limit;
  }

  async acquire(): Promise<() => void> {
    if (this.counter > 0) {
      this.counter--;
      return () => this.release();
    }

    return new Promise<() => void>((resolve) => {
      this.tasks.push(() => resolve(() => this.release()));
    });
  }

  private release() {
    this.counter++;
    if (this.tasks.length > 0 && this.counter > 0) {
      this.counter--;
      const next = this.tasks.shift();
      next?.();
    }
  }
}

@Injectable()
export class ChunkedUploadService {
  /* Dependency injections */
  private readonly photoFileStore = inject(PhotoFileStore);

  private readonly putSemaphore = new Semaphore(5);

  readonly progress = signal(0);

  async uploadFile(photoFile: PhotoFile, index: number) {
    // Step 1: Create file on backend
    const { file, id } = photoFile;

    await this.wait(100 * index);

    const createResp = await fetch('/api/test-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
    });

    if (!createResp.ok) {
      throw new Error('Failed to create file on backend');
    }

    const createData: any = await createResp.json();
    const sessionUrl = createData.body.sessionUrl;

    // Step 2: Upload in 1MB chunks
    const chunkSize = 1 * 1024 * 1024; // 1 MB

    let offset = 0;
    this.photoFileStore.updatePhotoProgress(id, 0);

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);

      // Acquire slot
      const release = await this.putSemaphore.acquire();

      try {
        const resp = await fetch(
          `/api/test-upload?fileType=${file.type}&offset=${offset}&end=${end}&fileSize=${file.size}`,
          {
            method: 'PUT',
            body: chunk,
            headers: {
              'X-Session-URL': sessionUrl,
            },
          },
        );

        if (!(resp.ok || resp.status === 308)) {
          this.photoFileStore.updateStatus(id, 'error');
          this.photoFileStore.updatePhotoProgress(id, 0);
          console.error(resp);
          throw new Error(`Upload failed at chunk starting ${offset}`);
        }

        offset = end;
        const progress = Math.round((offset / file.size) * 100);
        console.log('Progress:', progress, '%');
        this.photoFileStore.updatePhotoProgress(id, progress);
      } finally {
        // Free slot for next waiting PUT
        release();
      }

      await this.wait(this.getRandomPrime());
    }

    this.photoFileStore.updatePhotoProgress(id, 100);
    this.photoFileStore.updateStatus(id, 'success');

    return { success: true };
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getRandomPrime(): number {
    // All primes from 1 to 100
    const primes = [
      2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
      71, 73, 79, 83, 89, 97,
    ];

    const randomIndex = Math.floor(Math.random() * primes.length);
    return primes[randomIndex];
  }
}
