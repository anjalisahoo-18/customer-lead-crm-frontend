import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  router = inject(Router);
  
  isDark = signal<boolean>(localStorage.getItem('crm_dark_theme') === 'true');

  constructor() {
    // Effect to reactively update body class based on theme state
    effect(() => {
      if (this.isDark()) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('crm_dark_theme', 'true');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('crm_dark_theme', 'false');
      }
    });
  }

  toggleTheme() {
    this.isDark.update(dark => !dark);
  }

  logout() {
    this.authService.logout();
  }
}
