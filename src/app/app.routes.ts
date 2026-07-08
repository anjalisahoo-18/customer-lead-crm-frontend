import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./login/login').then(m => m.LoginComponent) 
  },
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'leads', 
    loadComponent: () => import('./leads/leads').then(m => m.LeadsComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'leads/:id', 
    loadComponent: () => import('./lead-details/lead-details').then(m => m.LeadDetailsComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'lead-types', 
    loadComponent: () => import('./lead-types/lead-types').then(m => m.LeadTypesComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'reminders', 
    loadComponent: () => import('./reminders/reminders').then(m => m.RemindersComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];
