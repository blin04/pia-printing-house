import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Product } from '../models/product';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product',
  imports: [FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit {
  product: Product = new Product();

  isClient = false;
  // filename of the image currently shown as the main one
  currentImage = '';
  boja = 'Bela';
  mapUrl: SafeResourceUrl | null = null;

  uploadsUri = 'http://localhost:4000/uploads';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      this.isClient = u.tip === 'klijent';
    }

    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.productService.details(id).subscribe({
      next: (p) => {
        this.product = p;
        this.currentImage = p.slikaUrl;
        if (p.dostupneBoje && p.dostupneBoje.length) this.boja = p.dostupneBoje[0];
        this.buildMap();
      },
      error: () => {},
    });
  }

  private buildMap(): void {
    const loc = this.product.stampar?.institucija?.lokacija;
    if (!loc || loc.lat == null || loc.lng == null) return;
    const { lat, lng } = loc;
    const bbox = `${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${lng}`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  setImage(img: string): void {
    this.currentImage = img;
  }

  back(): void {
    this.router.navigate([this.isClient ? 'client' : '']);
  }

  dalje(): void {
    // TODO: navigate to the product preparation page (not built yet).
  }
}
