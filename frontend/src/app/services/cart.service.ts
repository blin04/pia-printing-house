import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/cart';

  getCart(clientId: string) {
    return this.http.get<CartItem[]>(`${this.uri}/${clientId}`);
  }

  // `data` is the prepared item (client id + product/printer/quantity/…).
  add(data: any) {
    return this.http.post(`${this.uri}/add`, data);
  }

  remove(clientId: string, itemId: string) {
    return this.http.post(`${this.uri}/remove`, { id: clientId, itemId });
  }

  clear(clientId: string) {
    return this.http.post(`${this.uri}/clear`, { id: clientId });
  }

  checkout(clientId: string) {
    return this.http.post(`${this.uri}/checkout`, { id: clientId });
  }
}
