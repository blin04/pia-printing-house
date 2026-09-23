export class Subcategory {
  _id: string = '';
  naziv: string = '';
}

// Mirrors a category document.
export class Category {
  _id: string = '';
  naziv: string = '';
  podkategorije: Subcategory[] = [];
}
