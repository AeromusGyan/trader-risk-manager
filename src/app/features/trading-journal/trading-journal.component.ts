import { Component, inject, OnInit, ViewChild, signal, computed } from '@angular/core';
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
import { Trade, IndexSymbol, OptionType } from '../../core/models/trade.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Inject } from '@angular/core';

// --- Dialog Component to Add/Edit Trade ---
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
    <h2 mat-dialog-title class="text-xl font-bold border-b pb-2">
      {{ data.trade ? 'Edit Trade' : 'Log New Trade' }}
    </h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="tradeForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" placeholder="Choose a date">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Symbol</mat-label>
            <mat-select formControlName="symbol">
              <mat-option value="NIFTY">NIFTY</mat-option>
              <mat-option value="BANKNIFTY">BANKNIFTY</mat-option>
              <mat-option value="FINNIFTY">FINNIFTY</mat-option>
              <mat-option value="SENSEX">SENSEX</mat-option>
              <mat-option value="BANKEX">BANKEX</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Option Type</mat-label>
            <mat-select formControlName="optionType">
              <mat-option value="CE">CE</mat-option>
              <mat-option value="PE">PE</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full col-span-2">
            <mat-label>Strike Price</mat-label>
            <input matInput type="number" formControlName="strike">
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Entry Premium (₹)</mat-label>
            <input matInput type="number" formControlName="entryPremium">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Quantity</mat-label>
            <input matInput type="number" formControlName="quantity">
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Stop Loss Premium (₹)</mat-label>
            <input matInput type="number" formControlName="stopLossPremium">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Target Premium (₹)</mat-label>
            <input matInput type="number" formControlName="targetPremium">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Exit Premium (₹) [Leave empty if open]</mat-label>
          <input matInput type="number" formControlName="exitPremium" placeholder="Not exited yet">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Reasons for trade, mistakes made, feelings..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions class="flex justify-end gap-2 border-t pt-2">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" [disabled]="tradeForm.invalid" (click)="onSave()">
        Save Trade
      </button>
    </mat-dialog-actions>
  `
})
export class TradeDialogComponent implements OnInit {
  tradeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { trade?: Trade }
  ) {}

  ngOnInit() {
    let initialDate = new Date();
    const t = this.data.trade;
    if (t && t.date) {
      const parts = t.date.split('-');
      if (parts.length === 3) {
        initialDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }

    this.tradeForm = this.fb.group({
      date: [initialDate, [Validators.required]],
      symbol: [t ? t.symbol : 'NIFTY', [Validators.required]],
      strike: [t ? t.strike : 22200, [Validators.required, Validators.min(1)]],
      optionType: [t ? t.optionType : 'CE', [Validators.required]],
      entryPremium: [t ? t.entryPremium : 150, [Validators.required, Validators.min(0.1)]],
      quantity: [t ? t.quantity : 25, [Validators.required, Validators.min(1)]],
      stopLossPremium: [t ? t.stopLossPremium : 130, [Validators.required, Validators.min(0)]],
      targetPremium: [t ? t.targetPremium : 190, [Validators.required, Validators.min(0)]],
      exitPremium: [t && t.exitPremium !== undefined ? t.exitPremium : null],
      notes: [t ? t.notes : '']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.tradeForm.valid) {
      const formValue = { ...this.tradeForm.value };
      
      // Convert Date object to YYYY-MM-DD string timezone-safely
      if (formValue.date instanceof Date) {
        const d = formValue.date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        formValue.date = `${year}-${month}-${day}`;
      }

      if (formValue.exitPremium === null || formValue.exitPremium === '') {
        delete formValue.exitPremium;
      }
      this.dialogRef.close(formValue);
    }
  }
}

// --- Main Trading Journal Component ---
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
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Trading Journal</h1>
          <p class="text-slate-500 mt-1">Review your historical trades, analyze mistakes, and export data.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- CSV Import -->
          <button mat-stroked-button class="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2" (click)="csvInput.click()">
            <mat-icon class="mr-2">upload</mat-icon>Import CSV
          </button>
          <input #csvInput type="file" (change)="onCSVImport($event)" accept=".csv" class="hidden">

          <!-- CSV Export -->
          <button mat-stroked-button class="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2" (click)="exportCSV()">
            <mat-icon class="mr-2">download</mat-icon>Export CSV
          </button>

          <!-- Log Trade -->
          <button mat-flat-button color="primary" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md px-4 py-2" (click)="openTradeDialog()">
            <mat-icon class="mr-2">add</mat-icon>Log Trade
          </button>
        </div>
      </div>

      <!-- Filters & Actions Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Search Text -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Search Notes/Strike</mat-label>
            <input matInput [(ngModel)]="filterText" (ngModelChange)="applyFilters()" placeholder="e.g. support bounce">
            <mat-icon matSuffix class="text-slate-400">search</mat-icon>
          </mat-form-field>

          <!-- Filter Symbol -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Filter Index</mat-label>
            <mat-select [(ngModel)]="filterSymbol" (selectionChange)="applyFilters()">
              <mat-option value="">All Indices</mat-option>
              <mat-option value="NIFTY">NIFTY</mat-option>
              <mat-option value="BANKNIFTY">BANKNIFTY</mat-option>
              <mat-option value="FINNIFTY">FINNIFTY</mat-option>
              <mat-option value="SENSEX">SENSEX</mat-option>
              <mat-option value="BANKEX">BANKEX</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filter Status -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Filter Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyFilters()">
              <mat-option value="">All Trades</mat-option>
              <mat-option value="OPEN">Open (Active)</mat-option>
              <mat-option value="WIN">Wins</mat-option>
              <mat-option value="LOSS">Losses</mat-option>
              <mat-option value="BREAKEVEN">Breakeven</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Table Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Date </th>
              <td mat-cell *matCellDef="let row" class="text-sm font-medium"> {{ row.date }} </td>
            </ng-container>

            <!-- Symbol & Strike Column -->
            <ng-container matColumnDef="contract">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Contract </th>
              <td mat-cell *matCellDef="let row" class="text-sm">
                <span class="font-bold text-slate-700 dark:text-slate-300">{{ row.symbol }}</span>
                <span class="ml-1 text-slate-400">{{ row.strike }}</span>
                <span class="ml-1 text-xs px-1.5 py-0.5 rounded font-bold" [ngClass]="row.optionType === 'CE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'">
                  {{ row.optionType }}
                </span>
              </td>
            </ng-container>

            <!-- Pricing Column -->
            <ng-container matColumnDef="pricing">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Entry / Exit </th>
              <td mat-cell *matCellDef="let row" class="text-sm">
                <span class="font-semibold text-slate-700 dark:text-slate-300">₹{{ row.entryPremium }}</span>
                <span class="text-slate-400 mx-1">→</span>
                <span class="font-semibold" [ngClass]="row.exitPremium !== undefined ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'">
                  {{ row.exitPremium !== undefined ? '₹' + row.exitPremium : 'Open' }}
                </span>
              </td>
            </ng-container>

            <!-- Quantity Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Qty </th>
              <td mat-cell *matCellDef="let row" class="text-sm font-semibold text-slate-600 dark:text-slate-400"> {{ row.quantity }} </td>
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
                <span *ngIf="row.netPL !== undefined" [ngClass]="row.netPL > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.netPL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'">
                  {{ row.netPL > 0 ? '+' : '' }}₹{{ row.netPL | number:'1.2-2' }}
                </span>
                <span *ngIf="row.netPL === undefined" class="text-slate-400 italic font-medium">
                  Open
                </span>
              </td>
            </ng-container>

            <!-- Notes Column -->
            <ng-container matColumnDef="notes">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider max-w-xs"> Notes </th>
              <td mat-cell *matCellDef="let row" class="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" [matTooltip]="row.notes">
                {{ row.notes || '--' }}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-xs uppercase font-semibold text-slate-500 tracking-wider"> Status </th>
              <td mat-cell *matCellDef="let row">
                <span class="text-xs font-bold px-2 py-1 rounded-full" [ngClass]="{
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400': row.status === 'WIN',
                  'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400': row.status === 'LOSS',
                  'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400': row.status === 'BREAKEVEN',
                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400': row.status === 'OPEN'
                }">
                  {{ row.status }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-xs uppercase font-semibold text-slate-500 tracking-wider w-24"> Actions </th>
              <td mat-cell *matCellDef="let row" class="space-x-1">
                <button mat-icon-button class="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30" (click)="openTradeDialog(row)">
                  <mat-icon class="scale-90">edit</mat-icon>
                </button>
                <button mat-icon-button class="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30" (click)="deleteTrade(row.id)">
                  <mat-icon class="scale-90">delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors duration-150"></tr>
            
            <!-- Row shown when there is no matching data. -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell p-8 text-center text-slate-400 dark:text-slate-500" colspan="9">
                No trades match your search/filter parameters.
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons class="border-t dark:border-slate-800"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TradingJournalComponent implements OnInit {
  private readonly journalService = inject(JournalService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['date', 'contract', 'pricing', 'quantity', 'slTarget', 'netPL', 'notes', 'status', 'actions'];
  dataSource = new MatTableDataSource<Trade>([]);

  // Filter models
  filterText = '';
  filterSymbol = '';
  filterStatus = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.refreshDataSource();
  }

  refreshDataSource() {
    this.dataSource.data = this.journalService.trades();
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.dataSource.filterPredicate = (data: Trade, filter: string) => {
      const textMatch = !this.filterText ? true : 
        (data.notes || '').toLowerCase().includes(this.filterText.toLowerCase()) || 
        data.strike.toString().includes(this.filterText);
      
      const symbolMatch = !this.filterSymbol ? true : data.symbol === this.filterSymbol;
      const statusMatch = !this.filterStatus ? true : data.status === this.filterStatus;

      return textMatch && symbolMatch && statusMatch;
    };
    
    // Trigger filter refresh
    this.dataSource.filter = 'trigger';
  }

  openTradeDialog(trade?: Trade) {
    const dialogRef = this.dialog.open(TradeDialogComponent, {
      width: '450px',
      data: { trade }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (trade) {
          // Update mode
          this.journalService.updateTrade(trade.id, result);
          this.snackBar.open('Trade updated successfully', 'Close', { duration: 3000 });
        } else {
          // Add mode
          this.journalService.addTrade(result);
          this.snackBar.open('Trade logged successfully', 'Close', { duration: 3000 });
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

  exportCSV() {
    this.journalService.exportToCSV();
  }

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
    // Reset file input
    event.target.value = '';
  }
}
