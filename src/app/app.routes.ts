import { Routes } from '@angular/router';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CalculatorsComponent } from './features/calculators/calculators.component';
import { TradePlannerComponent } from './features/trade-planner/trade-planner.component';
import { TradingJournalComponent } from './features/trading-journal/trading-journal.component';
import { SettingsComponent } from './features/settings/settings.component';
import { GuideComponent } from './features/guide/guide.component';
import { PaperAnalyticsComponent } from './features/paper-analytics/paper-analytics.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'calculators', component: CalculatorsComponent },
      { path: 'planner', component: TradePlannerComponent },
      { path: 'journal', component: TradingJournalComponent },
      { path: 'paper-analytics', component: PaperAnalyticsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'guide', component: GuideComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
