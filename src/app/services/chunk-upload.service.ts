import { effect, inject, Injectable, signal } from '@angular/core';
import { PhotoFile } from '../model/photo-file.model';
import PhotoFileStore from '../store/photo-file.store';

@Injectable()
export class ChunkedUploadService {
  /* Dependency injections */
  private readonly photoFileStore = inject(PhotoFileStore);

  readonly progress = signal(0);

  constructor() {
    effect(() => console.log(this.progress()));
  }

  async uploadFile(photoFile: PhotoFile) {
    // Step 1: Create file on backend
    const { file, id } = photoFile;
    this.photoFileStore.updateStatus(id, 'uploading');

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

      const resp = await fetch(
        `/api/test-upload?fileType=${file.type}&offset=${offset}&end=${end}&fileSize=${file.size}`,
        {
          method: 'PUT',
          body: chunk,
          headers: {
            'X-Session-URL': sessionUrl, // Pass in header instead
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
    }
    this.photoFileStore.updatePhotoProgress(id, 100);
    this.photoFileStore.updateStatus(id, 'success');
    return { success: true };
  }
}
