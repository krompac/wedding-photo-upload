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
  apiKey: process.env['FIREBASE_API_KEY'],
  projectId: process.env['FIREBASE_PROJECT_ID'],
  messagingSenderId: process.env['FIREBASE_SENDER_ID'],
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
