import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { PhotoFile } from '../../model/photo-file.model';
import { ChunkedUploadService } from '../../services/chunk-upload.service';
import PhotoFileStore from '../../store/photo-file.store';
import { Semaphore } from '../../utils/semaphore.utils';

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

  private readonly semaphore = new Semaphore(5);

  async onUpload(): Promise<void> {
    this.errorMessage.emit('');
    const files = this.files();
    this.store.setAllToUploading();

    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      // No await here — start task immediately
      uploadPromises.push(
        (async (file, index) => {
          const release = await this.semaphore.acquire();
          try {
            await this.uploadService.uploadFile(file, index);
          } finally {
            release();
          }
        })(files[i], i),
      );
    }

    // Wait for all uploads to finish
    await Promise.all(uploadPromises);
  }

  private uploadFile(fileToUpload: PhotoFile): void {
    // TODO: treba zapravo raditi za svaki file jedan request -> napraviti componentu koja enkapsulira i upload i choose stvari
    //       tak da se za svaku more napraviti loading
    //       i onda jedna wrapper componenta koja bude imala count i završni all is finished!

    // Send the file to our server endpoint
    const id = fileToUpload.id;
    const file = fileToUpload.file;
    const fileName = `vjencanje_foto_${Date.now()}_${fileToUpload.file.name}`;

    const updatestatus = (status: PhotoFile['status']) =>
      this.store.updateStatus(id, status);

    updatestatus('uploading');

    this.http
      .post<{ status: number; body: UrlResponse }>('/api/drive-upload', {
        fileName,
        mimeType: file.type,
        fileSize: file.size,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((res) =>
          this.patchFile(
            file,
            res.body.uploadUrl,
            res.body.accessToken,
            res.body.fileId,
          ),
        ),
      )
      .subscribe({
        next: () => {
          updatestatus('success');
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
      });
  }

  private patchFile(
    file: File,
    uploadUrl: string,
    accessToken: string,
    fileId: string,
  ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': file.type,
    });

    return this.http.patch(uploadUrl, file, { headers }).pipe(
      map(() => ({
        fileName: file.name,
        status: 'completed' as const,
        fileId,
      })),
      catchError((error) =>
        of({
          fileName: file.name,
          status: 'error' as const,
          error: `Upload failed: ${error.status || error.message}`,
        }),
      ),
    );
  }
}
