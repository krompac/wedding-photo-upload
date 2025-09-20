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
    const loadFile = (file: File) => {
      return new Promise((resolve, reject) => {
        // Check if file is an image
        if (!file.type.match('image.*') && !file.type.match('video.*')) {
          this.errorMessage.set(
            'Molimo učitajte samo slikovne datoteke (jpg, png, itd.) ili video datoteke (mov, mp4, itd.)',
          );

          resolve('');
          return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
          (async () => {
            const result = e.target?.result;

            if (typeof result === 'string') {
              let src = result;

              if (file.type.match('video.*')) {
                src = (await getVideoThumbnail(file)) ?? result;
              }

              this.store.addPhotoFile({
                id: new ShortUniqueId().rnd(20),
                file,
                src,
              });
            }

            resolve(result);
          })();
        };

        reader.onerror = () => {
          this.errorMessage.set(
            'Greška kod učitavanja slike, pokušajte ponovno.',
          );

          resolve('');
        };

        reader.readAsDataURL(file);
      });
    };

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.loadingService.start();
      await Promise.all(Array.from(input.files).map((file) => loadFile(file)));
      await wait(100);
      document.querySelector('app-wedding-photos-page')?.scrollTo({
        top: this.gridEl().offsetTop - 20,
        behavior: 'smooth',
      });
      this.loadingService.stop();
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
