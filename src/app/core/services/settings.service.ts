import { Injectable, signal, effect } from '@angular/core';
import { AppSettings, LotSizes } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'trader_risk_settings';

  private readonly defaultLotSizes: LotSizes = {
    NIFTY: 25,
    BANKNIFTY: 15,
    FINNIFTY: 25,
    SENSEX: 10,
    BANKEX: 15
  };

  private readonly defaultSettings: AppSettings = {
    capital: 100000, // ₹1 Lakh default
    dailyRiskPercent: 2, // 2% daily limit
    maxRiskPerTradePercent: 1, // 1% per trade
    lotSizes: this.defaultLotSizes
  };

  settings = signal<AppSettings>(this.defaultSettings);

  constructor() {
    // Load from localStorage
    const saved = localStorage.getItem(this.SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge to ensure future safety if new fields are added
        this.settings.set({
          ...this.defaultSettings,
          ...parsed,
          lotSizes: {
            ...this.defaultLotSizes,
            ...(parsed.lotSizes || {})
          }
        });
      } catch (e) {
        console.error('Failed to parse settings, resetting to default', e);
        this.settings.set(this.defaultSettings);
      }
    }

    // Effect to auto-save to localStorage on changes
    effect(() => {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings()));
    });
  }

  updateSettings(newSettings: Partial<AppSettings>) {
    this.settings.update(prev => ({
      ...prev,
      ...newSettings,
      lotSizes: newSettings.lotSizes ? { ...prev.lotSizes, ...newSettings.lotSizes } : prev.lotSizes
    }));
  }

  resetSettings() {
    this.settings.set(this.defaultSettings);
  }
}
