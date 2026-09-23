// A required product line in a procurement (buyer-side spec).
export class RequiredItem {
  _id: string = '';
  naziv: string = '';
  kategorija: string = '';
  potkategorija: string = '';
  kolicina: number = 0;
  boja: string = '';
  tipStampe: string = '';

  // Transient bid-form state (printer's Licitacije page).
  selProizvod?: string; // chosen product id
  cena?: number; // offered unit price
}

// One priced line inside a printer's bid.
export class BidItem {
  potrebanProizvod: string = '';
  proizvod: string = '';
  jedinicnaCena: number = 0;
  ukupnaCena: number = 0;
}

// A printer's bid for an auction.
export class Bid {
  _id: string = '';
  stampar: string = '';
  stamparija: string = '';
  proizvodi: BidItem[] = [];
  ukupnacena: number = 0;
  naStanju: boolean = true;
}

// Public procurement / auction.
export class Auction {
  _id: string = '';
  klijent: string = '';
  nazivKlijenta: string = '';
  potrebniProizvodi: RequiredItem[] = [];
  ponude: Bid[] = [];
  zavrsetak: string = '';
  status: string = ''; // open | closed
  pobednik: string = ''; // winning bid _id
  narudzbina: string = '';
  zavrseno: string = '';
  createdAt: string = '';
}
