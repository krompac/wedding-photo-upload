import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-preview-img',
  templateUrl: 'preview-img.component.html',
  styleUrl: 'preview-img.component.scss',
})
export class PreviewImgComponent {
  readonly src = input.required<string>();

  readonly remove = output<void>();

  onRemoveClicked(): void {
    this.remove.emit();
  }
}
