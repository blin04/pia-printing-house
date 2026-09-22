import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../models/product';
import { User } from '../models/user';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-preparation',
  imports: [FormsModule],
  templateUrl: './preparation.component.html',
  styleUrl: './preparation.component.css',
})
export class PreparationComponent implements OnInit {
  product: Product = new Product();
  user: User = new User();

  boja = 'Bela';
  idUsluge = '';
  kolicina = 1;
  tekst = '';
  slika: File | null = null;
  slikaPreview: string | null = null;

  error = '';
  message = '';

  uploadsUri = 'http://localhost:4000/uploads';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);

    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.productService.details(id).subscribe({
      next: (p) => {
        this.product = p;
        if (p.dostupneBoje && p.dostupneBoje.length) this.boja = p.dostupneBoje[0];
      },
      error: () => {},
    });
  }

  onImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.slika = input.files && input.files.length ? input.files[0] : null;
    if (this.slika) {
      const reader = new FileReader();
      reader.onload = () => (this.slikaPreview = reader.result as string);
      reader.readAsDataURL(this.slika);
    } else {
      this.slikaPreview = null;
    }
  }

  reset(): void {
    this.boja = this.product.dostupneBoje?.length ? this.product.dostupneBoje[0] : 'Bela';
    this.idUsluge = '';
    this.kolicina = 1;
    this.tekst = '';
    this.slika = null;
    this.slikaPreview = null;
    this.error = '';
    this.message = '';
  }

  addToCart(): void {
    this.error = '';
    this.message = '';

    if (!this.kolicina || this.kolicina < 1) {
      this.error = 'Unesite ispravnu količinu.';
      return;
    }
    if (this.kolicina > this.product.kolicinaNaLageru) {
      this.error = 'Nema dovoljno proizvoda trenutno na stanju';
      return;
    }

    const data = new FormData();
    data.append('id', this.user._id);
    data.append('proizvod', this.product._id);
    data.append('stamparija', this.product.stampar?._id ?? '');
    data.append('kolicina', String(this.kolicina));
    data.append('boja', this.boja);
    data.append('idUsluge', this.idUsluge);
    data.append('tekst', this.tekst);
    if (this.slika) data.append('slika', this.slika);

    this.cartService.add(data).subscribe({
      next: () => (this.message = 'Proizvod je dodat u korpu.'),
      error: (err) => (this.error = err?.error?.message ?? 'Greška pri dodavanju u korpu.'),
    });
  }

  back(): void {
    this.router.navigate(['product', this.product._id]);
  }
}
