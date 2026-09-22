import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/categories';

  getInStock() {
    return this.http.get<Category[]>(`${this.uri}/inStock`);
  }
}
