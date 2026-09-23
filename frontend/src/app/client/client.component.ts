import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user';
import { ProfileComponent } from '../profile/profile.component';
import { SearchComponent } from '../search/search.component';
import { CartComponent } from '../cart/cart.component';
import { ArchiveComponent } from '../archive/archive.component';
import { ProcurementComponent } from '../procurement/procurement.component';

@Component({
  selector: 'app-client',
  imports: [
    ProfileComponent,
    SearchComponent,
    CartComponent,
    ArchiveComponent,
    ProcurementComponent,
  ],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
})
export class ClientComponent implements OnInit {

  user : User = new User();

  // Which sub-view the shell currently shows (dynamic content swap)
  view : string = 'profile';

  private router = inject(Router);

  ngOnInit() : void {
    const stored = localStorage.getItem("user");
    if (!stored) {
      this.router.navigate(["login"]);
      return;
    }
    this.user = JSON.parse(stored);
  }

  setView(v : string) : void {
    this.view = v;
  }

  logout() : void {
    localStorage.clear();
    this.router.navigate([""]);
  }

}
