// src/app/components/wedding-photo-upload/wedding-photo-upload.component.ts
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreviewImgComponent } from '../preview-img/preview-img.component';

import { EntityId } from '@ngrx/signals/entities';
import { PhotoFile } from '../../model/photo-file.model';
import PhotoFileStore from '../../store/photo-file.store';

import ShortUniqueId from 'short-unique-id';

@Component({
  selector: 'app-wedding-photo-upload',
  standalone: true,
  templateUrl: `file-upload.component.html`,
  styleUrl: 'file-upload.component.scss',
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
    this.files().some((file) => file.state === 'uploading'),
  );

  readonly uploadSuccess = computed(() => {
    const files = this.files();

    return files.length > 0 && files.every((file) => file.state === 'success');
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
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', fileToUpload.file);
    formData.append(
      'filename',
      `vjencanje_foto_${Date.now()}_${fileToUpload.file.name}`,
    );

    // TODO: treba zapravo raditi za svaki file jedan request -> napraviti componentu koja enkapsulira i upload i choose stvari
    //       tak da se za svaku more napraviti loading
    //       i onda jedna wrapper componenta koja bude imala count i završni all is finished!

    // Send the file to our server endpoint
    const id = fileToUpload.id;

    const updateState = (state: PhotoFile['state']) =>
      this.store.updateStatus(id, state);

    updateState('uploading');

    this.http
      .post<any>('/api/drive-upload', formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // TODO: možda poslije tu napraviti neku upload progress logiku
          } else if (event.type === HttpEventType.Response) {
            updateState('success');
          }
        },
        error: (error) => {
          updateState('error');
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
}
