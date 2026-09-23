import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auction } from '../models/auction';

@Injectable({
  providedIn: 'root',
})
export class AuctionService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/auctions';

  create(clientId: string) {
    return this.http.post(`${this.uri}/create`, { id: clientId });
  }

  getByClient(clientId: string) {
    return this.http.get<Auction[]>(`${this.uri}/byClient/${clientId}`);
  }

  getOpen() {
    return this.http.get<Auction[]>(`${this.uri}/open`);
  }

  // `data`: { auctionId, stampar, proizvodi: BidItem[] }
  bid(data: any) {
    return this.http.post(`${this.uri}/bid`, data);
  }

  reportUrl(auctionId: string): string {
    return `${this.uri}/report/${auctionId}`;
  }
}
