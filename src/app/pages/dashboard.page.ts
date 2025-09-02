import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardComponent } from '../components/dashboard/dashboard.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardComponent],
  template: `<app-dashboard />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export default class DashboardPageComponent {}
