import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    role: ['EXECUTIVE']
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  isRegisterMode = signal<boolean>(false);

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.errorMessage.set(null);
    this.loginForm.reset({ username: '', password: '', role: 'EXECUTIVE' });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const val = this.loginForm.value;

    if (this.isRegisterMode()) {
      this.authService.registerApi(val).subscribe({
        next: () => {
          // Auto login after successful registration
          this.authService.loginApi({ username: val.username, password: val.password }).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.isLoading.set(false);
              this.isRegisterMode.set(false);
              this.errorMessage.set('Registration successful! Please log in now.');
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Username already exists. Please try another.');
        }
      });
    } else {
      this.authService.loginApi({ username: val.username, password: val.password }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Invalid username or password. Please try again.');
        }
      });
    }
  }
}
