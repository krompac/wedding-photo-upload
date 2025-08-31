import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
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

      <!-- Login Form -->
      <div class="bg-white rounded-xl p-8 shadow-lg text-left">
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="mb-5">
            <label
              for="email"
              class="block mb-2 text-base text-primary font-medium"
              >Email Address</label
            >
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full p-3 border-2 border-light rounded-lg text-base font-sans transition-all duration-300 box-border focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(141,110,99,0.1)]"
              [class.border-error]="emailError()"
              placeholder="Enter your email"
            />
            @if (emailError()) {
              <span class="text-error text-sm mt-1 block">{{
                emailError()
              }}</span>
            }
          </div>

          <div class="mb-5">
            <label
              for="password"
              class="block mb-2 text-base text-primary font-medium"
              >Password</label
            >
            <div class="relative">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                class="w-full p-3 border-2 border-light rounded-lg text-base font-sans transition-all duration-300 box-border focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(141,110,99,0.1)]"
                [class.border-error]="passwordError()"
                placeholder="Enter your password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-accent cursor-pointer p-1 rounded transition-colors duration-300 hover:text-accent-hover"
                (click)="togglePassword()"
                [attr.aria-label]="
                  showPassword() ? 'Hide password' : 'Show password'
                "
              >
                @if (showPassword()) {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                }
              </button>
            </div>
            @if (passwordError()) {
              <span class="text-error text-sm mt-1 block">{{
                passwordError()
              }}</span>
            }
          </div>

          <div class="flex justify-between items-center mb-6 text-sm">
            <label class="flex items-center cursor-pointer text-accent-hover">
              <input
                type="checkbox"
                [(ngModel)]="rememberMe"
                name="rememberMe"
                class="hidden"
              />
              <span
                class="w-[18px] h-[18px] border-2 border-light rounded mr-2 relative transition-all duration-300 peer-checked:bg-accent peer-checked:border-accent"
                [class.bg-accent]="rememberMe"
                [class.border-accent]="rememberMe"
              >
                @if (rememberMe) {
                  <span
                    class="absolute left-[5px] top-[2px] w-1 h-2 border-solid border-white border-r-2 border-b-2 rotate-45"
                  ></span>
                }
              </span>
              Remember me
            </label>
          </div>

          <button
            type="submit"
            class="inline-block py-3 px-6 bg-accent text-white rounded-[30px] cursor-pointer text-base transition-all duration-300 border-none font-sans w-full mb-5 hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            [disabled]="isLoading() || !isFormValid()"
            [class.relative]="isLoading()"
          >
            @if (isLoading()) {
              <span
                class="inline-block w-4 h-4 border-2 border-white/30 rounded-full border-t-white animate-spin mr-2"
              ></span>
              Signing in...
            } @else {
              Sign In
            }
          </button>

          @if (loginError()) {
            <div
              class="text-error text-sm text-center mt-4 p-2.5 bg-error-bg rounded-md border border-error-border"
            >
              {{ loginError() }}
            </div>
          }
        </form>
      </div>
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
export default class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;

  // State signals
  showPassword = signal(false);
  isLoading = signal(false);
  emailError = signal('');
  passwordError = signal('');
  loginError = signal('');

  togglePassword() {
    this.showPassword.update((show) => !show);
  }

  isFormValid(): boolean {
    return (
      !!this.email &&
      !!this.password &&
      !this.emailError() &&
      !this.passwordError()
    );
  }

  onLogin() {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);
    this.loginError.set('');

    // Simulate API call - replace with your actual login logic
    setTimeout(() => {
      this.isLoading.set(false);
      // Simulate success or error
      if (this.email === 'demo@example.com' && this.password === 'password') {
        console.log('Login successful!');
        // Handle successful login
      } else {
        this.loginError.set('Invalid email or password. Please try again.');
      }
    }, 1500);
  }
}
