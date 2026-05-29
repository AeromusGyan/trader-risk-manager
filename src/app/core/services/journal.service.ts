import { Injectable, signal, computed, inject } from '@angular/core';
import { Trade, IndexSymbol, OptionType } from '../models/trade.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class JournalService {
  private readonly JOURNAL_KEY = 'trader_risk_journal';
  private readonly settingsService = inject(SettingsService);

  // Core Signal holding all trades
  trades = signal<Trade[]>([]);

  constructor() {
    this.loadTrades();
  }

  private loadTrades() {
    const saved = localStorage.getItem(this.JOURNAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.trades.set(parsed);
      } catch (e) {
        console.error('Failed to parse trades journal', e);
        this.loadSampleData();
      }
    } else {
      this.loadSampleData();
    }
  }

  saveTrades(updatedTrades: Trade[]) {
    this.trades.set(updatedTrades);
    localStorage.setItem(this.JOURNAL_KEY, JSON.stringify(updatedTrades));
  }

  addTrade(trade: Omit<Trade, 'id' | 'netPL' | 'status'>) {
    const newTrade: Trade = this.calculateTradePLAndStatus({
      ...trade,
      id: crypto.randomUUID()
    });

    const current = this.trades();
    this.saveTrades([newTrade, ...current]);
  }

  updateTrade(id: string, updatedFields: Partial<Trade>) {
    const current = this.trades();
    const index = current.findIndex(t => t.id === id);
    if (index !== -1) {
      const merged = { ...current[index], ...updatedFields };
      const updatedTrade = this.calculateTradePLAndStatus(merged);
      const copy = [...current];
      copy[index] = updatedTrade;
      this.saveTrades(copy);
    }
  }

  deleteTrade(id: string) {
    const current = this.trades();
    this.saveTrades(current.filter(t => t.id !== id));
  }

  clearJournal() {
    this.saveTrades([]);
  }

  private calculateTradePLAndStatus(trade: any): Trade {
    if (trade.exitPremium !== undefined && trade.exitPremium !== null) {
      const diff = trade.optionType === 'CE' 
        ? trade.exitPremium - trade.entryPremium 
        : trade.entryPremium - trade.exitPremium; // Options can be bought/sold, let's assume default option buying: exitPremium - entryPremium
      
      // The prompt mentions "Option Buying Mode: Special mode for beginners"
      // and for trade planner CE/PE. Typically option buyers profit when CE rises or PE rises.
      // So regardless of whether it is CE or PE: if you BUY CE premium at 100 and exit at 120, P&L is +20.
      // If you BUY PE premium at 100 and exit at 120, P&L is also +20 (since you bought PE premium).
      // So net P&L = (exitPremium - entryPremium) * quantity. Let's make it standard: (exitPremium - entryPremium) * quantity.
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

  // Reactive Computed Stats for performance dashboard
  stats = computed(() => {
    const list = this.trades();
    const closedTrades = list.filter(t => t.status !== 'OPEN');
    const total = closedTrades.length;

    let wins = 0;
    let losses = 0;
    let totalPL = 0;
    let largestProfit = 0;
    let largestLoss = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

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
        if (pl < largestLoss) largestLoss = pl; // represents largest negative value
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

  // Today's P&L calculation (useful for Daily Risk Manager limit warning)
  todayPL = computed(() => {
    const list = this.trades();
    const todayStr = new Date().toISOString().split('T')[0];
    
    return list
      .filter(t => t.date === todayStr && t.netPL !== undefined)
      .reduce((sum, t) => sum + (t.netPL || 0), 0);
  });

  // Monthly breakdown of P&L for bar chart
  monthlyPL = computed(() => {
    const list = this.trades().filter(t => t.status !== 'OPEN');
    const monthlyMap = new Map<string, number>();

    list.forEach(t => {
      // Date is format YYYY-MM-DD
      const month = t.date.substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || 0;
      monthlyMap.set(month, current + (t.netPL || 0));
    });

    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    return sortedMonths.map(month => {
      // Convert 2026-05 to "May 2026" or similar
      const [year, m] = month.split('-');
      const date = new Date(parseInt(year), parseInt(m) - 1, 1);
      const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      return {
        label,
        value: monthlyMap.get(month) || 0
      };
    });
  });

  // Data series for the Equity Curve
  equityCurve = computed(() => {
    const list = [...this.trades()]
      .filter(t => t.status !== 'OPEN')
      .reverse(); // Chronological order (oldest to newest)

    const startingCapital = this.settingsService.settings().capital;
    const dataPoints: { label: string; value: number }[] = [{ label: 'Start', value: startingCapital }];
    
    let runningCapital = startingCapital;
    list.forEach((t, i) => {
      runningCapital += (t.netPL || 0);
      dataPoints.push({
        label: `Trade ${i + 1}`,
        value: runningCapital
      });
    });

    return dataPoints;
  });

  // Pre-load sample data to WOW the user on load
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

    // Generate 12 historical trades spread over the last 15 days
    for (let i = 12; i >= 1; i--) {
      const tradeDate = new Date();
      tradeDate.setDate(today.getDate() - i);
      const dateStr = tradeDate.toISOString().split('T')[0];

      const symbol = symbols[i % symbols.length];
      const isCE = i % 2 === 0;
      const entryPremium = 80 + (i * 12) % 150;
      const isWin = i % 3 !== 0; // 66% win rate in sample data
      
      let exitPremium: number;
      if (isWin) {
        exitPremium = Math.round(entryPremium * (1.3 + (i % 3) * 0.1)); // 30-50% profit
      } else {
        exitPremium = Math.round(entryPremium * 0.7); // 30% loss (stop loss hit)
      }

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
        notes: notes[i % notes.length]
      });
    }

    // Sort newest first
    mockTrades.sort((a, b) => b.date.localeCompare(a.date));
    this.saveTrades(mockTrades);
  }

  // Import trades from CSV
  importFromCSV(csvText: string): boolean {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) return false;

      const headers = lines[0].split(',').map(h => h.trim());
      const importedTrades: Trade[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        
        // Match header mappings
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
          date,
          symbol,
          strike,
          optionType,
          entryPremium,
          exitPremium,
          quantity,
          stopLossPremium,
          targetPremium,
          notes,
          status: 'OPEN'
        };

        this.calculateTradePLAndStatus(trade);
        importedTrades.push(trade);
      }

      if (importedTrades.length > 0) {
        const merged = [...importedTrades, ...this.trades()];
        merged.sort((a, b) => b.date.localeCompare(a.date));
        this.saveTrades(merged);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import CSV', e);
      return false;
    }
  }

  // Export trades to CSV
  exportToCSV() {
    const list = this.trades();
    const headers = ['Date', 'Symbol', 'Strike', 'CE/PE', 'EntryPremium', 'ExitPremium', 'Quantity', 'StopLoss', 'Target', 'NetPL', 'Status', 'Notes'];
    
    const rows = list.map(t => [
      t.date,
      t.symbol,
      t.strike,
      t.optionType,
      t.entryPremium,
      t.exitPremium !== undefined ? t.exitPremium : '',
      t.quantity,
      t.stopLossPremium,
      t.targetPremium,
      t.netPL !== undefined ? t.netPL : '',
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `trading_journal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
