import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PreviewImgComponent } from '../preview-img/preview-img.component';

import { EntityId } from '@ngrx/signals/entities';
import PhotoFileStore from '../../store/photo-file.store';

import ShortUniqueId from 'short-unique-id';
import { ScrollToDirective } from '../../directives/scroll-to.directive';
import { LoadingService } from '../../services/loading.service';
import { getVideoThumbnail } from '../../utils/video-thumnail.util';
import { wait } from '../../utils/wait.util';

@Component({
  selector: 'app-wedding-photo-upload',
  templateUrl: `file-upload.component.html`,
  imports: [PreviewImgComponent, ScrollToDirective],
})
export class WeddingPhotoUploadComponent {
  /* Dependency injections */
  private readonly store = inject(PhotoFileStore);
  private readonly loadingService = inject(LoadingService);

  readonly errorMessage = signal('');

  readonly files = this.store.entities;
  readonly fileCount = this.store.fileCount;
  readonly uploading = this.store.uploading;
  readonly uploadSuccess = this.store.uploadSuccess;

  readonly gridRef = viewChild.required<ElementRef<HTMLDivElement>>('grid');
  readonly gridEl = computed(() => this.gridRef().nativeElement);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    // Validate input
    if (!input?.files?.length) {
      return;
    }

    this.loadingService.start();

    try {
      // Process files sequentially to avoid overwhelming the browser
      for (const file of Array.from(input.files)) {
        await this.processFile(file);
      }

      // Scroll to grid after all files are processed
      await this.scrollToGrid();
    } catch (error) {
      console.error('Error processing files:', error);
      this.errorMessage.set(
        'Greška kod učitavanja datoteka, pokušajte ponovno.',
      );
    } finally {
      this.loadingService.stop();
      // Reset input to allow selecting the same files again
      input.value = '';
    }
  }

  private async processFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!this.isValidFileType(file)) {
        this.errorMessage.set(
          'Molimo učitajte samo slikovne datoteke (jpg, png, itd.) ili video datoteke (mov, mp4, itd.)',
        );
        resolve(); // Don't reject, just skip this file
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const result = e.target?.result;

          if (typeof result !== 'string') {
            throw new Error('Failed to read file as data URL');
          }

          let src = result;

          // Generate thumbnail for videos
          if (file.type.match('video.*')) {
            try {
              const thumbnail = await getVideoThumbnail(file);
              src = thumbnail ?? result;
            } catch (thumbnailError) {
              console.warn(
                'Failed to generate video thumbnail:',
                thumbnailError,
              );
              // Continue with original result as fallback
            }
          }

          // Add file to store
          this.store.addPhotoFile({
            id: new ShortUniqueId().rnd(20),
            file,
            src,
          });

          resolve();
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error(`Failed to read file: ${file.name}`);
        console.error(error);
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  private isValidFileType(file: File): boolean {
    return (
      file.type.match('image.*') !== null || file.type.match('video.*') !== null
    );
  }

  private async scrollToGrid(): Promise<void> {
    // Small delay to ensure DOM is updated
    await wait(100);

    const gridElement = this.gridEl();
    const appElement = document.querySelector('app-wedding-photos-page');

    if (gridElement && appElement) {
      appElement.scrollTo({
        top: gridElement.offsetTop - 20,
        behavior: 'smooth',
      });
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
