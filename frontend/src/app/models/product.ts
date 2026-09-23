import { Category } from './category';

// One print service / surcharge offered on a product.
export class PrintService {
  idUsluge: string = '';
  tipStampe: string = '';
  dodatnaCenaPoKomadu: number = 0;
  maxSirinaMm: number = 0;
  maxVisinaMm: number = 0;
}

// Product. Search returns a subset (naziv + kategorija); details fills the rest.
// `stampar` is the populated printer ({ institucija: { naziv, grad, lokacija } }).
export class Product {
  _id: string = '';
  sifra: string = '';
  naziv: string = '';
  opis: string = '';
  kategorija: Category = new Category();
  potkategorija: string = '';
  jedinicnaCena: number = 0;
  kolicinaNaLageru: number = 0;
  dostupneBoje: string[] = [];
  slikaUrl: string = '';
  dodatneSlike: string[] = [];
  uslugeStampe: PrintService[] = [];
  likes: number = 0;
  dislikes: number = 0;
  stampar?: any;
}
