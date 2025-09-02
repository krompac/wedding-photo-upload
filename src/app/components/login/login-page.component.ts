import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// import {
//   Auth,
//   GoogleAuthProvider,
//   signInWithPopup,
//   user,
// } from '@angular/fire/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto max-w-sm font-serif text-primary text-center bg-transparent py-10 px-5"
    >
      <!-- Header -->
      <div class="mb-8">
        <svg
          class="w-[60px] h-[60px] text-accent mx-auto mb-8"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="10,17 15,12 10,7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="15"
            y1="12"
            x2="3"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <div class="mb-10">
        <h1 class="text-[42px] font-light m-0 text-heading">Hello there</h1>
        <h2 class="text-2xl font-normal my-2.5 text-accent">
          Sign in to your account
        </h2>
      </div>

      <button (click)="signInWithGoogle()">SSO</button>
    </div>
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
export class LoginPageComponent {
  /* Dependency injections */
  // private readonly auth = inject(Auth);
  // user$ = user(this.auth);

  async signInWithGoogle() {
    // const provider = new GoogleAuthProvider();
    // provider.addScope('https://www.googleapis.com/auth/drive.photos.readonly');
    // await signInWithPopup(this.auth, provider);
  }
}
