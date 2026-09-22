import { Product } from './product';

export class CartItem {
  _id: string = '';
  proizvod: Product = new Product();
  stamparija: any;
  kolicina: number = 0;
  boja: string = 'Bela';
  idUsluge?: string;
  tekst?: string;
}
