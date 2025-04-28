// src/app/pages/wedding-photos.page.ts
import { Component } from '@angular/core';
import { WeddingPhotoUploadComponent } from '../components/file-upload.component';

@Component({
  selector: 'app-wedding-photos-page',
  standalone: true,
  imports: [WeddingPhotoUploadComponent],
  template: `
    <div class="wedding-page">
      <div class="decorative-element top-left"></div>
      <div class="decorative-element top-right"></div>

      <app-wedding-photo-upload />

      <div class="decorative-element bottom-left"></div>
      <div class="decorative-element bottom-right"></div>
    </div>
  `,
  styles: [
    `
      /* Import font from Google Fonts if needed */
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Open+Sans:wght@300;400&display=swap');

      .wedding-page {
        min-height: 100vh;
        padding: 50px 20px;
        background-color: #fdfbf8;
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Cormorant Garamond', serif;
      }

      .decorative-element {
        position: absolute;
        width: 300px;
        height: 300px;
        opacity: 0.1;
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
      }

      .top-left {
        top: -50px;
        left: -50px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%238d6e63' stroke-width='0.5'%3E%3Cpath d='M30,50 C30,30 70,30 70,50 C70,70 30,70 30,50 Z'%3E%3C/path%3E%3Cpath d='M20,50 C20,20 80,20 80,50 C80,80 20,80 20,50 Z'%3E%3C/path%3E%3Cpath d='M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50 Z'%3E%3C/path%3E%3C/svg%3E");
        transform: rotate(-30deg);
      }

      .top-right {
        top: -50px;
        right: -50px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%238d6e63' stroke-width='0.5'%3E%3Cpath d='M30,50 C30,30 70,30 70,50 C70,70 30,70 30,50 Z'%3E%3C/path%3E%3Cpath d='M20,50 C20,20 80,20 80,50 C80,80 20,80 20,50 Z'%3E%3C/path%3E%3Cpath d='M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50 Z'%3E%3C/path%3E%3C/svg%3E");
        transform: rotate(30deg);
      }

      .bottom-left {
        bottom: -50px;
        left: -50px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%238d6e63' stroke-width='0.5'%3E%3Cpath d='M40,40 C40,20 60,20 60,40 L60,60 C60,80 40,80 40,60 L40,40 Z'%3E%3C/path%3E%3Cpath d='M30,30 C30,15 70,15 70,30 L70,70 C70,85 30,85 30,70 L30,30 Z'%3E%3C/path%3E%3Cpath d='M20,20 C20,10 80,10 80,20 L80,80 C80,90 20,90 20,80 L20,20 Z'%3E%3C/path%3E%3C/svg%3E");
        transform: rotate(-15deg);
      }

      .bottom-right {
        bottom: -50px;
        right: -50px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%238d6e63' stroke-width='0.5'%3E%3Cpath d='M40,40 C40,20 60,20 60,40 L60,60 C60,80 40,80 40,60 L40,40 Z'%3E%3C/path%3E%3Cpath d='M30,30 C30,15 70,15 70,30 L70,70 C70,85 30,85 30,70 L30,30 Z'%3E%3C/path%3E%3Cpath d='M20,20 C20,10 80,10 80,20 L80,80 C80,90 20,90 20,80 L20,20 Z'%3E%3C/path%3E%3C/svg%3E");
        transform: rotate(15deg);
      }

      @media (max-width: 768px) {
        .wedding-page {
          padding: 20px 10px;
        }

        .decorative-element {
          width: 150px;
          height: 150px;
        }
      }
    `,
  ],
})
export default class WeddingPhotosPage {}
