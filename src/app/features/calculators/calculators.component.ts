import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RiskService } from '../../core/services/risk.service';

@Component({
  selector: 'app-calculators',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Calculators</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Pre-trade calculators to plan entry, exit, and sizing parameters.</p>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <mat-tab-group animationDuration="150ms">
          <!-- Tab 1: Stop Loss Calculator -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2">shield</mat-icon>Stop Loss
            </ng-template>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Inputs -->
                <div class="space-y-4">
                  <h3 class="text-base font-bold text-slate-700">Inputs</h3>
                  <form [formGroup]="slForm" class="space-y-4">
                    <mat-form-field class="w-full">
                      <mat-label>Trading Capital (₹)</mat-label>
                      <input matInput type="number" formControlName="capital">
                    </mat-form-field>
                    
                    <mat-form-field class="w-full">
                      <mat-label>Risk Percentage (%)</mat-label>
                      <input matInput type="number" formControlName="riskPercent">
                      <span matSuffix class="mr-2 font-bold">%</span>
                    </mat-form-field>

                    <div class="grid grid-cols-2 gap-4">
                      <mat-form-field class="w-full">
                        <mat-label>Entry Price (₹)</mat-label>
                        <input matInput type="number" formControlName="entryPrice">
                      </mat-form-field>

                      <mat-form-field class="w-full">
                        <mat-label>Quantity</mat-label>
                        <input matInput type="number" formControlName="quantity">
                      </mat-form-field>
                    </div>
                  </form>
                </div>

                <!-- Outputs -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Calculated Outputs</h3>
                    
                    <div class="space-y-6">
                      <div>
                        <div class="text-xs text-slate-400 font-bold uppercase leading-none">Risk Amount</div>
                        <div class="text-2xl font-black text-slate-800 mt-1">
                          ₹{{ slOutputs.riskAmount | number:'1.0-0' }}
                        </div>
                        <div class="text-xs text-slate-400 mt-1">Total cash at risk</div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Risk Per Unit</div>
                          <div class="text-lg font-bold text-slate-800 mt-1">
                            ₹{{ slOutputs.riskPerUnit | number:'1.2-2' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[10px] text-rose-500 font-bold uppercase leading-none">Stop Loss Price</div>
                          <div class="text-lg font-black text-rose-600 mt-1">
                            ₹{{ slOutputs.stopLossPrice | number:'1.2-2' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2">
                    <mat-icon class="text-rose-500 shrink-0">warning</mat-icon>
                    <span>If the premium drops below <strong>₹{{ slOutputs.stopLossPrice | number:'1.2-2' }}</strong>, exit immediately to protect capital.</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Position Size Calculator -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2">calculate</mat-icon>Position Sizing
            </ng-template>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Inputs -->
                <div class="space-y-4">
                  <h3 class="text-base font-bold text-slate-700">Inputs</h3>
                  <form [formGroup]="posForm" class="space-y-4">
                    <mat-form-field class="w-full">
                      <mat-label>Trading Capital (₹)</mat-label>
                      <input matInput type="number" formControlName="capital">
                    </mat-form-field>
                    
                    <mat-form-field class="w-full">
                      <mat-label>Max Risk Amount (₹)</mat-label>
                      <input matInput type="number" formControlName="maxRiskAmount">
                      <mat-hint class="text-xs text-slate-400">Recommended: {{ posForm.get('capital')?.value * 0.01 | number:'1.0-0' }} (1%)</mat-hint>
                    </mat-form-field>

                    <div class="grid grid-cols-2 gap-4 pt-2">
                      <mat-form-field class="w-full">
                        <mat-label>Entry Price (₹)</mat-label>
                        <input matInput type="number" formControlName="entryPrice">
                      </mat-form-field>

                      <mat-form-field class="w-full">
                        <mat-label>Stop Loss Price (₹)</mat-label>
                        <input matInput type="number" formControlName="stopLossPrice">
                      </mat-form-field>
                    </div>
                  </form>
                </div>

                <!-- Outputs -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Calculated Outputs</h3>
                    
                    <div class="space-y-6">
                      <div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Risk Per Unit (Points)</div>
                        <div class="text-xl font-bold text-slate-800 mt-1">
                          ₹{{ posOutputs.perUnitRisk | number:'1.2-2' }}
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-[10px] text-emerald-600 font-bold uppercase leading-none">Max Qty Allowed</div>
                          <div class="text-lg font-black text-emerald-600 mt-1">
                            {{ posOutputs.maxQuantity }} units
                          </div>
                        </div>
                        
                        <div>
                          <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Capital Utilization</div>
                          <div class="text-lg font-bold text-slate-800 mt-1">
                            ₹{{ posOutputs.capitalUtilization | number:'1.0-0' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs flex gap-2">
                    <mat-icon class="text-indigo-500 shrink-0">info</mat-icon>
                    <span>To stay within your ₹{{ posForm.get('maxRiskAmount')?.value }} limit, buy no more than <strong>{{ posOutputs.maxQuantity }}</strong> units.</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Risk Reward Calculator -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2">analytics</mat-icon>Risk Reward
            </ng-template>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Inputs -->
                <div class="space-y-4">
                  <h3 class="text-base font-bold text-slate-700">Inputs</h3>
                  <form [formGroup]="rrForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <mat-form-field class="w-full">
                        <mat-label>Entry Price (₹)</mat-label>
                        <input matInput type="number" formControlName="entryPrice">
                      </mat-form-field>

                      <mat-form-field class="w-full">
                        <mat-label>Stop Loss Price (₹)</mat-label>
                        <input matInput type="number" formControlName="stopLossPrice">
                      </mat-form-field>
                    </div>

                    <mat-form-field class="w-full">
                      <mat-label>Risk Reward Ratio</mat-label>
                      <mat-select formControlName="ratio">
                        <mat-option [value]="1">1:1</mat-option>
                        <mat-option [value]="2">1:2 (Recommended)</mat-option>
                        <mat-option [value]="3">1:3</mat-option>
                        <mat-option [value]="4">1:4</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </form>
                </div>

                <!-- Outputs -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Calculated Outputs</h3>
                    
                    <div class="space-y-6">
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-[10px] text-rose-500 font-bold uppercase leading-none">Risk Per Unit</div>
                          <div class="text-lg font-bold text-rose-500 mt-1">
                            ₹{{ rrOutputs.risk | number:'1.2-2' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[10px] text-emerald-600 font-bold uppercase leading-none">Target Price</div>
                          <div class="text-lg font-black text-emerald-600 mt-1">
                            ₹{{ rrOutputs.targetPrice | number:'1.2-2' }}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Expected Profit Per Unit</div>
                        <div class="text-xl font-bold text-slate-800 mt-1">
                          ₹{{ rrOutputs.expectedProfit | number:'1.2-2' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex gap-2">
                    <mat-icon class="text-emerald-500 shrink-0">check_circle</mat-icon>
                    <span>Aiming for ratio 1:{{ rrForm.get('ratio')?.value }}. Take profit target is <strong>₹{{ rrOutputs.targetPrice | number:'1.2-2' }}</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 4: Option Buying Mode (Beginners) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2">child_care</mat-icon>Option Buying (Beginner)
            </ng-template>
            <div class="p-6 space-y-6">
              <div class="bg-indigo-50 p-4 border border-indigo-100 rounded-2xl flex gap-3 text-indigo-900">
                <mat-icon class="text-indigo-600 shrink-0">school</mat-icon>
                <div class="text-xs space-y-1">
                  <strong>Option Buying Mode:</strong> Designed specifically for beginners. Calculates premium thresholds and limits risk automatically according to your capital settings to prevent accounts from blowing up.
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Inputs -->
                <div class="space-y-4">
                  <h3 class="text-base font-bold text-slate-700">Inputs</h3>
                  <form [formGroup]="beginnerForm" class="space-y-4">
                    <mat-form-field class="w-full">
                      <mat-label>Trading Capital (₹)</mat-label>
                      <input matInput type="number" formControlName="capital">
                    </mat-form-field>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <mat-form-field class="w-full">
                        <mat-label>Entry Premium (₹)</mat-label>
                        <input matInput type="number" formControlName="entryPremium">
                      </mat-form-field>

                      <mat-form-field class="w-full">
                        <mat-label>Quantity</mat-label>
                        <input matInput type="number" formControlName="quantity">
                      </mat-form-field>
                    </div>
                  </form>
                </div>

                <!-- Outputs -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Risk Safeguards</h3>
                    
                    <div class="space-y-6">
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-[10px] text-rose-500 font-bold uppercase leading-none">Max Safe Stop Loss</div>
                          <div class="text-lg font-black text-rose-600 mt-1">
                            ₹{{ beginnerOutputs.maxSafeStopLoss | number:'1.2-2' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Risk of Capital</div>
                          <div class="text-lg font-bold text-slate-800 mt-1">
                            {{ beginnerOutputs.riskPercentOfCapital | number:'1.2-2' }}%
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-[10px] text-emerald-600 font-bold uppercase leading-none">Target Premium (1:2)</div>
                          <div class="text-lg font-black text-emerald-600 mt-1">
                            ₹{{ beginnerOutputs.targetPremium1to2 | number:'1.2-2' }}
                          </div>
                        </div>
                        <div>
                          <div class="text-[10px] text-slate-400 font-bold uppercase leading-none">Break Even Premium</div>
                          <div class="text-lg font-bold text-slate-800 mt-1">
                            ₹{{ beginnerOutputs.breakEvenPremium | number:'1.2-2' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex gap-2">
                    <mat-icon class="text-amber-500 shrink-0">psychology</mat-icon>
                    <span>Beginner tip: Exit immediately if premium touches <strong>₹{{ beginnerOutputs.maxSafeStopLoss | number:'1.2-2' }}</strong>. Break even is <strong>₹{{ beginnerOutputs.breakEvenPremium | number:'1.2-2' }}</strong> (includes brokerage).</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CalculatorsComponent implements OnInit {
  private readonly riskService = inject(RiskService);
  
  // Forms
  slForm!: FormGroup;
  posForm!: FormGroup;
  rrForm!: FormGroup;
  beginnerForm!: FormGroup;

  // Outputs
  slOutputs = { riskAmount: 0, riskPerUnit: 0, stopLossPrice: 0 };
  posOutputs = { perUnitRisk: 0, maxQuantity: 0, capitalUtilization: 0 };
  rrOutputs = { risk: 0, targetPrice: 0, expectedProfit: 0 };
  beginnerOutputs = { maxSafeStopLoss: 0, riskAmount: 0, riskPercentOfCapital: 0, targetPremium1to2: 0, breakEvenPremium: 0 };

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const capitalVal = this.riskService.capital();
    const tradeRiskVal = this.riskService.maxRiskPerTradePercent();

    // 1. SL Form
    this.slForm = this.fb.group({
      capital: [capitalVal, [Validators.required, Validators.min(1)]],
      riskPercent: [tradeRiskVal, [Validators.required, Validators.min(0.1)]],
      entryPrice: [100, [Validators.required, Validators.min(1)]],
      quantity: [75, [Validators.required, Validators.min(1)]]
    });

    // 2. Position Form
    this.posForm = this.fb.group({
      capital: [capitalVal, [Validators.required, Validators.min(1)]],
      maxRiskAmount: [this.riskService.maxRiskPerTradeAmount(), [Validators.required, Validators.min(1)]],
      entryPrice: [100, [Validators.required, Validators.min(1)]],
      stopLossPrice: [85, [Validators.required, Validators.min(0)]]
    });

    // 3. RR Form
    this.rrForm = this.fb.group({
      entryPrice: [100, [Validators.required, Validators.min(1)]],
      stopLossPrice: [85, [Validators.required, Validators.min(0)]],
      ratio: [2, [Validators.required]]
    });

    // 4. Beginner Form
    this.beginnerForm = this.fb.group({
      capital: [capitalVal, [Validators.required, Validators.min(1)]],
      entryPremium: [100, [Validators.required, Validators.min(1)]],
      quantity: [75, [Validators.required, Validators.min(1)]]
    });

    // Listen to value changes
    this.slForm.valueChanges.subscribe(() => this.runSLCalculations());
    this.posForm.valueChanges.subscribe(() => this.runPositionCalculations());
    this.rrForm.valueChanges.subscribe(() => this.runRRCalculations());
    this.beginnerForm.valueChanges.subscribe(() => this.runBeginnerCalculations());

    // Run initial calculations
    this.runSLCalculations();
    this.runPositionCalculations();
    this.runRRCalculations();
    this.runBeginnerCalculations();
  }

  runSLCalculations() {
    if (this.slForm.invalid) return;
    const { entryPrice, quantity, riskPercent, capital } = this.slForm.value;
    
    // We compute local values manually or hook up service methods. Since service reads signals, we override settings dynamically
    const riskAmount = (capital * riskPercent) / 100;
    const riskPerUnit = quantity > 0 ? riskAmount / quantity : 0;
    const stopLossPrice = Math.max(0, entryPrice - riskPerUnit);

    this.slOutputs = { riskAmount, riskPerUnit, stopLossPrice };
  }

  runPositionCalculations() {
    if (this.posForm.invalid) return;
    const { maxRiskAmount, entryPrice, stopLossPrice } = this.posForm.value;

    const perUnitRisk = Math.max(0, entryPrice - stopLossPrice);
    const maxQuantity = perUnitRisk > 0 ? Math.floor(maxRiskAmount / perUnitRisk) : 0;
    const capitalUtilization = maxQuantity * entryPrice;

    this.posOutputs = { perUnitRisk, maxQuantity, capitalUtilization };
  }

  runRRCalculations() {
    if (this.rrForm.invalid) return;
    const { entryPrice, stopLossPrice, ratio } = this.rrForm.value;

    const risk = Math.max(0, entryPrice - stopLossPrice);
    const targetPrice = entryPrice + (risk * ratio);
    const expectedProfit = risk * ratio;

    this.rrOutputs = { risk, targetPrice, expectedProfit };
  }

  runBeginnerCalculations() {
    if (this.beginnerForm.invalid) return;
    const { capital, entryPremium, quantity } = this.beginnerForm.value;
    
    const maxRiskAmount = (capital * this.riskService.maxRiskPerTradePercent()) / 100;
    const perUnitMaxRisk = quantity > 0 ? maxRiskAmount / quantity : 0;
    const maxSafeStopLoss = Math.max(0, entryPremium - perUnitMaxRisk);

    const actualRiskAmount = (entryPremium - maxSafeStopLoss) * quantity;
    const riskPercentOfCapital = capital > 0 ? (actualRiskAmount / capital) * 100 : 0;
    
    const riskPerUnit = entryPremium - maxSafeStopLoss;
    const targetPremium1to2 = entryPremium + (riskPerUnit * 2);
    const breakEvenPremium = entryPremium + (quantity > 0 ? 40 / quantity : 0);

    this.beginnerOutputs = {
      maxSafeStopLoss,
      riskAmount: actualRiskAmount,
      riskPercentOfCapital,
      targetPremium1to2,
      breakEvenPremium
    };
  }
}
