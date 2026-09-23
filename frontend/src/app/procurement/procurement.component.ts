import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { User } from '../models/user';
import { Auction, Bid } from '../models/auction';
import { AuctionService } from '../services/auction.service';

@Component({
  selector: 'app-procurement',
  imports: [DatePipe],
  templateUrl: './procurement.component.html',
  styleUrl: './procurement.component.css',
})
export class ProcurementComponent implements OnInit {
  user: User = new User();
  auctions: Auction[] = [];

  private auctionService = inject(AuctionService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    this.load();
  }

  load(): void {
    // Opening this page is also what lazily resolves any expired auctions.
    this.auctionService.getByClient(this.user._id).subscribe({
      next: (a) => (this.auctions = a),
      error: () => {},
    });
  }

  winner(a: Auction): Bid | undefined {
    return a.ponude.find((b) => b._id === a.pobednik);
  }

  reportUrl(id: string): string {
    return this.auctionService.reportUrl(id);
  }
}
