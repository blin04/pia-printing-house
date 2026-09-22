// One ordered product line inside an order (mirrors the backend orderItem schema).
export class OrderItem {
  proizvod: string = '';
  naziv: string = '';
  kolicina: number = 0;
  boja: string = '';
  idUsluge?: string;
  tipStampe?: string;
  jedinicnaCena: number = 0;
  ukupnaCena: number = 0;
}

// An order == an invoice (one per printer). Mirrors the backend order document.
export class Order {
  _id: string = '';
  stamparija: string = ''; // printer name
  grad: string = '';       // printer city (supplied by the controller)
  proizvodi: OrderItem[] = [];
  cena: number = 0;
  status: string = '';     // naruceno | placeno | u_stampi | isporuceno | primljeno
}
