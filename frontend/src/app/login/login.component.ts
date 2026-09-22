import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  username : string = "";
  password : string = "";
  error : string = "";

  private loginService = inject(LoginService);
  private router = inject(Router);

  login() : void {
    this.error = "";

    if (!this.username || !this.password) {
      this.error = "Please enter username and password";
      return;
    }

    this.loginService.login(this.username, this.password).subscribe({
      next: (user: User) => {
        // Remember who is logged in, then route by user type inferred from the backend.
        localStorage.setItem("user", JSON.stringify(user));

        if (user.tip === "klijent")
          this.router.navigate(["client"]);
        else if (user.tip === "stampar")
          this.router.navigate(["printer"]);
        else
          this.router.navigate([""]);
      },
      error: (err) => {
        this.error = err?.error?.message ?? "Login failed";
      },
    });
  }

}
