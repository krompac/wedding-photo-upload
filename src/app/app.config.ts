import { provideFileRouter, requestContextInterceptor } from '@analogjs/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  FirebaseOptions,
  initializeApp,
  provideFirebaseApp,
} from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideClientHydration } from '@angular/platform-browser';

const options: FirebaseOptions = {
  apiKey: 'AIzaSyDl9aIkr467f4kiu4BONK6DV2ut1C0z7v8',
  projectId: 'wedding-upload-valsimot',
  messagingSenderId: '954841700391',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor]),
    ),
    provideClientHydration(),
    provideFirebaseApp(() => initializeApp(options)),
    provideAuth(() => getAuth()),
  ],
};
