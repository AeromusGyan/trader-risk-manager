import { Injectable, signal, computed, inject } from '@angular/core';
import { Trade, IndexSymbol, OptionType, TradeType } from '../models/trade.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class JournalService {
  private readonly LIVE_JOURNAL_KEY = 'trader_risk_journal';
  private readonly PAPER_JOURNAL_KEY = 'trader_risk_paper_journal';
  private readonly MODE_KEY = 'trader_risk_trade_mode';
  private readonly settingsService = inject(SettingsService);

  // ─── Mode Signal (LIVE | PAPER) ─────────────────────────────────────────────
  tradeMode = signal<TradeType>(
    (localStorage.getItem(this.MODE_KEY) as TradeType) || 'LIVE'
  );

  setTradeMode(mode: TradeType) {
    this.tradeMode.set(mode);
    localStorage.setItem(this.MODE_KEY, mode);
  }

  // ─── Trade Signals ───────────────────────────────────────────────────────────
  /** All LIVE trades */
  trades = signal<Trade[]>([]);
  /** All PAPER trades */
  paperTrades = signal<Trade[]>([]);

  /** Active trades based on current mode */
  activeTrades = computed(() =>
    this.tradeMode() === 'LIVE' ? this.trades() : this.paperTrades()
  );

  constructor() {
    this.loadTrades();
    this.loadPaperTrades();
  }

  // ─── Load / Save ─────────────────────────────────────────────────────────────
  private loadTrades() {
    const saved = localStorage.getItem(this.LIVE_JOURNAL_KEY);
    if (saved) {
      try {
        this.trades.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse live trades journal', e);
        this.loadSampleData();
      }
    } else {
      this.loadSampleData();
    }
  }

  private loadPaperTrades() {
    const saved = localStorage.getItem(this.PAPER_JOURNAL_KEY);
    if (saved) {
      try {
        this.paperTrades.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse paper trades journal', e);
        this.paperTrades.set([]);
      }
    } else {
      this.paperTrades.set([]);
    }
  }

  saveTrades(updatedTrades: Trade[]) {
    this.trades.set(updatedTrades);
    localStorage.setItem(this.LIVE_JOURNAL_KEY, JSON.stringify(updatedTrades));
  }

  savePaperTrades(updatedTrades: Trade[]) {
    this.paperTrades.set(updatedTrades);
    localStorage.setItem(this.PAPER_JOURNAL_KEY, JSON.stringify(updatedTrades));
  }

  // ─── CRUD (mode-aware) ───────────────────────────────────────────────────────
  addTrade(trade: Omit<Trade, 'id' | 'netPL' | 'status'>) {
    const newTrade: Trade = this.calculateTradePLAndStatus({
      ...trade,
      id: crypto.randomUUID(),
      tradeType: this.tradeMode()
    });

    if (this.tradeMode() === 'LIVE') {
      this.saveTrades([newTrade, ...this.trades()]);
    } else {
      this.savePaperTrades([newTrade, ...this.paperTrades()]);
    }
  }

  updateTrade(id: string, updatedFields: Partial<Trade>) {
    if (this.tradeMode() === 'LIVE') {
      const current = this.trades();
      const index = current.findIndex(t => t.id === id);
      if (index !== -1) {
        const copy = [...current];
        copy[index] = this.calculateTradePLAndStatus({ ...copy[index], ...updatedFields });
        this.saveTrades(copy);
      }
    } else {
      const current = this.paperTrades();
      const index = current.findIndex(t => t.id === id);
      if (index !== -1) {
        const copy = [...current];
        copy[index] = this.calculateTradePLAndStatus({ ...copy[index], ...updatedFields });
        this.savePaperTrades(copy);
      }
    }
  }

  deleteTrade(id: string) {
    if (this.tradeMode() === 'LIVE') {
      this.saveTrades(this.trades().filter(t => t.id !== id));
    } else {
      this.savePaperTrades(this.paperTrades().filter(t => t.id !== id));
    }
  }

  clearJournal() {
    if (this.tradeMode() === 'LIVE') {
      this.saveTrades([]);
    } else {
      this.savePaperTrades([]);
    }
  }

  private calculateTradePLAndStatus(trade: any): Trade {
    if (trade.exitPremium !== undefined && trade.exitPremium !== null) {
      const profitLoss = (trade.exitPremium - trade.entryPremium) * trade.quantity;
      trade.netPL = profitLoss;
      if (profitLoss > 0) {
        trade.status = 'WIN';
      } else if (profitLoss < 0) {
        trade.status = 'LOSS';
      } else {
        trade.status = 'BREAKEVEN';
      }
    } else {
      trade.netPL = undefined;
      trade.status = 'OPEN';
    }
    return trade;
  }

  // ─── Reactive Computed Stats (mode-aware, use activeTrades) ─────────────────
  stats = computed(() => {
    const list = this.activeTrades();
    const closedTrades = list.filter(t => t.status !== 'OPEN');
    const total = closedTrades.length;

    let wins = 0, losses = 0, totalPL = 0;
    let largestProfit = 0, largestLoss = 0;
    let totalWinAmount = 0, totalLossAmount = 0;

    closedTrades.forEach(t => {
      const pl = t.netPL || 0;
      totalPL += pl;
      if (pl > 0) {
        wins++;
        totalWinAmount += pl;
        if (pl > largestProfit) largestProfit = pl;
      } else if (pl < 0) {
        losses++;
        totalLossAmount += Math.abs(pl);
        if (pl < largestLoss) largestLoss = pl;
      }
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const averageProfit = wins > 0 ? totalWinAmount / wins : 0;
    const averageLoss = losses > 0 ? totalLossAmount / losses : 0;

    return {
      totalTrades: list.length,
      closedTrades: total,
      openTrades: list.length - total,
      winningTrades: wins,
      losingTrades: losses,
      winRate,
      averageProfit,
      averageLoss,
      largestProfit,
      largestLoss,
      totalPL
    };
  });

  todayPL = computed(() => {
    const list = this.activeTrades();
    const todayStr = new Date().toISOString().split('T')[0];
    return list
      .filter(t => t.date === todayStr && t.netPL !== undefined)
      .reduce((sum, t) => sum + (t.netPL || 0), 0);
  });

  monthlyPL = computed(() => {
    const list = this.activeTrades().filter(t => t.status !== 'OPEN');
    const monthlyMap = new Map<string, number>();
    list.forEach(t => {
      const month = t.date.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (t.netPL || 0));
    });
    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    return sortedMonths.map(month => {
      const [year, m] = month.split('-');
      const date = new Date(parseInt(year), parseInt(m) - 1, 1);
      const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      return { label, value: monthlyMap.get(month) || 0 };
    });
  });

  equityCurve = computed(() => {
    const list = [...this.activeTrades()]
      .filter(t => t.status !== 'OPEN')
      .reverse();
    const startingCapital = this.settingsService.settings().capital;
    const dataPoints: { label: string; value: number }[] = [{ label: 'Start', value: startingCapital }];
    let runningCapital = startingCapital;
    list.forEach((t, i) => {
      runningCapital += (t.netPL || 0);
      dataPoints.push({ label: `Trade ${i + 1}`, value: runningCapital });
    });
    return dataPoints;
  });

  // ─── Paper-specific: Strategy breakdown (always from paperTrades) ─────────────
  paperStrategyStats = computed(() => {
    const list = this.paperTrades().filter(t => t.status !== 'OPEN');
    const map = new Map<string, { wins: number; losses: number; totalPL: number; count: number }>();

    list.forEach(t => {
      const key = t.strategy || 'No Strategy';
      const existing = map.get(key) || { wins: 0, losses: 0, totalPL: 0, count: 0 };
      existing.count++;
      existing.totalPL += t.netPL || 0;
      if ((t.netPL || 0) > 0) existing.wins++;
      else if ((t.netPL || 0) < 0) existing.losses++;
      map.set(key, existing);
    });

    return Array.from(map.entries()).map(([strategy, data]) => ({
      strategy,
      count: data.count,
      wins: data.wins,
      losses: data.losses,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      totalPL: data.totalPL,
      avgPL: data.count > 0 ? data.totalPL / data.count : 0
    })).sort((a, b) => b.totalPL - a.totalPL);
  });

  // ─── Sample Live Data ─────────────────────────────────────────────────────────
  loadSampleData() {
    const today = new Date();
    const mockTrades: Trade[] = [];
    const symbols: IndexSymbol[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'];
    const strikes = [22000, 22200, 47500, 48000, 21000, 72500];
    const notes = [
      'Perfect setup on support bounce.',
      'Exited early due to sideways action.',
      'Slippage on execution, otherwise good trade.',
      'Reversal pattern identified on 5m chart.',
      'FOMO entry, need to stay disciplined.',
      'Followed trade plan, hit target premium!'
    ];

    for (let i = 12; i >= 1; i--) {
      const tradeDate = new Date();
      tradeDate.setDate(today.getDate() - i);
      const dateStr = tradeDate.toISOString().split('T')[0];
      const symbol = symbols[i % symbols.length];
      const isCE = i % 2 === 0;
      const entryPremium = 80 + (i * 12) % 150;
      const isWin = i % 3 !== 0;
      const exitPremium = isWin
        ? Math.round(entryPremium * (1.3 + (i % 3) * 0.1))
        : Math.round(entryPremium * 0.7);
      const lotSizes = this.settingsService.settings().lotSizes;
      const lotSize = lotSizes[symbol] || 25;
      const quantity = lotSize * (1 + (i % 3));

      mockTrades.push({
        id: crypto.randomUUID(),
        date: dateStr,
        symbol,
        strike: strikes[i % strikes.length],
        optionType: isCE ? 'CE' : 'PE',
        entryPremium,
        exitPremium,
        quantity,
        stopLossPremium: Math.round(entryPremium * 0.8),
        targetPremium: Math.round(entryPremium * 1.4),
        netPL: (exitPremium - entryPremium) * quantity,
        status: isWin ? 'WIN' : 'LOSS',
        notes: notes[i % notes.length],
        tradeType: 'LIVE'
      });
    }

    mockTrades.sort((a, b) => b.date.localeCompare(a.date));
    this.saveTrades(mockTrades);
  }

  // ─── Import / Export CSV ──────────────────────────────────────────────────────
  importFromCSV(csvText: string): boolean {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) return false;
      const headers = lines[0].split(',').map(h => h.trim());
      const importedTrades: Trade[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const date = cols[headers.indexOf('Date')] || new Date().toISOString().split('T')[0];
        const symbol = (cols[headers.indexOf('Symbol')] as IndexSymbol) || 'NIFTY';
        const strike = parseFloat(cols[headers.indexOf('Strike')] || '0');
        const optionType = (cols[headers.indexOf('CE/PE')] as OptionType) || 'CE';
        const entryPremium = parseFloat(cols[headers.indexOf('EntryPremium')] || '0');
        const exitPremiumVal = cols[headers.indexOf('ExitPremium')];
        const exitPremium = exitPremiumVal ? parseFloat(exitPremiumVal) : undefined;
        const quantity = parseInt(cols[headers.indexOf('Quantity')] || '1');
        const stopLossPremium = parseFloat(cols[headers.indexOf('StopLoss')] || '0');
        const targetPremium = parseFloat(cols[headers.indexOf('Target')] || '0');
        const notes = cols[headers.indexOf('Notes')] || '';

        const trade: Trade = {
          id: crypto.randomUUID(),
          date, symbol, strike, optionType, entryPremium, exitPremium,
          quantity, stopLossPremium, targetPremium, notes,
          status: 'OPEN',
          tradeType: this.tradeMode()
        };
        this.calculateTradePLAndStatus(trade);
        importedTrades.push(trade);
      }

      if (importedTrades.length > 0) {
        if (this.tradeMode() === 'LIVE') {
          const merged = [...importedTrades, ...this.trades()];
          merged.sort((a, b) => b.date.localeCompare(a.date));
          this.saveTrades(merged);
        } else {
          const merged = [...importedTrades, ...this.paperTrades()];
          merged.sort((a, b) => b.date.localeCompare(a.date));
          this.savePaperTrades(merged);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import CSV', e);
      return false;
    }
  }

  exportToCSV() {
    const list = this.activeTrades();
    const headers = ['Date', 'Symbol', 'Strike', 'CE/PE', 'EntryPremium', 'ExitPremium',
      'Quantity', 'StopLoss', 'Target', 'NetPL', 'Status', 'Strategy', 'Notes'];
    const rows = list.map(t => [
      t.date, t.symbol, t.strike, t.optionType, t.entryPremium,
      t.exitPremium !== undefined ? t.exitPremium : '',
      t.quantity, t.stopLossPremium, t.targetPremium,
      t.netPL !== undefined ? t.netPL : '',
      t.status,
      t.strategy || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${this.tradeMode().toLowerCase()}_journal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
