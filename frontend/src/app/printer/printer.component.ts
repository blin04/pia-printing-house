import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user';
import { ProfileComponent } from '../profile/profile.component';
import { PrinterProductsComponent } from '../printer-products/printer-products.component';
import { PrinterStockComponent } from '../printer-stock/printer-stock.component';

@Component({
  selector: 'app-printer',
  imports: [ProfileComponent, PrinterProductsComponent, PrinterStockComponent],
  templateUrl: './printer.component.html',
  styleUrl: './printer.component.css',
})
export class PrinterComponent implements OnInit {
  user: User = new User();

  // Which sub-view the shell currently shows (dynamic content swap).
  view: string = 'profile';

  private router = inject(Router);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (!stored) {
      this.router.navigate(['login']);
      return;
    }
    this.user = JSON.parse(stored);
  }

  setView(v: string): void {
    this.view = v;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['']);
  }
}
