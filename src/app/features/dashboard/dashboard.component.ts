import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { JournalService } from '../../core/services/journal.service';
import { RiskService } from '../../core/services/risk.service';
import { SettingsService } from '../../core/services/settings.service';
import { IndexSymbol } from '../../core/models/trade.model';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Psychology Alert Banner (Top level) -->
      <div *ngIf="isDailyLimitExceeded" class="bg-rose-600 text-white p-6 rounded-2xl shadow-lg border border-rose-700 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-rose-700/50 rounded-xl">
            <mat-icon class="scale-125 text-white">gavel</mat-icon>
          </div>
          <div>
            <h2 class="text-xl md:text-2xl font-black uppercase tracking-wide">Stop Trading For Today</h2>
            <p class="text-rose-100 text-sm mt-0.5 font-medium">Your daily loss limit of ₹{{ dailyLossLimit | number:'1.0-0' }} has been reached. Lock your terminal to protect capital.</p>
          </div>
        </div>
        <div class="shrink-0">
          <span class="bg-rose-900/60 border border-rose-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg uppercase">
            Psychology Guard Active
          </span>
        </div>
      </div>

      <!-- General Statistics row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Capital Card -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <mat-card-content class="p-5 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trading Capital</span>
              <div class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                ₹{{ capital | number:'1.0-0' }}
              </div>
            </div>
            <div class="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <mat-icon>payments</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Net P&L Card -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <mat-card-content class="p-5 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Net P&L</span>
              <div class="text-xl md:text-2xl font-black" [ngClass]="stats.totalPL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ stats.totalPL >= 0 ? '+' : '' }}₹{{ stats.totalPL | number:'1.0-0' }}
              </div>
            </div>
            <div class="p-2.5 rounded-xl" [ngClass]="stats.totalPL >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'">
              <mat-icon>{{ stats.totalPL >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Win Rate Card -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <mat-card-content class="p-5 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Win Rate</span>
              <div class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                {{ stats.winRate | number:'1.1-1' }}%
              </div>
            </div>
            <div class="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <mat-icon>emoji_events</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Total Trades Card -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <mat-card-content class="p-5 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trades logged</span>
              <div class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                {{ stats.totalTrades }} <span class="text-xs text-slate-400 font-medium">(open: {{ stats.openTrades }})</span>
              </div>
            </div>
            <div class="p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400">
              <mat-icon>menu_book</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Main Section: Charts and Pre-trade checklists -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Equity curve card -->
        <mat-card class="lg:col-span-2 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl">
          <mat-card-header class="pb-3 border-b border-slate-100 dark:border-slate-800">
            <mat-card-title class="text-base font-bold flex items-center gap-2">
              <mat-icon class="text-indigo-600 dark:text-indigo-400">show_chart</mat-icon>
              Capital Growth (Equity Curve)
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-6">
            <div class="h-64 sm:h-80 w-full relative">
              <canvas #equityChartCanvas class="w-full h-full"></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pre-trade validator checklist widget -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <mat-card-header class="pb-3 border-b border-slate-100 dark:border-slate-800">
              <mat-card-title class="text-base font-bold flex items-center gap-2">
                <mat-icon class="text-indigo-600 dark:text-indigo-400">verified</mat-icon>
                Pre-Trade Verification
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="pt-4 space-y-4">
              <!-- Validator mini-inputs -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Symbol</label>
                  <select [(ngModel)]="valSymbol" (change)="runValidation()" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
                    <option value="NIFTY">NIFTY</option>
                    <option value="BANKNIFTY">BANKNIFTY</option>
                    <option value="FINNIFTY">FINNIFTY</option>
                    <option value="SENSEX">SENSEX</option>
                    <option value="BANKEX">BANKEX</option>
                    <option value="OTHER">OTHER (Custom)</option>
                  </select>
                </div>
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Lot Size</label>
                  <input type="text" readonly [value]="lotSize" class="w-full text-sm bg-slate-100 border dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg p-2">
                </div>
              </div>

              <div *ngIf="showCustomSymbol" class="flex flex-col">
                <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Custom Symbol Name</label>
                <input type="text" [(ngModel)]="valCustomSymbol" (input)="runValidation()" placeholder="e.g. RELIANCE" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Entry Premium (₹)</label>
                  <input type="number" [(ngModel)]="valEntry" (ngModelChange)="runValidation()" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Stop Loss (₹)</label>
                  <input type="number" [(ngModel)]="valSL" (ngModelChange)="runValidation()" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Quantity</label>
                  <input type="number" [(ngModel)]="valQuantity" (ngModelChange)="runValidation()" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <label class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">R:R Ratio (1:x)</label>
                  <input type="number" [(ngModel)]="valRatio" (ngModelChange)="runValidation()" class="w-full text-sm bg-slate-50 border dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none">
                </div>
              </div>

              <!-- Checklist indicator -->
              <div class="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400 font-medium">Risk per trade <= Max Allowable (₹{{ maxTradeRiskAmount | number:'1.0-0' }}):</span>
                  <mat-icon [ngClass]="checklist.riskWithinLimit ? 'text-emerald-500' : 'text-rose-500'" class="scale-75 shrink-0">
                    {{ checklist.riskWithinLimit ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400 font-medium">Daily loss limit not exceeded:</span>
                  <mat-icon [ngClass]="checklist.dailyLossLimitNotExceeded ? 'text-emerald-500' : 'text-rose-500'" class="scale-75 shrink-0">
                    {{ checklist.dailyLossLimitNotExceeded ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-400 font-medium">R:R Ratio is >= 1:2:</span>
                  <mat-icon [ngClass]="checklist.riskRewardValid ? 'text-emerald-500' : 'text-rose-500'" class="scale-75 shrink-0">
                    {{ checklist.riskRewardValid ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </div>
              </div>
            </mat-card-content>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between rounded-b-2xl" [ngClass]="checklist.passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'">
            <div class="text-xs uppercase font-extrabold" [ngClass]="checklist.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
              {{ checklist.passed ? 'CHECKLIST PASSED' : 'CHECKLIST FAILED' }}
            </div>
            <button mat-button color="primary" routerLink="/planner" class="text-xs">
              Open Full Planner →
            </button>
          </div>
        </mat-card>
      </div>

      <!-- Bottom Charts Row: Distribution charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Monthly profits bar chart -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl">
          <mat-card-header class="pb-3 border-b border-slate-100 dark:border-slate-800">
            <mat-card-title class="text-base font-bold flex items-center gap-2">
              <mat-icon class="text-indigo-600 dark:text-indigo-400">bar_chart</mat-icon>
              Monthly Net P&L (₹)
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-6">
            <div class="h-60 w-full relative">
              <canvas #monthlyChartCanvas></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Win/Loss distribution pie chart -->
        <mat-card class="shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl">
          <mat-card-header class="pb-3 border-b border-slate-100 dark:border-slate-800">
            <mat-card-title class="text-base font-bold flex items-center gap-2">
              <mat-icon class="text-indigo-600 dark:text-indigo-400">pie_chart</mat-icon>
              Win/Loss Ratio
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-6 flex justify-center">
            <div class="h-60 w-80 relative flex items-center justify-center">
              <canvas #pieChartCanvas></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Advanced stats metrics cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center space-y-1">
          <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Profit (Wins)</span>
          <div class="text-base font-extrabold text-emerald-600">
            +₹{{ stats.averageProfit | number:'1.0-0' }}
          </div>
        </div>
        <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center space-y-1">
          <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Loss (Losses)</span>
          <div class="text-base font-extrabold text-rose-600">
            -₹{{ stats.averageLoss | number:'1.0-0' }}
          </div>
        </div>
        <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center space-y-1">
          <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Largest Profit</span>
          <div class="text-base font-extrabold text-emerald-600">
            +₹{{ stats.largestProfit | number:'1.0-0' }}
          </div>
        </div>
        <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center space-y-1">
          <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Largest Loss</span>
          <div class="text-base font-extrabold text-rose-600">
            -₹{{ Math.abs(stats.largestLoss) | number:'1.0-0' }}
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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly journalService = inject(JournalService);
  private readonly riskService = inject(RiskService);
  private readonly settingsService = inject(SettingsService);

  // Math object export to use inside template
  Math = Math;

  // View Child canvas element references
  @ViewChild('equityChartCanvas') equityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChartCanvas') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Charts references
  equityChart: Chart | null = null;
  monthlyChart: Chart | null = null;
  pieChart: Chart | null = null;

  // Quick signals
  capital = 100000;
  dailyLossLimit = 2000;
  maxTradeRiskAmount = 1000;
  isDailyLimitExceeded = false;

  // Calculator inputs inside validation checker widget
  // Calculator inputs inside validation checker widget
  valSymbol: string = 'NIFTY';
  valCustomSymbol = '';
  showCustomSymbol = false;
  lotSize = 25;
  valEntry = 150;
  valSL = 135;
  valQuantity = 25;
  valRatio = 2;

  // Reactive signals tracking checklist and stats
  checklist = {
    riskWithinLimit: false,
    dailyLossLimitNotExceeded: false,
    riskRewardValid: false,
    quantityValid: false,
    stopLossPresent: false,
    passed: false
  };

  constructor() {
    // Setup side-effect to monitor signals changes and update charts
    effect(() => {
      // Accessing signals of journalService.trades() to trigger effect execution reactively
      const _ = this.journalService.trades();
      
      // Update variables
      this.capital = this.riskService.capital();
      this.dailyLossLimit = this.riskService.dailyLossLimit();
      this.maxTradeRiskAmount = this.riskService.maxRiskPerTradeAmount();
      this.isDailyLimitExceeded = this.riskService.isDailyLossExceeded();

      // Render charts if view is initialized
      if (this.equityChartCanvas) {
        this.renderCharts();
      }
    });
  }

  get stats() {
    return this.journalService.stats();
  }

  ngOnInit() {
    this.updateLotSize();
    this.runValidation();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.renderCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  updateLotSize() {
    this.showCustomSymbol = (this.valSymbol === 'OTHER');
    const lotMap = this.settingsService.settings().lotSizes;
    this.lotSize = lotMap[this.valSymbol] || 25;
    this.valQuantity = this.lotSize;
  }

  runValidation() {
    this.updateLotSize();
    const finalSymbol = this.valSymbol === 'OTHER' ? (this.valCustomSymbol || '') : this.valSymbol;
    this.checklist = this.riskService.validateTrade(
      finalSymbol,
      this.valEntry,
      this.valSL,
      this.valQuantity,
      this.valRatio
    );
  }

  destroyCharts() {
    if (this.equityChart) this.equityChart.destroy();
    if (this.monthlyChart) this.monthlyChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
  }

  renderCharts() {
    this.destroyCharts();

    const isDark = document.documentElement.classList.contains('dark');
    const textColour = isDark ? '#9ca3af' : '#4b5563';
    const gridColour = isDark ? '#1f2937' : '#e5e7eb';

    // 1. Equity Curve
    const equityData = this.journalService.equityCurve();
    const equityLabels = equityData.map(d => d.label);
    const equityValues = equityData.map(d => d.value);

    this.equityChart = new Chart(this.equityChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: equityLabels,
        datasets: [{
          label: 'Capital (₹)',
          data: equityValues,
          borderColor: '#6366f1', // Indigo 500
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.25,
          borderWidth: 3,
          pointRadius: equityValues.length > 50 ? 0 : 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColour, font: { family: 'Outfit', size: 10 } }
          },
          y: {
            grid: { color: gridColour },
            ticks: { color: textColour, font: { family: 'Outfit', size: 10 } }
          }
        }
      }
    });

    // 2. Monthly P&L
    const monthlyData = this.journalService.monthlyPL();
    const monthlyLabels = monthlyData.map(d => d.label);
    const monthlyValues = monthlyData.map(d => d.value);

    this.monthlyChart = new Chart(this.monthlyChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: monthlyLabels,
        datasets: [{
          label: 'P&L (₹)',
          data: monthlyValues,
          backgroundColor: monthlyValues.map(v => v >= 0 ? '#10b981' : '#f43f5e'), // Green 500 or Rose 500
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColour, font: { family: 'Outfit', size: 10 } }
          },
          y: {
            grid: { color: gridColour },
            ticks: { color: textColour, font: { family: 'Outfit', size: 10 } }
          }
        }
      }
    });

    // 3. Win/Loss Distribution
    const wins = this.stats.winningTrades;
    const losses = this.stats.losingTrades;
    
    // Draw pie chart only if there is data
    if (wins > 0 || losses > 0) {
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Wins', 'Losses'],
          datasets: [{
            data: [wins, losses],
            backgroundColor: ['#10b981', '#f43f5e'],
            borderWidth: isDark ? 2 : 1,
            borderColor: isDark ? '#111827' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColour,
                font: { family: 'Outfit', size: 11 }
              }
            }
          }
        }
      });
    } else {
      // Draw a grey placeholder circle if no closed trades
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['No trades yet'],
          datasets: [{
            data: [100],
            backgroundColor: [isDark ? '#1f2937' : '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColour,
                font: { family: 'Outfit', size: 11 }
              }
            }
          }
        }
      });
    }
  }
}
