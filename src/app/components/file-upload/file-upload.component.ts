import { Component, inject, signal } from '@angular/core';
import { PreviewImgComponent } from '../preview-img/preview-img.component';

import { EntityId } from '@ngrx/signals/entities';
import PhotoFileStore from '../../store/photo-file.store';

import ShortUniqueId from 'short-unique-id';

@Component({
  selector: 'app-wedding-photo-upload',
  templateUrl: `file-upload.component.html`,
  imports: [PreviewImgComponent],
})
export class WeddingPhotoUploadComponent {
  /* Dependency injections */
  private readonly store = inject(PhotoFileStore);

  readonly errorMessage = signal('');

  readonly files = this.store.entities;
  readonly fileCount = this.store.fileCount;
  readonly uploading = this.store.uploading;
  readonly uploadSuccess = this.store.uploadSuccess;

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

  resetForm(): void {
    this.errorMessage.set('');
    this.store.resetPhotos();
  }

  removePhotoFile(id: EntityId): void {
    this.store.removePhotoFile(id);
  }
}
