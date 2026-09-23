import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { Order } from '../models/order';
import { UserService } from '../services/user.service';
import { User } from '../models/user';

@Component({
  selector: 'app-ordered-products',
  imports: [],
  templateUrl: './ordered-products.component.html',
  styleUrl: './ordered-products.component.css',
})
export class OrderedProductsComponent implements OnInit {
  private orderService = inject(OrderService)

  orders: Order[] = []
  user: User = new User()

  ngOnInit() {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    this.loadOrders()
  }

  loadOrders() {
    this.orderService.getByPrinter(this.user._id).subscribe({
      next: (orders) => this.orders = orders,
      error: () => {}
    })
  }

  handle(o: Order) {
    this.orderService.advanceStatus(o._id).subscribe({
      next: () => this.loadOrders(),
      error: () => {}
    })
  }
}
