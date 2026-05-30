import { Component, inject, OnInit, ViewChild, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JournalService } from '../../core/services/journal.service';
import { RiskService } from '../../core/services/risk.service';
import { Trade, IndexSymbol, OptionType, PAPER_STRATEGIES } from '../../core/models/trade.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Inject } from '@angular/core';

// ─── Trade Dialog ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-trade-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title class="text-xl font-bold border-b pb-2 flex items-center gap-2">
      <span *ngIf="isPaper" class="inline-flex items-center gap-1 text-amber-600 text-sm font-bold bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">
        🧪 PAPER
      </span>
      {{ data.trade ? 'Edit Trade' : 'Log New Trade' }}
    </h2>
    <mat-dialog-content class="pt-4" style="max-height:70vh;overflow-y:auto;">
      <form [formGroup]="tradeForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" placeholder="Choose a date">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Symbol</mat-label>
            <mat-select formControlName="symbol" (selectionChange)="onSymbolChange($event.value)">
              <mat-option value="NIFTY">NIFTY</mat-option>
              <mat-option value="BANKNIFTY">BANKNIFTY</mat-option>
              <mat-option value="FINNIFTY">FINNIFTY</mat-option>
              <mat-option value="SENSEX">SENSEX</mat-option>
              <mat-option value="BANKEX">BANKEX</mat-option>
              <mat-option value="OTHER">OTHER (Custom Stock/Index)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div *ngIf="showCustomSymbol">
          <mat-form-field class="w-full">
            <mat-label>Custom Symbol (e.g. RELIANCE, TCS, AAPL)</mat-label>
            <input matInput formControlName="customSymbol" placeholder="Enter stock/index symbol">
            <mat-error *ngIf="tradeForm.get('customSymbol')?.invalid">
              Symbol name is required.
            </mat-error>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Option Type</mat-label>
            <mat-select formControlName="optionType">
              <mat-option value="CE">CE</mat-option>
              <mat-option value="PE">PE</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full col-span-2">
            <mat-label>Strike Price</mat-label>
            <input matInput type="number" formControlName="strike">
          </mat-form-field>
        </div>

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

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Stop Loss Premium (₹)</mat-label>
            <input matInput type="number" formControlName="stopLossPremium">
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Target Premium (₹)</mat-label>
            <input matInput type="number" formControlName="targetPremium">
          </mat-form-field>
        </div>

        <mat-form-field class="w-full">
          <mat-label>Exit Premium (₹) [Leave empty if open]</mat-label>
          <input matInput type="number" formControlName="exitPremium" placeholder="Not exited yet">
        </mat-form-field>

        <!-- Strategy (shows for all, highlighted for paper) -->
        <mat-form-field class="w-full">
          <mat-label>{{ isPaper ? '🧪 Strategy (Paper Trade)' : 'Strategy (optional)' }}</mat-label>
          <mat-select formControlName="strategy">
            <mat-option value="">— No Strategy —</mat-option>
            <mat-optgroup label="Predefined Strategies">
              <mat-option *ngFor="let s of strategies" [value]="s">{{ s }}</mat-option>
            </mat-optgroup>
            <mat-optgroup label="Custom">
              <mat-option value="__custom__">Other (type below)</mat-option>
            </mat-optgroup>
          </mat-select>
        </mat-form-field>

        <div *ngIf="tradeForm.get('strategy')?.value === '__custom__'">
          <mat-form-field class="w-full">
            <mat-label>Custom Strategy Name</mat-label>
            <input matInput formControlName="customStrategy" placeholder="e.g. My Momentum Setup">
          </mat-form-field>
        </div>

        <mat-form-field class="w-full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Reasons for trade, mistakes made, feelings..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions class="flex justify-end gap-2 border-t pt-2">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary"
        class="rounded-xl text-white"
        [ngClass]="isPaper ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'"
        [disabled]="tradeForm.invalid" (click)="onSave()">
        {{ isPaper ? '🧪 Save Paper Trade' : 'Save Trade' }}
      </button>
    </mat-dialog-actions>
  `
})
export class TradeDialogComponent implements OnInit {
  tradeForm!: FormGroup;
  showCustomSymbol = false;
  strategies = PAPER_STRATEGIES;
  isPaper: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { trade?: Trade; isPaper?: boolean }
  ) {
    this.isPaper = !!data.isPaper;
    this.dialogRef.disableClose = true;
  }

  ngOnInit() {
    let initialDate = new Date();
    const t = this.data.trade;
    if (t && t.date) {
      const parts = t.date.split('-');
      if (parts.length === 3) {
        initialDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }

    const isCustomSymbol = t && !['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BANKEX'].includes(t.symbol);
    this.showCustomSymbol = !!isCustomSymbol;

    const existingStrategy = t?.strategy || '';
    const isPredefined = PAPER_STRATEGIES.includes(existingStrategy as any);
    const strategyVal = existingStrategy
      ? (isPredefined ? existingStrategy : '__custom__')
      : '';

    this.tradeForm = this.fb.group({
      date: [initialDate, [Validators.required]],
      symbol: [t ? (isCustomSymbol ? 'OTHER' : t.symbol) : 'NIFTY', [Validators.required]],
      customSymbol: [isCustomSymbol ? t!.symbol : '', isCustomSymbol ? [Validators.required] : []],
      strike: [t ? t.strike : 22200, [Validators.required, Validators.min(1)]],
      optionType: [t ? t.optionType : 'CE', [Validators.required]],
      entryPremium: [t ? t.entryPremium : 150, [Validators.required, Validators.min(0.1)]],
      quantity: [t ? t.quantity : 25, [Validators.required, Validators.min(1)]],
      stopLossPremium: [t ? t.stopLossPremium : 130, [Validators.required, Validators.min(0)]],
      targetPremium: [t ? t.targetPremium : 190, [Validators.required, Validators.min(0)]],
      exitPremium: [t && t.exitPremium !== undefined ? t.exitPremium : null],
      strategy: [strategyVal],
      customStrategy: [!isPredefined && existingStrategy ? existingStrategy : ''],
      notes: [t ? t.notes : '']
    });
  }

  onSymbolChange(val: string) {
    this.showCustomSymbol = (val === 'OTHER');
    if (this.showCustomSymbol) {
      this.tradeForm.get('customSymbol')?.setValidators([Validators.required]);
    } else {
      this.tradeForm.get('customSymbol')?.clearValidators();
    }
    this.tradeForm.get('customSymbol')?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.tradeForm.valid) {
      const formValue = { ...this.tradeForm.value };

      // Date → YYYY-MM-DD
      if (formValue.date instanceof Date) {
        const d = formValue.date;
        formValue.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      // Custom symbol
      if (formValue.symbol === 'OTHER') {
        formValue.symbol = (formValue.customSymbol || '').toUpperCase().trim();
      }
      delete formValue.customSymbol;

      // Strategy resolve
      if (formValue.strategy === '__custom__') {
        formValue.strategy = (formValue.customStrategy || '').trim() || undefined;
      } else if (!formValue.strategy) {
        formValue.strategy = undefined;
      }
      delete formValue.customStrategy;

      // Empty exit premium
      if (formValue.exitPremium === null || formValue.exitPremium === '') {
        delete formValue.exitPremium;
      }

      this.dialogRef.close(formValue);
    }
  }
}

// ─── Main Trading Journal Component ──────────────────────────────────────────
@Component({
  selector: 'app-trading-journal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <!-- Mode Banner -->
      <div *ngIf="isPaper()"
        class="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
        <span class="text-2xl">🧪</span>
        <div>
          <div class="text-sm font-bold text-amber-700">Paper Trading Journal</div>
          <div class="text-xs text-amber-600">You are viewing your simulated paper trades. Switch to LIVE mode in the toolbar to view real trades.</div>
        </div>
      </div>

      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight"
            [ngClass]="isPaper() ? 'text-amber-700' : 'text-slate-900'">
            {{ isPaper() ? '🧪 Paper Journal' : 'Trading Journal' }}
          </h1>
          <p class="text-slate-500 mt-1">
            {{ isPaper() ? 'Track your paper trades and test strategies risk-free.' : 'Review your historical trades, analyze mistakes, and export data.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button mat-stroked-button class="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2" (click)="csvInput.click()">
            <mat-icon class="mr-2">upload</mat-icon>Import CSV
          </button>
          <input #csvInput type="file" (change)="onCSVImport($event)" accept=".csv" class="hidden">

          <button mat-stroked-button class="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2" (click)="exportCSV()">
            <mat-icon class="mr-2">download</mat-icon>Export CSV
          </button>

          <button mat-flat-button
            class="text-white rounded-xl shadow-md px-4 py-2"
            [ngClass]="isPaper() ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'"
            (click)="openTradeDialog()">
            <mat-icon class="mr-2">add</mat-icon>
            {{ isPaper() ? 'Log Paper Trade' : 'Log Trade' }}
          </button>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white rounded-2xl border shadow-sm p-4"
        [ngClass]="isPaper() ? 'border-amber-200' : 'border-slate-200/80'">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search Text -->
          <mat-form-field class="w-full">
            <mat-label>Search Notes/Strike</mat-label>
            <input matInput [(ngModel)]="filterText" (ngModelChange)="applyFilters()" placeholder="e.g. support bounce">
            <mat-icon matSuffix class="text-slate-400">search</mat-icon>
          </mat-form-field>

          <!-- Filter Symbol -->
          <mat-form-field class="w-full">
            <mat-label>Filter Symbol</mat-label>
            <mat-select [(ngModel)]="filterSymbol" (selectionChange)="applyFilters()">
              <mat-option value="">All Symbols</mat-option>
              <mat-option *ngFor="let sym of symbols" [value]="sym">{{ sym }}</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filter Status -->
          <mat-form-field class="w-full">
            <mat-label>Filter Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyFilters()">
              <mat-option value="">All Trades</mat-option>
              <mat-option value="OPEN">Open (Active)</mat-option>
              <mat-option value="WIN">Wins</mat-option>
              <mat-option value="LOSS">Losses</mat-option>
              <mat-option value="BREAKEVEN">Breakeven</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filter Strategy (visible in paper mode) -->
          <mat-form-field class="w-full" *ngIf="isPaper()">
            <mat-label>Filter Strategy</mat-label>
            <mat-select [(ngModel)]="filterStrategy" (selectionChange)="applyFilters()">
              <mat-option value="">All Strategies</mat-option>
              <mat-option *ngFor="let s of strategyList" [value]="s">{{ s }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Table Card -->
      <div class="bg-white rounded-2xl border shadow-sm overflow-hidden"
        [ngClass]="isPaper() ? 'border-amber-200' : 'border-slate-200/80'">
        <!-- Paper mode header tint -->
        <div *ngIf="isPaper()" class="h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="dataSource" matSort class="w-full min-w-[1050px]">

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Date </th>
              <td mat-cell *matCellDef="let row" class="text-sm font-medium"> {{ row.date }} </td>
            </ng-container>

            <!-- Contract Column -->
            <ng-container matColumnDef="contract">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Contract </th>
              <td mat-cell *matCellDef="let row" class="text-sm">
                <span class="font-bold text-slate-700">{{ row.symbol }}</span>
                <span class="ml-1 text-slate-400">{{ row.strike }}</span>
                <span class="ml-1 text-xs px-1.5 py-0.5 rounded font-bold"
                  [ngClass]="row.optionType === 'CE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                  {{ row.optionType }}
                </span>
                <!-- Strategy tag (paper mode) -->
                <div *ngIf="row.strategy" class="mt-0.5">
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    {{ row.strategy }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Pricing Column -->
            <ng-container matColumnDef="pricing">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Entry / Exit </th>
              <td mat-cell *matCellDef="let row" class="text-sm">
                <span class="font-semibold text-slate-700">₹{{ row.entryPremium }}</span>
                <span class="text-slate-400 mx-1">→</span>
                <span class="font-semibold" [ngClass]="row.exitPremium !== undefined ? 'text-slate-700' : 'text-slate-400 italic'">
                  {{ row.exitPremium !== undefined ? '₹' + row.exitPremium : 'Open' }}
                </span>
              </td>
            </ng-container>

            <!-- Quantity Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Qty </th>
              <td mat-cell *matCellDef="let row" class="text-sm font-semibold text-slate-600"> {{ row.quantity }} </td>
            </ng-container>

            <!-- SL & Target Column -->
            <ng-container matColumnDef="slTarget">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> SL / Target </th>
              <td mat-cell *matCellDef="let row" class="text-xs">
                <span class="text-rose-500 font-medium">SL: ₹{{ row.stopLossPremium }}</span>
                <br>
                <span class="text-emerald-500 font-medium">Tgt: ₹{{ row.targetPremium }}</span>
              </td>
            </ng-container>

            <!-- P&L Column -->
            <ng-container matColumnDef="netPL">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Net P&L </th>
              <td mat-cell *matCellDef="let row" class="text-sm font-bold">
                <span *ngIf="row.netPL !== undefined"
                  [ngClass]="row.netPL > 0 ? 'text-emerald-600' : row.netPL < 0 ? 'text-rose-600' : 'text-slate-500'">
                  {{ row.netPL > 0 ? '+' : '' }}₹{{ row.netPL | number:'1.2-2' }}
                </span>
                <span *ngIf="row.netPL === undefined" class="text-slate-400 italic font-medium">Open</span>
              </td>
            </ng-container>

            <!-- Notes Column -->
            <ng-container matColumnDef="notes">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider max-w-xs"> Notes </th>
              <td mat-cell *matCellDef="let row" class="text-xs text-slate-500 max-w-xs truncate"
                [matTooltip]="row.notes" [matTooltipDisabled]="isMobile">
                {{ row.notes || '--' }}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Status </th>
              <td mat-cell *matCellDef="let row">
                <span class="text-xs font-bold px-2 py-1 rounded-full" [ngClass]="{
                  'bg-emerald-100 text-emerald-800': row.status === 'WIN',
                  'bg-rose-100 text-rose-800': row.status === 'LOSS',
                  'bg-slate-100 text-slate-800': row.status === 'BREAKEVEN',
                  'bg-indigo-100 text-indigo-800': row.status === 'OPEN'
                }">
                  {{ row.status }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider w-24"> Actions </th>
              <td mat-cell *matCellDef="let row" class="space-x-1">
                <button mat-icon-button class="text-indigo-600 hover:bg-indigo-50" (click)="openTradeDialog(row)">
                  <mat-icon class="scale-90">edit</mat-icon>
                </button>
                <button mat-icon-button class="text-rose-600 hover:bg-rose-50" (click)="deleteTrade(row.id)">
                  <mat-icon class="scale-90">delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="hover:bg-slate-50 transition-colors duration-150"
              [ngClass]="isPaper() ? 'hover:bg-amber-50/40' : ''"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell p-8 text-center text-slate-400" [attr.colspan]="displayedColumns.length">
                <div class="flex flex-col items-center gap-2">
                  <mat-icon class="text-4xl text-slate-300">{{ isPaper() ? 'science' : 'inbox' }}</mat-icon>
                  <span>{{ isPaper() ? 'No paper trades yet. Log your first simulated trade!' : 'No trades match your search/filter parameters.' }}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons class="border-t border-slate-100"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class TradingJournalComponent implements OnInit {
  private readonly journalService = inject(JournalService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  isPaper = computed(() => this.journalService.tradeMode() === 'PAPER');

  get isMobile(): boolean { return window.innerWidth < 1024; }

  displayedColumns: string[] = ['date', 'contract', 'pricing', 'quantity', 'slTarget', 'netPL', 'notes', 'status', 'actions'];
  dataSource = new MatTableDataSource<Trade>([]);

  filterText = '';
  filterSymbol = '';
  filterStatus = '';
  filterStrategy = '';
  symbols: string[] = [];
  strategyList: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    // React to mode changes and reload
    effect(() => {
      // Accessing activeTrades() registers this as a reactive dependency
      this.journalService.activeTrades();
      this.refreshDataSource();
    });
  }

  ngOnInit() {
    this.refreshDataSource();
  }

  refreshDataSource() {
    const data = this.journalService.activeTrades();
    this.dataSource.data = data;

    this.dataSource.sortingDataAccessor = (item: Trade, property: string) => {
      switch (property) {
        case 'date': return item.date;
        case 'contract': return `${item.symbol} ${item.strike}`;
        case 'pricing': return item.entryPremium;
        case 'quantity': return item.quantity;
        case 'netPL': return item.netPL ?? 0;
        case 'status': return item.status;
        default: return (item as any)[property];
      }
    };

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.applyFilters();
      this.updateSymbols();
      this.updateStrategyList();
    });
  }

  applyFilters() {
    this.dataSource.filterPredicate = (data: Trade) => {
      const textMatch = !this.filterText ? true :
        (data.notes || '').toLowerCase().includes(this.filterText.toLowerCase()) ||
        data.strike.toString().includes(this.filterText) ||
        data.symbol.toLowerCase().includes(this.filterText.toLowerCase());
      const symbolMatch = !this.filterSymbol ? true : data.symbol === this.filterSymbol;
      const statusMatch = !this.filterStatus ? true : data.status === this.filterStatus;
      const strategyMatch = !this.filterStrategy ? true : (data.strategy || '') === this.filterStrategy;
      return textMatch && symbolMatch && statusMatch && strategyMatch;
    };
    this.dataSource.filter = 'trigger';
  }

  openTradeDialog(trade?: Trade) {
    const dialogRef = this.dialog.open(TradeDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { trade, isPaper: this.isPaper() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (trade) {
          this.journalService.updateTrade(trade.id, result);
          this.snackBar.open('Trade updated successfully', 'Close', { duration: 3000 });
        } else {
          this.journalService.addTrade(result);
          this.snackBar.open(this.isPaper() ? '🧪 Paper trade logged!' : 'Trade logged successfully', 'Close', { duration: 3000 });
        }
        this.refreshDataSource();
      }
    });
  }

  deleteTrade(id: string) {
    if (confirm('Are you sure you want to delete this trade?')) {
      this.journalService.deleteTrade(id);
      this.refreshDataSource();
      this.snackBar.open('Trade deleted from journal', 'Close', { duration: 3000 });
    }
  }

  exportCSV() { this.journalService.exportToCSV(); }

  onCSVImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const success = this.journalService.importFromCSV(text);
        if (success) {
          this.refreshDataSource();
          this.snackBar.open('Trades imported successfully from CSV!', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to import CSV. Ensure headings match exactly.', 'Close', { duration: 4000 });
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  private updateSymbols() {
    const allSymbols = this.journalService.activeTrades().map(t => t.symbol);
    this.symbols = Array.from(new Set(allSymbols)).sort();
  }

  private updateStrategyList() {
    const all = this.journalService.activeTrades()
      .map(t => t.strategy)
      .filter((s): s is string => !!s);
    this.strategyList = Array.from(new Set(all)).sort();
  }
}
