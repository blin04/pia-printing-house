import { Component, inject, OnInit } from '@angular/core';
import { User } from '../models/user';
import { Order } from '../models/order';
import { UserService } from '../services/user.service';
import { OrderService } from '../services/order.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user: User = new User();
  profilePicture: File | null = null;

  // The client's orders shown in the table below the personal data.
  orders: Order[] = [];
  // Orders table is client-only; printers/admin just see the personal data.
  showOrders = false;

  error = '';
  success = '';

  // Where uploaded images are served from.
  uploadsUri = 'http://localhost:4000/uploads';

  private userService = inject(UserService);
  private orderService = inject(OrderService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);

    this.showOrders = this.user.tip === 'klijent';

    if (this.user._id) {
      this.userService.getProfile(this.user._id).subscribe({
        next: (u) => (this.user = u),
        error: () => {},
      });
      if (this.showOrders) this.loadOrders();
    }
  }

  loadOrders(): void {
    this.orderService.getByClient(this.user._id).subscribe({
      next: (orders) => this.orders = orders,
      error: () => {},
    });
  }

  cancel(order: Order): void {
    this.orderService.cancel(order._id).subscribe({
      next: () => this.loadOrders(),
      error: () => {},
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.profilePicture = input.files && input.files.length ? input.files[0] : null;
  }

  save(): void {
    this.error = '';
    this.success = '';

    if (!this.user.ime || !this.user.prezime || !this.user.telefon || !this.user.email) {
      this.error = 'Niste popunili sva polja!';
      return;
    }

    const data = new FormData();
    data.append('id', this.user._id);
    data.append('ime', this.user.ime);
    data.append('prezime', this.user.prezime);
    data.append('telefon', this.user.telefon);
    data.append('email', this.user.email);
    if (this.user.institucija) {
      data.append('institucija', JSON.stringify(this.user.institucija));
    }
    if (this.profilePicture) data.append('profilna', this.profilePicture);

    this.userService.updateProfile(data).subscribe({
      next: (u) => {
        this.user = u;
        localStorage.setItem('user', JSON.stringify(u));
        this.profilePicture = null;
        this.success = 'Podaci su ažurirani.';
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Ažuriranje neuspešno';
      },
    });
  }
}
