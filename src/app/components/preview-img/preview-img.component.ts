import { Component, computed, input, output } from '@angular/core';
import { PhotoFile } from 'src/app/model/photo-file.model';

@Component({
  selector: 'app-preview-img',
  templateUrl: 'preview-img.component.html',
  styleUrl: 'preview-img.component.css',
  host: {
    '[class.uploading]': 'uploading()',
  },
})
export class PreviewImgComponent {
  readonly file = input.required<PhotoFile>();

  readonly uploading = computed(() => this.file().status === 'uploading');

  readonly remove = output<void>();

  onRemoveClicked(): void {
    this.remove.emit();
  }
}
