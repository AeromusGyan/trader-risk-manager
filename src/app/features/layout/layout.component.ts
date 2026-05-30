import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/services/theme.service';
import { JournalService } from '../../core/services/journal.service';
import { RiskService } from '../../core/services/risk.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="h-screen w-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      <!-- Sidebar Drawer -->
      <mat-sidenav #sidenav mode="side" opened class="w-64 border-r border-slate-200 bg-white" [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile">
        <!-- Logo Area -->
        <div class="h-16 flex items-center gap-3 px-6 border-b border-slate-200 bg-slate-50/50">
          <div class="p-2 bg-indigo-600 rounded-lg text-white flex items-center justify-center">
            <mat-icon class="scale-90 font-black">gavel</mat-icon>
          </div>
          <div>
            <h1 class="text-sm font-extrabold tracking-tight leading-none text-slate-800">Risk</h1>
            <span class="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Mania</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="px-3 py-4 space-y-1 flex flex-col">
          <a routerLink="/dashboard" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">dashboard</mat-icon>
            <span class="text-sm">Dashboard</span>
          </a>

          <a routerLink="/calculators" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">calculate</mat-icon>
            <span class="text-sm">Calculators</span>
          </a>

          <a routerLink="/planner" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">gps_fixed</mat-icon>
            <span class="text-sm">Trade Planner</span>
          </a>

          <a routerLink="/journal" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">menu_book</mat-icon>
            <span class="text-sm">Trading Journal</span>
          </a>

          <a routerLink="/paper-analytics" routerLinkActive="bg-amber-50 text-amber-700 active-nav-paper" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">science</mat-icon>
            <span class="text-sm">Paper Analytics</span>
          </a>

          <a routerLink="/guide" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">help_outline</mat-icon>
            <span class="text-sm">User Guide</span>
          </a>

          <a routerLink="/settings" routerLinkActive="bg-indigo-50 text-indigo-600 active-nav" (click)="onLinkClick()" class="flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150">
            <mat-icon class="scale-90 text-slate-400">settings</mat-icon>
            <span class="text-sm">Settings</span>
          </a>
        </div>

        <!-- Sidebar footer / System Status info -->
        <div class="absolute bottom-4 left-4 right-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Storage Persistence</div>
          <div class="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-1">
            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
            Local Browser (Active)
          </div>
        </div>
      </mat-sidenav>

      <!-- Main Sidenav Content Area -->
      <mat-sidenav-content class="flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0f19]">
        
        <!-- Header Toolbar -->
        <mat-toolbar class="h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] px-4 md:px-6 shadow-sm z-10 shrink-0">
          <div class="flex items-center gap-3">
            <button mat-icon-button *ngIf="isMobile" (click)="sidenav.toggle()" class="text-slate-600 dark:text-slate-300">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="text-base font-bold text-slate-800 dark:text-white hidden sm:inline-block">Risk Mania</span>
          </div>

          <!-- Header Right Utilities -->
          <div class="flex items-center gap-3">

            <!-- LIVE / PAPER Mode Toggle -->
            <div class="flex items-center gap-0.5 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <button
                id="btn-mode-live"
                (click)="setMode('LIVE')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                [ngClass]="tradeMode() === 'LIVE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                matTooltip="Switch to Live Trading mode">
                <mat-icon class="text-sm" style="font-size:14px;width:14px;height:14px;line-height:14px">trending_up</mat-icon>
                <span class="hidden sm:inline">LIVE</span>
              </button>
              <button
                id="btn-mode-paper"
                (click)="setMode('PAPER')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                [ngClass]="tradeMode() === 'PAPER'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                matTooltip="Switch to Paper Trading mode">
                <mat-icon class="text-sm" style="font-size:14px;width:14px;height:14px;line-height:14px">science</mat-icon>
                <span class="hidden sm:inline">PAPER</span>
              </button>
            </div>

            <!-- Live Daily Risk Monitor -->
            <div class="hidden xs:flex items-center gap-3 px-3 py-1.5 rounded-xl border" [ngClass]="todayPL() < 0 && Math.abs(todayPL()) >= dailyLimit() ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/45 text-rose-600 dark:text-rose-400 animate-pulse' : todayPL() >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/15 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300'">
              <div class="text-right">
                <span class="text-[9px] font-extrabold uppercase tracking-wider block leading-none">
                  {{ tradeMode() === 'PAPER' ? 'Paper P&L' : "Today's P&L" }}
                </span>
                <span class="text-xs font-black leading-none mt-1 inline-block">
                  {{ todayPL() >= 0 ? '+' : '' }}₹{{ todayPL() | number:'1.2-2' }}
                </span>
              </div>
              <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div class="text-left text-xs font-medium">
                <span class="text-[9px] font-extrabold uppercase tracking-wider block text-slate-400">Limit</span>
                <span class="font-bold text-[11px] block mt-0.5">₹{{ dailyLimit() | number:'1.0-0' }}</span>
              </div>
            </div>

          </div>
        </mat-toolbar>

        <!-- Paper Mode Banner -->
        <div *ngIf="tradeMode() === 'PAPER'"
          class="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
          <mat-icon style="font-size:16px;width:16px;height:16px;line-height:16px">science</mat-icon>
          <span class="text-xs font-bold">PAPER TRADING MODE — All data shown is simulated. No real money involved.</span>
        </div>

        <!-- Main Inner Scrollable Content -->
        <main class="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <router-outlet></router-outlet>
        </main>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
    ::ng-deep .active-link {
      background-color: #6366f1 !important;
      color: #ffffff !important;
    }
    ::ng-deep .active-link mat-icon {
      color: #ffffff !important;
    }
    .active-link {
      background-color: #6366f1 !important;
      color: #ffffff !important;
    }
    ::ng-deep .active-nav-paper.active-nav mat-icon {
      color: #b45309 !important;
    }
  `]
})
export class LayoutComponent {
  private readonly themeService = inject(ThemeService);
  private readonly journalService = inject(JournalService);
  private readonly riskService = inject(RiskService);

  Math = Math;
  isMobile = false;

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  isDarkMode = computed(() => this.themeService.isDarkMode());
  tradeMode = computed(() => this.journalService.tradeMode());
  todayPL = computed(() => this.journalService.todayPL());
  dailyLimit = computed(() => this.riskService.dailyLossLimit());

  setMode(mode: 'LIVE' | 'PAPER') {
    this.journalService.setTradeMode(mode);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }

  onLinkClick() {
    // Sidenav closes on backdrop click in 'over' (mobile) mode automatically
  }
}
