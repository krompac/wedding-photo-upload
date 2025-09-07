// src/app/pages/wedding-photos.page.ts
import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { WeddingPhotoUploadComponent } from '../components/file-upload/file-upload.component';
import { UploadBannerComponent } from '../components/upload-banner/upload-banner.component';
import PhotoFileStore from '../store/photo-file.store';

@Component({
  selector: 'app-wedding-photos-page',
  standalone: true,
  imports: [WeddingPhotoUploadComponent, UploadBannerComponent, NgClass],
  templateUrl: 'index-page.component.html',
  styleUrl: './index-page.component.css',
  providers: [PhotoFileStore],
})
export default class WeddingPhotosPage {
  /* Dependency injections */
  private readonly store = inject(PhotoFileStore);

  readonly showUploadBanner = computed(() => this.store.fileCount() > 0);
}
