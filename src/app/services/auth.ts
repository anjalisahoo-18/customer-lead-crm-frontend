import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signals for reactive state management
  currentUser = signal<string | null>(localStorage.getItem('crm_username'));
  currentRole = signal<string | null>(localStorage.getItem('crm_role'));
  token = signal<string | null>(localStorage.getItem('crm_token'));

  private http = inject(HttpClient);
  private router = inject(Router);

  loginApi(credentials: any): Observable<any> {
    return this.http.post<any>('https://customer-lead-crm-backend-kn98.onrender.com/api/users/login', credentials).pipe(
      tap(res => {
        this.login(res);
      })
    );
  }

  login(userData: { token: string; username: string; role: string; id: number }) {
    localStorage.setItem('crm_token', userData.token);
    localStorage.setItem('crm_username', userData.username);
    localStorage.setItem('crm_role', userData.role);
    localStorage.setItem('crm_user_id', userData.id.toString());

    this.token.set(userData.token);
    this.currentUser.set(userData.username);
    this.currentRole.set(userData.role);
  }

  logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_username');
    localStorage.removeItem('crm_role');
    localStorage.removeItem('crm_user_id');

    this.token.set(null);
    this.currentUser.set(null);
    this.currentRole.set(null);

    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.token() !== null;
  }

  getAuthHeader() {
    return {
      Authorization: `Bearer ${this.token()}`
    };
  }

  getUserName(): string {
    return this.currentUser() || 'User';
  }
}
