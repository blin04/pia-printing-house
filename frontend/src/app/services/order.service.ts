import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/orders';

  getByClient(id: string) {
    return this.http.get<Order[]>(`${this.uri}/byClient/${id}`)
  }

  cancel(id: string) {
    const data = { id }
    return this.http.post(`${this.uri}/cancel`, data)
  }

  getArchive(id: string) {
    return this.http.get<Order[]>(`${this.uri}/archive/${id}`)
  }

  markReceived(orderId: string) {
    return this.http.post(`${this.uri}/markReceived`, { orderId })
  }

  getByPrinter(printerId: string) {
    return this.http.get<Order[]>(`${this.uri}/byPrinter/${printerId}`)
  }

  advanceStatus(orderId: string) {
    return this.http.post(`${this.uri}/advanceStatus`, { orderId })
  }
}
