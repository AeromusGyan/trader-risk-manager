import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      <!-- Title Header -->
      <div class="border-b border-slate-200 pb-4">
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">User Guide</h1>
        <p class="text-slate-500 mt-1">Learn how to master Risk Mania, plan option trades, and manage your trading ledger.</p>
      </div>

      <!-- Quick Start Steps -->
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <mat-icon class="text-indigo-600">bolt</mat-icon>
          Risk Management Workflow (4 Simple Steps)
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Step 1 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">1</div>
              <h3 class="font-bold text-slate-800 text-sm">Configure Capital</h3>
              <p class="text-xs text-slate-500 leading-relaxed">Go to <strong>Settings</strong> first. Set your capital, max risk per trade (e.g. 1%), and daily risk limit (e.g. 2%).</p>
            </div>
            <a routerLink="/settings" class="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 pt-2">
              Go to Settings <mat-icon class="scale-75">chevron_right</mat-icon>
            </a>
          </div>

          <!-- Step 2 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">2</div>
              <h3 class="font-bold text-slate-800 text-sm">Calculate Sizing</h3>
              <p class="text-xs text-slate-500 leading-relaxed">Use the <strong>Calculators</strong> to find your safe contract stop loss premium, correct lot size, and risk-reward ratios.</p>
            </div>
            <a routerLink="/calculators" class="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 pt-2">
              Open Calculators <mat-icon class="scale-75">chevron_right</mat-icon>
            </a>
          </div>

          <!-- Step 3 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">3</div>
              <h3 class="font-bold text-slate-800 text-sm">Plan & Validate</h3>
              <p class="text-xs text-slate-500 leading-relaxed">Enter contract entry, stop loss, and strike in the <strong>Trade Planner</strong> to run the auto-risk validation rules.</p>
            </div>
            <a routerLink="/planner" class="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 pt-2">
              Use Trade Planner <mat-icon class="scale-75">chevron_right</mat-icon>
            </a>
          </div>

          <!-- Step 4 -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">4</div>
              <h3 class="font-bold text-slate-800 text-sm">Log in Ledger</h3>
              <p class="text-xs text-slate-500 leading-relaxed">Save approved trades to your <strong>Ledger</strong>. Update exits when you close positions to track win rates and equity growth.</p>
            </div>
            <a routerLink="/journal" class="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 pt-2">
              View Journal Ledger <mat-icon class="scale-75">chevron_right</mat-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- Detail Ledger Guide -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div class="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-800">
          <mat-icon class="text-indigo-600">menu_book</mat-icon>
          <h2 class="text-lg font-bold">How to Add and Manage Your Trading Ledger</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600 leading-relaxed">
          <!-- Column 1: Adding Trades -->
          <div class="space-y-4">
            <h3 class="font-extrabold text-slate-800 uppercase tracking-wider text-xs">Step 1: Logging a New Trade</h3>
            <p>You can add a trade to the ledger in two ways:</p>
            <ul class="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Directly from Trade Planner</strong>: After configuring a trade in the planner, if it passes the risk rules, simply click the <strong>"Save Trade to Journal"</strong> button to save it instantly.
              </li>
              <li>
                <strong>Manually from Journal</strong>: Navigate to the <strong>Trading Journal</strong> tab, click the dark blue <strong>"+ Log Trade"</strong> button, fill in the trade details in the popup dialog, and save.
              </li>
            </ul>

            <h3 class="font-extrabold text-slate-800 uppercase tracking-wider text-xs pt-2">Step 2: Entering Fields Correctly</h3>
            <ul class="list-disc pl-5 space-y-2 text-xs">
              <li><strong>Symbol & Strike</strong>: Choose index (e.g. NIFTY) and strike price (e.g. 22200).</li>
              <li><strong>Option Type</strong>: Select **CE** (if you expect market rise) or **PE** (if you expect market fall).</li>
              <li><strong>Entry Premium & Qty</strong>: Enter buying premium (e.g. ₹150) and quantity (must be a multiple of default lot sizes, e.g. 25).</li>
              <li><strong>SL & Target</strong>: Set stop loss premium (e.g. ₹130) and target price (e.g. ₹190) to define your risk-reward.</li>
            </ul>
          </div>

          <!-- Column 2: Managing and Exiting Trades -->
          <div class="space-y-4">
            <h3 class="font-extrabold text-slate-800 uppercase tracking-wider text-xs">Step 3: Managing Open Positions</h3>
            <p>When you log a new trade, **leave the "Exit Premium" field blank**.</p>
            <ul class="list-disc pl-5 space-y-2 text-xs">
              <li>This marks the trade status as <span class="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">OPEN</span> inside the ledger.</li>
              <li>Open trades do not affect your today's Net P&L metrics until they are closed, helping you track active risk exposure.</li>
            </ul>

            <h3 class="font-extrabold text-slate-800 uppercase tracking-wider text-xs pt-2">Step 4: Exiting & Closing a Position</h3>
            <p>Once you close a trade in your broker terminal:</p>
            <ol class="list-decimal pl-5 space-y-2 text-xs">
              <li>Find the trade row in the ledger table.</li>
              <li>Click the **Edit (pencil icon)** button under Actions.</li>
              <li>Enter your final selling price in the **Exit Premium** field.</li>
              <li>Click **Save Trade**.</li>
            </ol>
            <p class="text-xs">The ledger will automatically calculate your net profit or loss (Net P&L = [Exit Premium - Entry Premium] × Qty) and update your dashboard stats, Win Rate, and growth charts instantly!</p>
          </div>
        </div>
      </div>

      <!-- Psychology Guard Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Psychology Guard Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div class="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
            <mat-icon class="text-amber-500">psychology</mat-icon>
            <h3 class="font-bold">Understanding Psychology Guards</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            Risk Mania runs an automated risk engine to prevent common option trading mistakes that blow accounts:
          </p>
          <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li><strong>Oversized Positions</strong>: Warns you if the cash size required to take the trade exceeds 20% of your total trading capital.</li>
            <li><strong>Excessive Risk</strong>: Alerts you if your maximum potential loss (Risk Points × Qty) exceeds your set risk limit (e.g. 1% of capital).</li>
            <li><strong>Daily Limits</strong>: If your Net P&L loss for today crosses your Daily Loss Limit, the dashboard will flash a **"STOP TRADING FOR TODAY"** alert and ask you to lock your terminal to prevent revenge trading.</li>
          </ul>
        </div>

        <!-- CSV Tools Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div class="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
            <mat-icon class="text-emerald-500">sync</mat-icon>
            <h3 class="font-bold">Data Import & Export</h3>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            All your data is persisted locally in your browser's Local Storage. If you clear cookies or change browsers, your data will reset. Use our CSV tools to back up:
          </p>
          <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li><strong>Export CSV</strong>: Click this button in the Trading Journal ledger to download an Excel-compatible file of all your historical trades.</li>
            <li><strong>Import CSV</strong>: Upload your exported CSV file in another browser to restore your journal entries and charts instantly.</li>
            <li><strong>Sample Data</strong>: In <strong>Settings</strong>, you can load pre-configured demo trades to see how the dashboard charts behave before adding your own trades.</li>
          </ul>
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
export class GuideComponent {}
