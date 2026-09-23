import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { Auction } from '../models/auction';
import { Product } from '../models/product';
import { AuctionService } from '../services/auction.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-bidding',
  imports: [DatePipe, FormsModule],
  templateUrl: './bidding.component.html',
  styleUrl: './bidding.component.css',
})
export class BiddingComponent implements OnInit {
  user: User = new User();
  auctions: Auction[] = [];
  myProducts: Product[] = [];
  message: { [auctionId: string]: string } = {};

  private auctionService = inject(AuctionService);
  private productService = inject(ProductService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);

    this.auctionService.getOpen().subscribe({
      next: (a) => (this.auctions = a),
      error: () => {},
    });
    this.productService.getByPrinter(this.user._id).subscribe({
      next: (p) => (this.myProducts = p),
      error: () => {},
    });
  }

  submit(a: Auction): void {
    this.message[a._id] = '';
    // Build one priced line per required item (bound via item.selProizvod / item.cena).
    const proizvodi = a.potrebniProizvodi.map((item) => ({
      potrebanProizvod: item._id,
      proizvod: item.selProizvod ?? '',
      jedinicnaCena: item.cena ?? 0,
      ukupnaCena: (item.cena ?? 0) * item.kolicina,
    }));
    const data = { auctionId: a._id, stampar: this.user._id, proizvodi };
    this.auctionService.bid(data).subscribe({
      next: () => (this.message[a._id] = 'Ponuda je poslata.'),
      error: (err) => (this.message[a._id] = err?.error?.message ?? 'Greška pri slanju ponude.'),
    });
  }
}
