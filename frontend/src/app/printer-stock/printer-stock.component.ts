import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { Product } from '../models/product';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-printer-stock',
  imports: [FormsModule],
  templateUrl: './printer-stock.component.html',
  styleUrl: './printer-stock.component.css',
})
export class PrinterStockComponent implements OnInit {
  user: User = new User();
  products: Product[] = [];
  message = '';

  private productService = inject(ProductService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    this.load();
  }

  load(): void {
    this.productService.getByPrinter(this.user._id).subscribe({
      next: (p) => (this.products = p),
      error: () => {},
    });
  }

  updateStock(product: Product): void {
    this.message = '';
    this.productService.updateStock(product._id, product.kolicinaNaLageru).subscribe({
      next: () => (this.message = 'Zalihe za "' + product.naziv + '" su ažurirane.'),
      error: (err) => (this.message = err?.error?.message ?? 'Greška pri ažuriranju.'),
    });
  }
}
