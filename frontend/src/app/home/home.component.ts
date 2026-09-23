import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SearchComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService)

  topProducts : Product[] = []

  ngOnInit() {
    this.productService.top5().subscribe({
      next: (products) => { console.log("here"); this.topProducts = products},
      error: () => {console.log('error')}
    })
  }

}
