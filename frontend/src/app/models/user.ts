// Mirrors the user document returned by the backend (Serbian schema fields).
export class User {
  _id: string = '';
  username: string = '';
  ime: string = '';
  prezime: string = '';
  telefon: string = '';
  email: string = '';
  profilna: string = '';
  tip: string = '';    // 'klijent' | 'stampar' | 'admin'
  lice: string = '';   // 'fizicko' | 'pravno'
  status: string = ''; // 'neodobren' | 'odobren' | 'odbijen'
}
