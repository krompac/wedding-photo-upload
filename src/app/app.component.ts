import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: ` <router-outlet />`,
  styles: `
    :host {
      text-align: center;
      margin: auto;
    }
  `,
})
export class AppComponent {
  readonly auth = inject(Auth);

  constructor() {
    user(this.auth)
      .pipe(takeUntilDestroyed())
      .subscribe((user) =>
        user !== null ? console.log((user as any)['accessToken']) : {},
      );
  }
}
