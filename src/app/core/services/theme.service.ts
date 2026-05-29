import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Always return false to disable dark mode
  isDarkMode = signal<boolean>(false);

  constructor() {
    // Force remove dark mode class
    document.documentElement.classList.remove('dark');
  }

  toggleTheme() {
    // Dark mode toggling is disabled
  }
}
