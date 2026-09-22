import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/users';

  login(username: string, password: string) {
    const data = { username, password };
    return this.http.post<User>(`${this.uri}/login`, data);
  }

  // `data` mirrors the backend register payload (basic fields + tip/lice and,
  // for pravno lice / stampar, an `institucija` object).
  register(data: any) {
    return this.http.post<User>(`${this.uri}/register`, data);
  }
}
