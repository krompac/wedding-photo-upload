import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (loading()) {
      <div
        class="fixed inset-0 w-full h-full z-[9999] bg-body-bg/80 flex items-center justify-center"
      >
        <div
          class="animate-spin rounded-full w-[40vw] h-[40vw] border-b-2 border-[#8d6e63]"
        ></div>
      </div>
    }
  `,
  styles: `
    :host {
      text-align: center;
      margin: auto;
    }
  `,
})
export class AppComponent {
  readonly loading = inject(LoadingService).loading;
}
