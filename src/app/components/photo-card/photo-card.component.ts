import { Component, input } from '@angular/core';
import { DriveFile } from 'src/app/model/drive-fetch.model';

@Component({
  selector: 'app-photo-card',
  templateUrl: 'photo-card.component.html',
})
export class PhotoCardComponent {
  readonly image = input.required<DriveFile>();
}
