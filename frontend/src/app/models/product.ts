import { Category } from './category';

// Product as returned by search (kategorija is populated with its name).
export class Product {
  _id: string = '';
  naziv: string = '';
  kategorija: Category = new Category();
}
