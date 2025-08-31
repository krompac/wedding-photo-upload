import { RouteMeta } from '@analogjs/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { authGuard } from '../guards/auth.guard';

export const routeMeta: RouteMeta = {
  canActivate: [authGuard],
  title: 'Dashboard',
};

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardComponent],
  template: `<app-dashboard />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export default class DashboardPageComponent {}
