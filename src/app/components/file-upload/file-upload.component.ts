import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreviewImgComponent } from '../preview-img/preview-img.component';

import { EntityId } from '@ngrx/signals/entities';
import { PhotoFile } from '../../model/photo-file.model';
import PhotoFileStore from '../../store/photo-file.store';

import { catchError, map, Observable, of, switchMap } from 'rxjs';
import ShortUniqueId from 'short-unique-id';

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
  selector: 'app-wedding-photo-upload',
  templateUrl: `file-upload.component.html`,
  styleUrl: 'file-upload.component.css',
  imports: [PreviewImgComponent],
  providers: [PhotoFileStore],
})
export class WeddingPhotoUploadComponent {
  /* Dependency injections */
  private readonly http = inject(HttpClient);
  private readonly store = inject(PhotoFileStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal('');

  readonly files = this.store.entities;

  readonly uploading = computed(() =>
    this.files().some((file) => file.status === 'uploading'),
  );

  readonly uploadSuccess = computed(() => {
    const files = this.files();

    return files.length > 0 && files.every((file) => file.status === 'success');
  });

  onFileSelected(event: Event): void {
    const loadFile = (file: File) => {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        this.errorMessage.set(
          'Molimo učitajte samo slikovne datoteke (jpg, png, itd.)',
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;

        if (typeof result === 'string') {
          this.store.addPhotoFile({
            id: new ShortUniqueId().rnd(20),
            file,
            src: result,
          });
        }
      };

      reader.onerror = () => {
        this.errorMessage.set(
          'Greška kod učitavanja slike, pokušajte ponovno.',
        );
      };

      reader.readAsDataURL(file);
    };

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => loadFile(file));
    }
  }

  uploadFiles(): void {
    this.errorMessage.set('');
    this.files().forEach((file) => this.uploadFile(file));
  }

  resetForm(): void {
    this.errorMessage.set('');
    this.store.resetPhotos();
  }

  removePhotoFile(id: EntityId): void {
    this.store.removePhotoFile(id);
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
        next: (event) => {
          updatestatus('success');

          console.log(event);
        },
        error: (error) => {
          updatestatus('error');
          this.errorMessage.set(
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
