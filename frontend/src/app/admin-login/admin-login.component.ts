import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models/user';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
  username = '';
  password = '';
  error = '';

  private userService = inject(UserService);
  private router = inject(Router);

  login(): void {
    this.error = '';
    if (!this.username || !this.password) {
      this.error = 'Unesite korisničko ime i lozinku';
      return;
    }

    this.userService.adminLogin(this.username, this.password).subscribe({
      next: (user: User) => {
        console.log("ovde")
        localStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['admin']);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Logovanje neuspešno';
      },
    });
  }
}
