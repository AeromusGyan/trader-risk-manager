import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../core/services/settings.service';
import { JournalService } from '../../core/services/journal.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Settings</h1>
          <p class="text-slate-500 mt-1">Configure your trading capital, risk thresholds, and lot sizes.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Settings Form -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div class="pb-3 border-b border-slate-100 flex items-center gap-2">
            <mat-icon class="text-indigo-600">tune</mat-icon>
            <h2 class="text-lg font-bold text-slate-800">Risk Parameters</h2>
          </div>
          
          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Trading Capital (₹)</mat-label>
                <input matInput type="number" formControlName="capital" placeholder="e.g. 100000">
                <mat-icon matSuffix class="text-slate-400">payments</mat-icon>
                <mat-error *ngIf="settingsForm.get('capital')?.hasError('required')">Capital is required</mat-error>
                <mat-error *ngIf="settingsForm.get('capital')?.hasError('min')">Capital must be greater than 0</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Max Risk Per Trade (%)</mat-label>
                <input matInput type="number" formControlName="maxRiskPerTradePercent" placeholder="e.g. 1">
                <span matSuffix class="text-slate-400 font-bold mr-2">%</span>
                <mat-error *ngIf="settingsForm.get('maxRiskPerTradePercent')?.hasError('required')">Required</mat-error>
                <mat-error *ngIf="settingsForm.get('maxRiskPerTradePercent')?.hasError('min')">Min 0.1%</mat-error>
                <mat-error *ngIf="settingsForm.get('maxRiskPerTradePercent')?.hasError('max')">Max 10%</mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Daily Risk Limit (%)</mat-label>
                <input matInput type="number" formControlName="dailyRiskPercent" placeholder="e.g. 2">
                <span matSuffix class="text-slate-400 font-bold mr-2">%</span>
                <mat-error *ngIf="settingsForm.get('dailyRiskPercent')?.hasError('required')">Required</mat-error>
                <mat-error *ngIf="settingsForm.get('dailyRiskPercent')?.hasError('min')">Min 0.5%</mat-error>
                <mat-error *ngIf="settingsForm.get('dailyRiskPercent')?.hasError('max')">Max 20%</mat-error>
              </mat-form-field>

              <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between h-[56px]">
                <div>
                  <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Daily Loss Limit Amount</div>
                  <div class="text-base font-extrabold text-rose-600 mt-1">
                    ₹{{ getDailyLossLimitAmount() | number:'1.0-0' }}
                  </div>
                </div>
                <mat-icon class="text-rose-500">trending_down</mat-icon>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">
                Indices Lot Sizes
              </h3>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4" formGroupName="lotSizes">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>NIFTY</mat-label>
                  <input matInput type="number" formControlName="NIFTY">
                  <mat-error *ngIf="settingsForm.get('lotSizes.NIFTY')?.invalid">Required, Min 1</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>BANKNIFTY</mat-label>
                  <input matInput type="number" formControlName="BANKNIFTY">
                  <mat-error *ngIf="settingsForm.get('lotSizes.BANKNIFTY')?.invalid">Required, Min 1</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>FINNIFTY</mat-label>
                  <input matInput type="number" formControlName="FINNIFTY">
                  <mat-error *ngIf="settingsForm.get('lotSizes.FINNIFTY')?.invalid">Required, Min 1</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>SENSEX</mat-label>
                  <input matInput type="number" formControlName="SENSEX">
                  <mat-error *ngIf="settingsForm.get('lotSizes.SENSEX')?.invalid">Required, Min 1</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>BANKEX</mat-label>
                  <input matInput type="number" formControlName="BANKEX">
                  <mat-error *ngIf="settingsForm.get('lotSizes.BANKEX')?.invalid">Required, Min 1</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-slate-100">
              <button mat-flat-button color="primary" type="submit" [disabled]="settingsForm.invalid" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
                <mat-icon class="mr-2">save</mat-icon>Save Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Danger Zone & Utilities -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div class="pb-2 border-b border-slate-100 flex items-center gap-2">
              <mat-icon class="text-amber-500">info</mat-icon>
              <h2 class="text-base font-bold text-slate-800">Settings Details</h2>
            </div>
            <div class="space-y-4 text-sm text-slate-600">
              <p>Risk management is the key difference between successful traders and those who blow up their accounts.</p>
              <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-950">
                <strong>Rule of Thumb:</strong> Never risk more than 2% of your capital on a single day. And never risk more than 1% on a single trade.
              </div>
              <p>These settings govern the **Checklists** and **Psychology Guards** throughout the dashboard and planners.</p>
            </div>
          </div>

          <div class="bg-rose-50/20 rounded-2xl border border-rose-100 shadow-sm p-6 space-y-4">
            <div class="pb-2 border-b border-rose-100 flex items-center gap-2">
              <mat-icon class="text-rose-500">gavel</mat-icon>
              <h2 class="text-base font-bold text-rose-700">Danger Zone</h2>
            </div>
            <div class="space-y-4">
              <p class="text-xs text-slate-500">Actions here will affect your local storage data permanently.</p>
              
              <div class="space-y-3">
                <button mat-stroked-button color="warn" class="w-full flex justify-center py-2.5 rounded-xl" (click)="resetSettings()">
                  <mat-icon class="mr-2">restart_alt</mat-icon>Reset to Defaults
                </button>
                
                <button mat-flat-button color="warn" class="w-full flex justify-center py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl" (click)="clearJournal()">
                  <mat-icon class="mr-2">delete_forever</mat-icon>Clear Trading Journal
                </button>

                <button mat-stroked-button class="w-full flex justify-center py-2.5 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50" (click)="loadSampleData()">
                  <mat-icon class="mr-2">folder_zip</mat-icon>Load Demo Trades
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      margin-bottom: 4px;
    }
  `]
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly journalService = inject(JournalService);
  private readonly snackBar = inject(MatSnackBar);
  
  settingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    const s = this.settingsService.settings();
    
    this.settingsForm = this.fb.group({
      capital: [s.capital, [Validators.required, Validators.min(1)]],
      dailyRiskPercent: [s.dailyRiskPercent, [Validators.required, Validators.min(0.5), Validators.max(20)]],
      maxRiskPerTradePercent: [s.maxRiskPerTradePercent, [Validators.required, Validators.min(0.1), Validators.max(10)]],
      lotSizes: this.fb.group({
        NIFTY: [s.lotSizes.NIFTY, [Validators.required, Validators.min(1)]],
        BANKNIFTY: [s.lotSizes.BANKNIFTY, [Validators.required, Validators.min(1)]],
        FINNIFTY: [s.lotSizes.FINNIFTY, [Validators.required, Validators.min(1)]],
        SENSEX: [s.lotSizes.SENSEX, [Validators.required, Validators.min(1)]],
        BANKEX: [s.lotSizes.BANKEX, [Validators.required, Validators.min(1)]]
      })
    });
  }

  getDailyLossLimitAmount(): number {
    const cap = this.settingsForm.get('capital')?.value || 0;
    const r = this.settingsForm.get('dailyRiskPercent')?.value || 0;
    return (cap * r) / 100;
  }

  saveSettings() {
    if (this.settingsForm.valid) {
      this.settingsService.updateSettings(this.settingsForm.value);
      this.snackBar.open('Settings saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: ['bg-slate-900', 'text-white']
      });
    }
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.settingsService.resetSettings();
      const s = this.settingsService.settings();
      this.settingsForm.patchValue(s);
      this.snackBar.open('Settings reset to default.', 'Close', { duration: 3000 });
    }
  }

  clearJournal() {
    if (confirm('WARNING: Are you sure you want to delete ALL trades from your journal? This cannot be undone.')) {
      this.journalService.clearJournal();
      this.snackBar.open('Trading journal cleared.', 'Close', { duration: 3000 });
    }
  }

  loadSampleData() {
    if (confirm('This will load historical demo trades into your journal. Proceed?')) {
      this.journalService.loadSampleData();
      this.snackBar.open('Demo trades loaded successfully!', 'Close', { duration: 3000 });
    }
  }
}
