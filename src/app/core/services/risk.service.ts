import { Injectable, inject, computed } from '@angular/core';
import { SettingsService } from './settings.service';
import { JournalService } from './journal.service';
import { IndexSymbol, ValidationChecklist } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class RiskService {
  private readonly settingsService = inject(SettingsService);
  private readonly journalService = inject(JournalService);

  // Quick settings signals accessors
  capital = computed(() => this.settingsService.settings().capital);
  dailyRiskPercent = computed(() => this.settingsService.settings().dailyRiskPercent);
  maxRiskPerTradePercent = computed(() => this.settingsService.settings().maxRiskPerTradePercent);
  lotSizes = computed(() => this.settingsService.settings().lotSizes);

  // Daily Risk limit calculations
  dailyLossLimit = computed(() => {
    return (this.capital() * this.dailyRiskPercent()) / 100;
  });

  maxRiskPerTradeAmount = computed(() => {
    return (this.capital() * this.maxRiskPerTradePercent()) / 100;
  });

  // Check if daily loss is exceeded (Today's current net PL is negative and has exceeded dailyLossLimit)
  isDailyLossExceeded = computed(() => {
    const currentPL = this.journalService.todayPL();
    const limit = this.dailyLossLimit();
    // Daily loss is exceeded if net P&L is negative and absolute value is greater than limit
    return currentPL < 0 && Math.abs(currentPL) >= limit;
  });

  // Calculate Stop Loss Price
  calculateStopLoss(entryPrice: number, quantity: number, riskPercent: number): {
    riskAmount: number;
    riskPerUnit: number;
    stopLossPrice: number;
  } {
    const riskAmount = (this.capital() * riskPercent) / 100;
    const riskPerUnit = quantity > 0 ? riskAmount / quantity : 0;
    const stopLossPrice = Math.max(0, entryPrice - riskPerUnit);

    return {
      riskAmount,
      riskPerUnit,
      stopLossPrice
    };
  }

  // Calculate Position Sizing
  calculatePositionSize(maxRiskAmount: number, entryPrice: number, stopLossPrice: number): {
    perUnitRisk: number;
    maxQuantity: number;
    capitalUtilization: number;
  } {
    const perUnitRisk = Math.max(0, entryPrice - stopLossPrice);
    const maxQuantity = perUnitRisk > 0 ? Math.floor(maxRiskAmount / perUnitRisk) : 0;
    const capitalUtilization = maxQuantity * entryPrice;

    return {
      perUnitRisk,
      maxQuantity,
      capitalUtilization
    };
  }

  // Calculate Risk Reward Target
  calculateRiskReward(entryPrice: number, stopLossPrice: number, ratio: number): {
    risk: number;
    targetPrice: number;
    expectedProfit: number;
  } {
    const risk = Math.max(0, entryPrice - stopLossPrice);
    const targetPrice = entryPrice + (risk * ratio);
    const expectedProfit = risk * ratio; // Per unit expected profit

    return {
      risk,
      targetPrice,
      expectedProfit
    };
  }

  // Calculate Option Buying Mode parameters for beginners
  calculateOptionBuyingMode(entryPremium: number, quantity: number): {
    maxSafeStopLoss: number; // stop loss premium
    riskAmount: number;
    riskPercentOfCapital: number;
    targetPremium1to2: number;
    breakEvenPremium: number;
  } {
    // Beginner options buying: restrict risk per trade to max risk per trade percent (e.g. 1%)
    const maxRiskAmount = this.maxRiskPerTradeAmount();
    const riskAmount = entryPremium * quantity;
    
    // For beginners, if their purchase amount is less than maxRiskAmount, their max loss is the premium (100% loss).
    // Otherwise, they must set a stop loss at entryPremium - (maxRiskAmount / quantity).
    const perUnitMaxRisk = quantity > 0 ? maxRiskAmount / quantity : 0;
    const maxSafeStopLoss = Math.max(0, entryPremium - perUnitMaxRisk);

    const actualRiskAmount = (entryPremium - maxSafeStopLoss) * quantity;
    const riskPercentOfCapital = this.capital() > 0 ? (actualRiskAmount / this.capital()) * 100 : 0;
    
    // Target premium assuming 1:2 risk-reward (risk is entryPremium - maxSafeStopLoss)
    const riskPerUnit = entryPremium - maxSafeStopLoss;
    const targetPremium1to2 = entryPremium + (riskPerUnit * 2);
    
    // Break-even is entry premium + estimated brokerage (approx ₹20 flat + taxes per order, let's say ₹40 roundtrip)
    // Brokerage per unit = 40 / quantity. Let's make it standard entryPremium for simplicity, or add small buffer.
    const breakEvenPremium = entryPremium + (quantity > 0 ? 40 / quantity : 0);

    return {
      maxSafeStopLoss,
      riskAmount: actualRiskAmount,
      riskPercentOfCapital,
      targetPremium1to2,
      breakEvenPremium
    };
  }

  // Validation engine checklist
  validateTrade(
    symbol: string,
    entryPrice: number,
    stopLossPrice: number,
    quantity: number,
    ratio: number = 2
  ): ValidationChecklist {
    const riskPerUnit = Math.max(0, entryPrice - stopLossPrice);
    const expectedRiskAmount = riskPerUnit * quantity;
    const maxTradeRisk = this.maxRiskPerTradeAmount();
    
    const riskWithinLimit = expectedRiskAmount <= maxTradeRisk;
    const dailyLossLimitNotExceeded = !this.isDailyLossExceeded();
    const riskRewardValid = ratio >= 2;
    const quantityValid = quantity > 0 && expectedRiskAmount > 0;
    const stopLossPresent = stopLossPrice > 0 && stopLossPrice < entryPrice;

    const passed = riskWithinLimit && dailyLossLimitNotExceeded && riskRewardValid && quantityValid && stopLossPresent;

    return {
      riskWithinLimit,
      dailyLossLimitNotExceeded,
      riskRewardValid,
      quantityValid,
      stopLossPresent,
      passed
    };
  }

  // Psychology Guard Warnings Generator
  getPsychologyWarnings(
    entryPrice: number,
    stopLossPrice: number,
    quantity: number
  ): string[] {
    const warnings: string[] = [];
    const riskPerUnit = Math.max(0, entryPrice - stopLossPrice);
    const riskAmount = riskPerUnit * quantity;
    const capitalVal = this.capital();

    if (capitalVal > 0) {
      const riskPercent = (riskAmount / capitalVal) * 100;
      if (riskPercent > 2) {
        warnings.push('High Risk Trade: This position risks more than 2% of your capital. Lower your quantity or tighten your stop loss.');
      }
    }

    const maxRisk = this.maxRiskPerTradeAmount();
    const maxQtyAllowed = riskPerUnit > 0 ? Math.floor(maxRisk / riskPerUnit) : 0;
    if (quantity > maxQtyAllowed && maxQtyAllowed > 0) {
      warnings.push(`Oversized Position: You are entering ${quantity} units, but your risk limits only allow a max of ${maxQtyAllowed} units.`);
    }

    if (this.isDailyLossExceeded()) {
      warnings.push('Trading Not Recommended: Daily loss limit has been breached. Stop trading to prevent revenge trading.');
    }

    return warnings;
  }
}
