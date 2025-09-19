import { Injectable } from '@angular/core';
import Toastify from 'toastify-js';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  showError(error: string): void {
    const toast = Toastify({
      text: error,
      className: 'error',
      duration: 3000,
      onClick() {
        toast.hideToast();
      },
    });

    toast.showToast();
  }
}
