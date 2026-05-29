import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RiskService } from '../../core/services/risk.service';
import { JournalService } from '../../core/services/journal.service';
import { IndexSymbol, OptionType } from '../../core/models/trade.model';

@Component({
  selector: 'app-trade-planner',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Trade Planner</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Plan your index option entries and automatically validate risk parameters before buying.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Planner Form -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div class="pb-3 border-b border-slate-100 flex items-center gap-2">
            <mat-icon class="text-indigo-600">gps_fixed</mat-icon>
            <h2 class="text-lg font-bold text-slate-800">Plan Details</h2>
          </div>
          
          <form [formGroup]="plannerForm" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Symbol</mat-label>
                <mat-select formControlName="symbol">
                  <mat-option value="NIFTY">NIFTY</mat-option>
                  <mat-option value="BANKNIFTY">BANKNIFTY</mat-option>
                  <mat-option value="FINNIFTY">FINNIFTY</mat-option>
                  <mat-option value="SENSEX">SENSEX</mat-option>
                  <mat-option value="BANKEX">BANKEX</mat-option>
                  <mat-option value="OTHER">OTHER (Custom Stock/Index)</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="flex flex-col justify-center">
                <span class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 ml-1">Option Type</span>
                <mat-button-toggle-group formControlName="optionType" aria-label="Option Type" class="w-full h-[56px] rounded-xl overflow-hidden border border-slate-200">
                  <mat-button-toggle value="CE" class="flex-1 font-bold text-emerald-600">CE (Call)</mat-button-toggle>
                  <mat-button-toggle value="PE" class="flex-1 font-bold text-rose-600">PE (Put)</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
            </div>

            <div *ngIf="showCustomSymbol">
              <mat-form-field class="w-full">
                <mat-label>Custom Symbol (e.g. RELIANCE, TCS, AAPL)</mat-label>
                <input matInput formControlName="customSymbol" placeholder="Enter stock/index symbol">
                <mat-error *ngIf="plannerForm.get('customSymbol')?.invalid">
                  Symbol name is required.
                </mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Strike Price</mat-label>
                <input matInput type="number" formControlName="strike" placeholder="e.g. 22200">
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Entry Premium (₹)</mat-label>
                <input matInput type="number" formControlName="entryPremium" placeholder="e.g. 150">
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Lot Size / Lot Qty</mat-label>
                <input matInput type="number" formControlName="quantity" placeholder="e.g. 75">
                <mat-hint class="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                  <span>Lot Size: {{ currentLotSize }}</span>
                  <div class="space-x-1.5">
                    <button type="button" class="text-indigo-600 font-bold hover:underline" (click)="setToMultipleLots(1)">1 Lot</button>
                    <button type="button" class="text-indigo-600 font-bold hover:underline" (click)="setToMultipleLots(2)">2 Lots</button>
                  </div>
                </mat-hint>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Stop Loss Premium (₹)</mat-label>
                <input matInput type="number" formControlName="stopLossPremium" placeholder="e.g. 120">
                <mat-hint class="text-xs text-rose-500 font-bold mt-1">
                  Risk points: {{ getRiskPoints() | number:'1.1-1' }} pts
                </mat-hint>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Risk-Reward Target Ratio</mat-label>
                <mat-select formControlName="rrRatio">
                  <mat-option [value]="1.5">1:1.5</mat-option>
                  <mat-option [value]="2">1:2 (Recommended)</mat-option>
                  <mat-option [value]="2.5">1:2.5</mat-option>
                  <mat-option [value]="3">1:3</mat-option>
                  <mat-option [value]="4">1:4</mat-option>
                </mat-select>
                <mat-hint class="text-xs text-emerald-600 font-bold mt-1">
                  Auto target: ₹{{ getCalculatedTargetPrice() | number:'1.1-1' }}
                </mat-hint>
              </mat-form-field>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Premium Capital Invested</div>
                <div class="text-2xl font-black text-slate-800 mt-1">
                  ₹{{ (plannerForm.get('entryPremium')?.value || 0) * (plannerForm.get('quantity')?.value || 0) | number:'1.0-0' }}
                </div>
              </div>
              <div class="flex gap-4">
                <div>
                  <div class="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Maximum Loss (SL)</div>
                  <div class="text-lg font-black text-rose-600 mt-1">
                    ₹{{ getCalculatedMaxLoss() | number:'1.0-0' }}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Expected Profit</div>
                  <div class="text-lg font-black text-emerald-600 mt-1">
                    ₹{{ getCalculatedExpectedProfit() | number:'1.0-0' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button mat-flat-button color="primary" class="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold" [disabled]="plannerForm.invalid" (click)="saveToJournal()">
                <mat-icon class="mr-2">assignment</mat-icon>Save Trade to Journal
              </button>
            </div>
          </form>
        </div>

        <!-- Right Sidenav: Checklist & Psychology warnings -->
        <div class="space-y-6">
          <!-- Trade Validation checklist -->
          <div class="bg-white rounded-2xl border shadow-sm p-6 space-y-4" [ngClass]="checklist.passed ? 'border-emerald-200 bg-emerald-50/5' : 'border-rose-200 bg-rose-50/5'">
            <div class="pb-3 border-b flex items-center gap-2" [ngClass]="checklist.passed ? 'border-emerald-100 text-emerald-700' : 'border-rose-100 text-rose-700'">
              <mat-icon>{{ checklist.passed ? 'check_circle' : 'gpp_maybe' }}</mat-icon>
              <h2 class="text-base font-bold">Risk Validation Engine</h2>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">✓ Risk within limit (<= {{ maxTradeRiskAmount | number:'1.0-0' }}):</span>
                <mat-icon [ngClass]="checklist.riskWithinLimit ? 'text-emerald-500' : 'text-rose-500'" class="scale-90">
                  {{ checklist.riskWithinLimit ? 'check' : 'close' }}
                </mat-icon>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">✓ Daily limit not exceeded:</span>
                <mat-icon [ngClass]="checklist.dailyLossLimitNotExceeded ? 'text-emerald-500' : 'text-rose-500'" class="scale-90">
                  {{ checklist.dailyLossLimitNotExceeded ? 'check' : 'close' }}
                </mat-icon>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">✓ Risk-Reward >= 1:2 ratio:</span>
                <mat-icon [ngClass]="checklist.riskRewardValid ? 'text-emerald-500' : 'text-rose-500'" class="scale-90">
                  {{ checklist.riskRewardValid ? 'check' : 'close' }}
                </mat-icon>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">✓ Quantity valid (> 0):</span>
                <mat-icon [ngClass]="checklist.quantityValid ? 'text-emerald-500' : 'text-rose-500'" class="scale-90">
                  {{ checklist.quantityValid ? 'check' : 'close' }}
                </mat-icon>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">✓ Stop Loss present:</span>
                <mat-icon [ngClass]="checklist.stopLossPresent ? 'text-emerald-500' : 'text-rose-500'" class="scale-90">
                  {{ checklist.stopLossPresent ? 'check' : 'close' }}
                </mat-icon>
              </div>

              <div class="border-t pt-3 mt-4 text-center" [ngClass]="checklist.passed ? 'border-emerald-100' : 'border-rose-100'">
                <div class="text-[10px] uppercase tracking-wider font-bold" [ngClass]="checklist.passed ? 'text-emerald-700' : 'text-rose-700'">
                  Validation Status
                </div>
                <div class="text-lg font-black mt-1" [ngClass]="checklist.passed ? 'text-emerald-600' : 'text-rose-600'">
                  {{ checklist.passed ? 'TRADE APPROVED' : 'RISK TOO HIGH' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Psychology Guard Warnings -->
          <div *ngIf="warnings.length > 0" class="bg-white rounded-2xl border border-amber-200 bg-amber-50/5 shadow-sm p-6 space-y-4">
            <div class="pb-2 border-b border-amber-100 flex items-center gap-2 text-amber-700">
              <mat-icon>psychology</mat-icon>
              <h2 class="text-sm font-bold">Psychology Guard</h2>
            </div>
            <div class="space-y-3">
              <div *ngFor="let w of warnings" class="text-xs text-amber-800 border-l-2 border-amber-500 pl-2.5 leading-relaxed">
                {{ w }}
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
  `]
})
export class TradePlannerComponent implements OnInit {
  private readonly riskService = inject(RiskService);
  private readonly journalService = inject(JournalService);
  private readonly snackBar = inject(MatSnackBar);

  plannerForm!: FormGroup;

  currentLotSize = 25;
  maxTradeRiskAmount = 1000;

  // Real-time signals calculated
  checklist: any = {
    riskWithinLimit: false,
    dailyLossLimitNotExceeded: false,
    riskRewardValid: false,
    quantityValid: false,
    stopLossPresent: false,
    passed: false
  };

  warnings: string[] = [];
  showCustomSymbol = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.maxTradeRiskAmount = this.riskService.maxRiskPerTradeAmount();
    
    // Default form setup
    this.plannerForm = this.fb.group({
      symbol: ['NIFTY', [Validators.required]],
      customSymbol: ['', []],
      optionType: ['CE' as OptionType, [Validators.required]],
      strike: [22200, [Validators.required, Validators.min(1)]],
      entryPremium: [150, [Validators.required, Validators.min(1)]],
      quantity: [25, [Validators.required, Validators.min(1)]],
      stopLossPremium: [130, [Validators.required, Validators.min(0)]],
      rrRatio: [2, [Validators.required, Validators.min(0.5)]]
    });

    // Handle initial configurations based on symbol change
    this.plannerForm.get('symbol')?.valueChanges.subscribe(sym => {
      this.onSymbolChange(sym);
    });

    // Monitor changes and run calculations
    this.plannerForm.valueChanges.subscribe(() => {
      this.evaluatePlannerEngine();
    });

    // Run initial
    this.onSymbolChange('NIFTY');
    this.evaluatePlannerEngine();
  }

  onSymbolChange(val: string) {
    this.showCustomSymbol = (val === 'OTHER');
    if (this.showCustomSymbol) {
      this.plannerForm.get('customSymbol')?.setValidators([Validators.required]);
    } else {
      this.plannerForm.get('customSymbol')?.clearValidators();
    }
    this.plannerForm.get('customSymbol')?.updateValueAndValidity();

    const lotSizesMap = this.riskService.lotSizes();
    this.currentLotSize = lotSizesMap[val] || 25;
    
    // Auto adjust quantity to 1 lot if it was different
    this.plannerForm.get('quantity')?.patchValue(this.currentLotSize, { emitEvent: false });
  }

  setToMultipleLots(lots: number) {
    this.plannerForm.get('quantity')?.setValue(this.currentLotSize * lots);
  }

  getRiskPoints(): number {
    const entry = this.plannerForm.get('entryPremium')?.value || 0;
    const sl = this.plannerForm.get('stopLossPremium')?.value || 0;
    return Math.max(0, entry - sl);
  }

  getCalculatedTargetPrice(): number {
    const entry = this.plannerForm.get('entryPremium')?.value || 0;
    const risk = this.getRiskPoints();
    const ratio = this.plannerForm.get('rrRatio')?.value || 2;
    return entry + (risk * ratio);
  }

  getCalculatedMaxLoss(): number {
    const risk = this.getRiskPoints();
    const qty = this.plannerForm.get('quantity')?.value || 0;
    return risk * qty;
  }

  getCalculatedExpectedProfit(): number {
    const entry = this.plannerForm.get('entryPremium')?.value || 0;
    const target = this.getCalculatedTargetPrice();
    const qty = this.plannerForm.get('quantity')?.value || 0;
    return Math.max(0, target - entry) * qty;
  }

  evaluatePlannerEngine() {
    if (this.plannerForm.invalid) return;

    const { symbol, customSymbol, entryPremium, stopLossPremium, quantity, rrRatio } = this.plannerForm.value;
    const finalSymbol = symbol === 'OTHER' ? (customSymbol || '') : symbol;

    // 1. Checklist evaluate
    this.checklist = this.riskService.validateTrade(
      finalSymbol,
      entryPremium,
      stopLossPremium,
      quantity,
      rrRatio
    );

    // 2. Psychology warnings evaluate
    this.warnings = this.riskService.getPsychologyWarnings(
      entryPremium,
      stopLossPremium,
      quantity
    );
  }

  saveToJournal() {
    if (this.plannerForm.invalid) return;

    if (!this.checklist.passed) {
      if (!confirm('This trade does NOT meet risk criteria. Are you sure you want to log it?')) {
        return;
      }
    }

    const { symbol, customSymbol, optionType, strike, entryPremium, quantity, stopLossPremium, rrRatio } = this.plannerForm.value;
    const targetPremium = this.getCalculatedTargetPrice();
    const finalSymbol = symbol === 'OTHER' ? (customSymbol || '').toUpperCase().trim() : symbol;

    this.journalService.addTrade({
      date: new Date().toISOString().split('T')[0],
      symbol: finalSymbol,
      strike,
      optionType: optionType as OptionType,
      entryPremium,
      quantity,
      stopLossPremium,
      targetPremium,
      notes: `Planned trade with 1:${rrRatio} RR ratio.`
    });

    this.snackBar.open('Trade successfully saved to journal!', 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['bg-slate-900', 'text-white']
    });

    // Reset some values or redirect
    this.plannerForm.patchValue({
      entryPremium: 150,
      stopLossPremium: 130
    }, { emitEvent: true });
  }
}
