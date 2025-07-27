import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import './styles.scss';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
