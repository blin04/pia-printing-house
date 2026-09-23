import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { Product } from '../models/product';
import { Category, Subcategory } from '../models/category';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-printer-products',
  imports: [FormsModule],
  templateUrl: './printer-products.component.html',
  styleUrl: './printer-products.component.css',
})
export class PrinterProductsComponent implements OnInit {
  user: User = new User();
  categories: Category[] = [];
  products: Product[] = []; // this printer's products (service target dropdown)

  // --- add-product form ---
  sifra = '';
  naziv = '';
  opis = '';
  kategorija = ''; // category id
  potkategorija = '';
  jedinicnaCena = 0;
  kolicinaNaLageru = 0;
  dostupneBojeText = ''; // comma-separated
  productMessage = '';

  // --- add-service form ---
  serviceProductId = '';
  idUsluge = '';
  tipStampe = '';
  dodatnaCenaPoKomadu = 0;
  maxSirinaMm = 0;
  maxVisinaMm = 0;
  serviceMessage = '';

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);

    this.categoryService.getAll().subscribe({ next: (c) => (this.categories = c), error: () => {} });
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getByPrinter(this.user._id).subscribe({
      next: (p) => (this.products = p),
      error: () => {},
    });
  }

  // Subcategories of the currently-selected category.
  get subcategories(): Subcategory[] {
    return this.categories.find((c) => c._id === this.kategorija)?.podkategorije ?? [];
  }

  addProduct(): void {
    this.productMessage = '';
    if (!this.sifra || !this.naziv || !this.kategorija || !this.potkategorija) {
      this.productMessage = 'Popunite obavezna polja (šifra, naziv, kategorija, potkategorija).';
      return;
    }
    const data = {
      stampar: this.user._id,
      sifra: this.sifra,
      naziv: this.naziv,
      opis: this.opis,
      kategorija: this.kategorija,
      potkategorija: this.potkategorija,
      jedinicnaCena: this.jedinicnaCena,
      kolicinaNaLageru: this.kolicinaNaLageru,
      dostupneBoje: this.dostupneBojeText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s),
    };
    this.productService.add(data).subscribe({
      next: () => {
        this.productMessage = 'Proizvod je dodat.';
        this.resetProductForm();
        this.loadProducts();
      },
      error: (err) => (this.productMessage = err?.error?.message ?? 'Greška pri dodavanju.'),
    });
  }

  private resetProductForm(): void {
    this.sifra = '';
    this.naziv = '';
    this.opis = '';
    this.kategorija = '';
    this.potkategorija = '';
    this.jedinicnaCena = 0;
    this.kolicinaNaLageru = 0;
    this.dostupneBojeText = '';
  }

  addService(): void {
    this.serviceMessage = '';
    if (!this.serviceProductId || !this.idUsluge || !this.tipStampe) {
      this.serviceMessage = 'Izaberite proizvod i popunite ID i tip štampe.';
      return;
    }
    const usluga = {
      idUsluge: this.idUsluge,
      tipStampe: this.tipStampe,
      dodatnaCenaPoKomadu: this.dodatnaCenaPoKomadu,
      maxSirinaMm: this.maxSirinaMm,
      maxVisinaMm: this.maxVisinaMm,
    };
    this.productService.addService(this.serviceProductId, usluga).subscribe({
      next: () => {
        this.serviceMessage = 'Usluga je dodata.';
        this.idUsluge = '';
        this.tipStampe = '';
        this.dodatnaCenaPoKomadu = 0;
        this.maxSirinaMm = 0;
        this.maxVisinaMm = 0;
      },
      error: (err) => (this.serviceMessage = err?.error?.message ?? 'Greška pri dodavanju usluge.'),
    });
  }
}
