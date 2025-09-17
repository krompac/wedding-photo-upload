import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly #loading = signal(false);

  readonly loading = this.#loading.asReadonly();

  start(): void {
    this.#loading.set(true);
  }

  stop(): void {
    this.#loading.set(false);
  }
}
