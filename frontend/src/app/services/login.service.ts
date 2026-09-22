import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/users';

  login(username: string, password: string) {
    const data = { username, password };
    return this.http.post<User>(`${this.uri}/login`, data);
  }
}
