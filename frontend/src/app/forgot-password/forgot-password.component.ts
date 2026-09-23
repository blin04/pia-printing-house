import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  identifier = '';
  message = '';
  error = '';

  private userService = inject(UserService);
  private router = inject(Router);

  submit(): void {
    this.message = '';
    this.error = '';
    if (!this.identifier) {
      this.error = 'Unesite korisničko ime ili email';
      return;
    }
    this.userService.requestPasswordReset(this.identifier).subscribe({
      next: (res: any) =>
        (this.message = res?.message ?? 'Ako nalog postoji, poslat je link za poništavanje.'),
      error: (err) => (this.error = err?.error?.message ?? 'Greška.'),
    });
  }

  goToLogin(): void {
    this.router.navigate(['login']);
  }
}
