import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  bufferCount,
  concatMap,
  forkJoin,
  from,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { PhotoFile } from '../../model/photo-file.model';
import { ChunkedUploadService } from '../../services/chunk-upload.service';
import PhotoFileStore from '../../store/photo-file.store';

type UrlResponse = {
  success: boolean;
  fileId: string;
  fileName: string;
  uploadUrl: string;
  accessToken: string;
  expiresAt: number;
  mimeType: string;
  message: string;
};

@Component({
  selector: 'app-upload-banner',
  template: `
    @if (fileCount() > 0 && !uploadSuccess()) {
      <div
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 z-50 w-[100vw]"
      >
        <div
          class="flex items-center justify-center gap-3 max-w-md mx-auto relative"
        >
          <!-- File count -->
          <div class="flex items-center gap-2 text-[#8d6e63] absolute left-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span class="text-sm font-medium">{{ fileCount() }} slika</span>
          </div>

          <!-- Upload button -->
          <button
            class="px-4 py-2 bg-[#8d6e63] text-white text-lg font-medium rounded-lg hover:bg-[#6d4c41] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            [disabled]="fileCount() === 0 || uploading()"
            (click)="onUpload()"
          >
            @if (uploading()) {
              Učitavanje
            } @else {
              Prenesi
            }
          </button>
        </div>
      </div>
    }
  `,
})
export class UploadBannerComponent {
  /* Dependency injections */
  private readonly http = inject(HttpClient);
  private readonly store = inject(PhotoFileStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadService = inject(ChunkedUploadService);

  readonly errorMessage = output<string>();

  readonly fileCount = this.store.fileCount;
  readonly uploading = this.store.uploading;
  readonly uploadSuccess = this.store.uploadSuccess;

  readonly files = this.store.entities;

  async onUpload(): Promise<void> {
    this.errorMessage.emit('');
    const files = this.files();
    this.store.setAllToUploading();

    from(files)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        bufferCount(5), // group into arrays of 5
        concatMap((batch) =>
          forkJoin(
            batch.map((file, i) => this.uploadService.uploadFile(file, i)),
          ),
        ),
      )
      .subscribe((res) => {
        console.log(res);
      });
  }

  private uploadFile(fileToUpload: PhotoFile): Observable<any> {
    const id = fileToUpload.id;
    const file = fileToUpload.file;
    const fileName = `vjencanje_foto_${Date.now()}_${fileToUpload.file.name}`;
    const updatestatus = (status: PhotoFile['status']) =>
      this.store.updateStatus(id, status);

    updatestatus('uploading');

    return this.http
      .post<{ status: number; body: { signedUrl: string } }>(
        '/api/drive-upload',
        {
          fileName,
          mimeType: file.type,
          folderPath: 'vjencanje',
        },
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((res) => {
          const uploadUrl = res.body.signedUrl;
          if (!uploadUrl) {
            throw new Error('No upload URL returned from initiation');
          }
          return this.directUploadWithProgress(file, uploadUrl, id);
        }),
        tap({
          next: (res) => {
            console.log('Upload event:', res);

            // Handle different event types
            if (res.type === HttpEventType.UploadProgress) {
              const progress = Math.round((100 * res.loaded) / res.total!);
              console.log(`Upload progress: ${progress}%`);
            } else if (res.type === HttpEventType.Response) {
              console.log('Upload complete:', res);
              updatestatus('success');
            }
          },
          error: (error) => {
            updatestatus('error');
            this.errorMessage.emit(
              'Učitavanje nije uspjelo. Molimo pokušajte ponovno.',
            );
            console.error(
              `Error uploading file ${fileToUpload.file.name}:`,
              error,
            );
          },
        }),
      );
  }

  private directUploadWithProgress(
    file: File,
    signedUrl: string,
    fileId: string,
  ): Observable<any> {
    return new Observable((subscriber) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.store.updatePhotoProgress(fileId, progress);

          subscriber.next({
            type: 'progress',
            progress,
            loaded: event.loaded,
            total: event.total,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.store.updateStatus(fileId, 'success');
          subscriber.next({ type: 'complete', response: xhr.response });
          subscriber.complete();
        } else {
          subscriber.error(
            new Error(`Upload failed with status ${xhr.status}`),
          );
        }
      });

      xhr.addEventListener('error', () => {
        subscriber.error(new Error('Upload failed'));
      });

      // Direct PUT to signed URL
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader(
        'Content-Type',
        file.type || 'application/octet-stream',
      );
      xhr.send(file);

      return () => xhr.abort();
    });
  }
}
