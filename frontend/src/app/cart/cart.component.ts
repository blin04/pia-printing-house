import { Component, inject, OnInit } from '@angular/core';
import { User } from '../models/user';
import { CartItem } from '../models/cart';
import { CartService } from '../services/cart.service';

// Cart contents grouped by printer, for display.
interface PrinterGroup {
  stamparija: string;
  items: CartItem[];
  total: number;
}

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  user: User = new User();
  groups: PrinterGroup[] = [];
  message = '';

  private cartService = inject(CartService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getCart(this.user._id).subscribe({
      next: (items) => this.groupByPrinter(items),
      error: () => {},
    });
  }

  // Print-service surcharge for the chosen usluga on an item (0 if none).
  surcharge(item: CartItem): number {
    const u = item.proizvod.uslugeStampe?.find((s) => s.idUsluge === item.idUsluge);
    return u ? u.dodatnaCenaPoKomadu : 0;
  }

  tipStampe(item: CartItem): string {
    const u = item.proizvod.uslugeStampe?.find((s) => s.idUsluge === item.idUsluge);
    return u ? u.tipStampe : '';
  }

  lineTotal(item: CartItem): number {
    return item.kolicina * (item.proizvod.jedinicnaCena + this.surcharge(item));
  }

  groupByPrinter(items: CartItem[]): void {
    const map = new Map<string, PrinterGroup>();
    for (const item of items) {
      const naziv = item.stamparija?.institucija?.naziv;
      const key = item.stamparija?._id ?? naziv;
      if (!map.has(key)) map.set(key, { stamparija: naziv, items: [], total: 0 });
      const g = map.get(key)!;
      g.items.push(item);
      g.total += this.lineTotal(item);
    }
    this.groups = Array.from(map.values());
  }

  remove(item: CartItem): void {
    this.cartService.remove(this.user._id, item._id).subscribe({
      next: () => this.loadCart(),
      error: () => {},
    });
  }

  clear(): void {
    this.cartService.clear(this.user._id).subscribe({
      next: () => this.loadCart(),
      error: () => {},
    });
  }

  confirm(): void {
    this.message = '';
    this.cartService.checkout(this.user._id).subscribe({
      next: () => {
        this.message = 'Narudžbina je potvrđena.';
        this.loadCart();
      },
      error: (err) => {
        this.message = err?.error?.message ?? 'Greška pri potvrđivanju.';
      },
    });
  }
}
