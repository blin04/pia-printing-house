import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  naziv = '';
  kategorija = ''; // '' => sve kategorije

  categories: Category[] = [];
  results: Product[] = [];

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  ngOnInit(): void {
    // Populate the dropdown with categories that currently have products in stock.
    this.categoryService.getInStock().subscribe({
      next: (c) => (this.categories = c),
      error: () => {},
    });
    this.search();
  }

  search(): void {
    this.productService.search(this.naziv, this.kategorija).subscribe({
      next: (r) => (this.results = r),
      error: () => {},
    });
  }
}
