import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/products';

  // Both filters optional; empty values are simply not sent.
  search(naziv: string, kategorija: string) {
    const params: any = {};
    if (naziv) params.naziv = naziv;
    if (kategorija) params.kategorija = kategorija;
    return this.http.get<Product[]>(`${this.uri}/search`, { params });
  }

  details(id: string) {
    return this.http.get<Product>(`${this.uri}/details/${id}`);
  }

  getByPrinter(printerId: string) {
    return this.http.get<Product[]>(`${this.uri}/byPrinter/${printerId}`);
  }

  add(data: any) {
    return this.http.post<Product>(`${this.uri}/add`, data);
  }

  updateStock(id: string, kolicinaNaLageru: number) {
    return this.http.post(`${this.uri}/updateStock`, { id, kolicinaNaLageru });
  }

  addService(id: string, usluga: any) {
    return this.http.post(`${this.uri}/addService`, { id, usluga });
  }
}
