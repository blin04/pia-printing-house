import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  message = '';
  error = '';
  done = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  submit(): void {
    this.message = '';
    this.error = '';
    if (!this.password) {
      this.error = 'Unesite novu lozinku';
      return;
    }
    this.userService.resetPassword(this.token, this.password).subscribe({
      next: (res: any) => {
        this.message = res?.message ?? 'Lozinka je promenjena.';
        this.done = true;
      },
      error: (err) => (this.error = err?.error?.message ?? 'Greška.'),
    });
  }

  goToLogin(): void {
    this.router.navigate(['login']);
  }
}
