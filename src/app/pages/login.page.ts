import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginPageComponent } from '../components/login/login-page.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @defer {
      <app-login-page />
    }
  `,
  styles: [
    `
      @media (max-width: 600px) {
        .max-w-sm {
          max-width: 100%;
        }
      }
    `,
  ],
})
export default class LoginComponent {}
