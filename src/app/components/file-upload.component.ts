// src/app/components/wedding-photo-upload/wedding-photo-upload.component.ts
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-wedding-photo-upload',
  standalone: true,
  templateUrl: `file-upload.component.html`,
  styleUrl: 'file-upload.component.scss',
  imports: [],
})
export class WeddingPhotoUploadComponent {
  /* Dependency injections */
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly uploadSuccess = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {});
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check if file is an image
      if (!file.type.match('image.*')) {
        this.errorMessage.set(
          'Molimo učitajte samo slikovne datoteke (jpg, png, itd.)',
        );
        return;
      }

      this.selectedFile.set(file);

      const reader = new FileReader();

      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };

      reader.onerror = () => {
        this.errorMessage.set(
          'Greška kod učitavanja slike, pokušajte ponovno.',
        );
        this.previewUrl.set(null);
        this.selectedFile.set(null);
      };

      reader.readAsDataURL(file);
    }
  }

  uploadFile(): void {
    const selectedFile = this.selectedFile();

    if (!selectedFile) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadSuccess.set(false);
    this.errorMessage.set('');

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append(
      'filename',
      `vjencanje_foto_${Date.now()}_${selectedFile.name}`,
    );

    // Send the file to our server endpoint
    this.http
      .post<any>('/api/drive-upload', formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress.set(
              Math.round((event.loaded / event.total) * 100),
            );
          } else if (event.type === HttpEventType.Response) {
            this.uploading.set(false);
            this.uploadSuccess.set(true);
          }
        },
        error: (error) => {
          this.uploading.set(false);
          this.errorMessage.set(
            'Učitavanje nije uspjelo. Molimo pokušajte ponovno.',
          );
          console.error('Error uploading file:', error);
        },
      });
  }

  resetForm(): void {
    this.selectedFile.set(null);
    this.uploading.set(false);
    this.uploadProgress.set(0);
    this.uploadSuccess.set(false);
    this.errorMessage.set('');
  }
}
