// src/app/pages/wedding-photos.page.ts
import { Component } from '@angular/core';
import { WeddingPhotoUploadComponent } from '../components/file-upload/file-upload.component';

@Component({
  selector: 'app-wedding-photos-page',
  standalone: true,
  imports: [WeddingPhotoUploadComponent],
  templateUrl: 'index-page.component.html',
  styleUrl: './index-page.component.css',
})
export default class WeddingPhotosPage {}
