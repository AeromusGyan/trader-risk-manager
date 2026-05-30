import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { JournalService } from '../../core/services/journal.service';

@Component({
  selector: 'app-paper-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTableModule],
  template: `
    <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-amber-200">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-100 rounded-2xl">
            <mat-icon class="text-amber-600 text-3xl" style="font-size:32px;width:32px;height:32px">science</mat-icon>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-amber-700">Paper Analytics</h1>
            <p class="text-slate-500 mt-0.5 text-sm">Deep dive into your simulated trade strategies.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
          <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">info</mat-icon>
          Always shows Paper trade data regardless of mode
        </div>
      </div>

      <!-- Top Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paper Trades</div>
          <div class="text-2xl font-black text-amber-600">{{ paperStats().totalTrades }}</div>
          <div class="text-xs text-slate-400">{{ paperStats().openTrades }} open</div>
        </div>
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Win Rate</div>
          <div class="text-2xl font-black" [ngClass]="paperStats().winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">
            {{ paperStats().winRate | number:'1.1-1' }}%
          </div>
          <div class="text-xs text-slate-400">{{ paperStats().winningTrades }}W / {{ paperStats().losingTrades }}L</div>
        </div>
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total P&L (Paper)</div>
          <div class="text-2xl font-black" [ngClass]="paperStats().totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ paperStats().totalPL >= 0 ? '+' : '' }}₹{{ paperStats().totalPL | number:'1.0-0' }}
          </div>
          <div class="text-xs text-slate-400">Simulated</div>
        </div>
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Strategies Used</div>
          <div class="text-2xl font-black text-indigo-600">{{ strategyStats().length }}</div>
          <div class="text-xs text-slate-400">Unique strategies</div>
        </div>
      </div>

      <!-- Live vs Paper Comparison -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 class="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
          <mat-icon class="text-indigo-500">compare_arrows</mat-icon>
          Live vs Paper Comparison
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Live Card -->
          <div class="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 space-y-3">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-indigo-600">trending_up</mat-icon>
              <span class="font-bold text-indigo-700 text-sm">LIVE TRADING</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trades</div>
                <div class="text-xl font-black text-indigo-700">{{ liveStats().totalTrades }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Win Rate</div>
                <div class="text-xl font-black" [ngClass]="liveStats().winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ liveStats().winRate | number:'1.1-1' }}%
                </div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total P&L</div>
                <div class="text-lg font-black" [ngClass]="liveStats().totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ liveStats().totalPL >= 0 ? '+' : '' }}₹{{ liveStats().totalPL | number:'1.0-0' }}
                </div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Profit</div>
                <div class="text-lg font-black text-slate-700">₹{{ liveStats().averageProfit | number:'1.0-0' }}</div>
              </div>
            </div>
          </div>

          <!-- Paper Card -->
          <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-amber-600">science</mat-icon>
              <span class="font-bold text-amber-700 text-sm">PAPER TRADING</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trades</div>
                <div class="text-xl font-black text-amber-700">{{ paperStats().totalTrades }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Win Rate</div>
                <div class="text-xl font-black" [ngClass]="paperStats().winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ paperStats().winRate | number:'1.1-1' }}%
                </div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total P&L</div>
                <div class="text-lg font-black" [ngClass]="paperStats().totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ paperStats().totalPL >= 0 ? '+' : '' }}₹{{ paperStats().totalPL | number:'1.0-0' }}
                </div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Profit</div>
                <div class="text-lg font-black text-slate-700">₹{{ paperStats().averageProfit | number:'1.0-0' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Win Rate Comparison Bar -->
        <div *ngIf="liveStats().closedTrades > 0 || paperStats().closedTrades > 0" class="mt-6 space-y-3">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Win Rate Comparison</div>
          <div class="space-y-2">
            <div>
              <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-indigo-700">Live</span>
                <span class="text-indigo-700">{{ liveStats().winRate | number:'1.1-1' }}%</span>
              </div>
              <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  [style.width.%]="liveStats().winRate"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-amber-700">Paper</span>
                <span class="text-amber-700">{{ paperStats().winRate | number:'1.1-1' }}%</span>
              </div>
              <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 rounded-full transition-all duration-700"
                  [style.width.%]="paperStats().winRate"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Strategy Breakdown Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <mat-icon class="text-amber-500">table_chart</mat-icon>
          <h2 class="text-base font-bold text-slate-700">Strategy Performance Breakdown</h2>
          <span class="ml-auto text-xs text-slate-400 font-medium">Paper trades only</span>
        </div>

        <div *ngIf="strategyStats().length === 0" class="p-12 text-center text-slate-400">
          <mat-icon class="text-5xl text-slate-200">science</mat-icon>
          <p class="mt-3 font-medium">No paper trades with strategies yet.</p>
          <p class="text-sm mt-1">Switch to PAPER mode and log trades with a strategy to see breakdown here.</p>
        </div>

        <div *ngIf="strategyStats().length > 0" class="overflow-x-auto">
          <table class="w-full text-sm min-w-[700px]">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Strategy</th>
                <th class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Trades</th>
                <th class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">W / L</th>
                <th class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Win Rate</th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Total P&L</th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Avg P&L</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of strategyStats(); let i = index"
                class="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs">
                    🧪 {{ row.strategy }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center font-semibold text-slate-700">{{ row.count }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="text-emerald-600 font-bold">{{ row.wins }}</span>
                  <span class="text-slate-300 mx-1">/</span>
                  <span class="text-rose-600 font-bold">{{ row.losses }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                        [ngClass]="row.winRate >= 50 ? 'bg-emerald-400' : 'bg-rose-400'"
                        [style.width.%]="row.winRate"></div>
                    </div>
                    <span class="text-xs font-bold"
                      [ngClass]="row.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">
                      {{ row.winRate | number:'1.0-0' }}%
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-bold"
                  [ngClass]="row.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  {{ row.totalPL >= 0 ? '+' : '' }}₹{{ row.totalPL | number:'1.0-0' }}
                </td>
                <td class="px-4 py-3 text-right font-semibold text-slate-600">
                  {{ row.avgPL >= 0 ? '+' : '' }}₹{{ row.avgPL | number:'1.0-0' }}
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm">
                    {{ row.winRate >= 70 ? '⭐⭐⭐' : row.winRate >= 50 ? '⭐⭐' : '⭐' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Symbol Distribution for Paper -->
      <div *ngIf="symbolStats().length > 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center gap-2 mb-4">
          <mat-icon class="text-amber-500">pie_chart</mat-icon>
          <h2 class="text-base font-bold text-slate-700">Paper Trades by Symbol</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div *ngFor="let s of symbolStats()"
            class="flex flex-col items-center p-3 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors cursor-default">
            <div class="text-sm font-black text-amber-700">{{ s.symbol }}</div>
            <div class="text-xl font-black text-slate-800 mt-1">{{ s.count }}</div>
            <div class="text-[10px] font-semibold text-slate-400 mt-0.5">trades</div>
            <div class="text-xs font-bold mt-1"
              [ngClass]="s.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'">
              {{ s.winRate | number:'1.0-0' }}% WR
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class PaperAnalyticsComponent {
  private readonly journalService = inject(JournalService);

  // Always compute from raw paper trades (not mode-dependent)
  paperStats = computed(() => {
    const list = this.journalService.paperTrades();
    const closed = list.filter(t => t.status !== 'OPEN');
    const wins = closed.filter(t => (t.netPL || 0) > 0).length;
    const losses = closed.filter(t => (t.netPL || 0) < 0).length;
    const totalPL = closed.reduce((s, t) => s + (t.netPL || 0), 0);
    const winAmount = closed.filter(t => (t.netPL || 0) > 0).reduce((s, t) => s + (t.netPL || 0), 0);
    return {
      totalTrades: list.length,
      closedTrades: closed.length,
      openTrades: list.length - closed.length,
      winningTrades: wins,
      losingTrades: losses,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalPL,
      averageProfit: wins > 0 ? winAmount / wins : 0
    };
  });

  liveStats = computed(() => {
    const list = this.journalService.trades();
    const closed = list.filter(t => t.status !== 'OPEN');
    const wins = closed.filter(t => (t.netPL || 0) > 0).length;
    const losses = closed.filter(t => (t.netPL || 0) < 0).length;
    const totalPL = closed.reduce((s, t) => s + (t.netPL || 0), 0);
    const winAmount = closed.filter(t => (t.netPL || 0) > 0).reduce((s, t) => s + (t.netPL || 0), 0);
    return {
      totalTrades: list.length,
      closedTrades: closed.length,
      openTrades: list.length - closed.length,
      winningTrades: wins,
      losingTrades: losses,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalPL,
      averageProfit: wins > 0 ? winAmount / wins : 0
    };
  });

  strategyStats = computed(() => this.journalService.paperStrategyStats());

  symbolStats = computed(() => {
    const list = this.journalService.paperTrades().filter(t => t.status !== 'OPEN');
    const map = new Map<string, { count: number; wins: number }>();
    list.forEach(t => {
      const e = map.get(t.symbol) || { count: 0, wins: 0 };
      e.count++;
      if ((t.netPL || 0) > 0) e.wins++;
      map.set(t.symbol, e);
    });
    return Array.from(map.entries()).map(([symbol, d]) => ({
      symbol,
      count: d.count,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  });
}
