import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user';

@Component({
  selector: 'app-client',
  imports: [],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
})
export class ClientComponent implements OnInit {

  user : User = new User();

  private router = inject(Router);

  ngOnInit() : void {
    // Basic auth-area protection: no logged-in user -> back to login.
    const stored = localStorage.getItem("user");
    if (!stored) {
      this.router.navigate(["login"]);
      return;
    }
    this.user = JSON.parse(stored);
  }

  logout() : void {
    localStorage.clear();
    this.router.navigate([""]);
  }

}
