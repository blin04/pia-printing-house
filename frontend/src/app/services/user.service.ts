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

  register(data: any) {
    return this.http.post<User>(`${this.uri}/register`, data);
  }

  getProfile(id: string) {
    return this.http.get<User>(`${this.uri}/profile/${id}`);
  }

  updateProfile(data: FormData) {
    return this.http.post<User>(`${this.uri}/updateProfile`, data);
  }

  adminLogin(username: string, password: string) {
    return this.http.post<User>(`${this.uri}/adminLogin`, { username, password });
  }

  getPending() {
    return this.http.get<User[]>(`${this.uri}/pending`);
  }

  approve(id: string) {
    return this.http.post(`${this.uri}/approve`, { id });
  }

  reject(id: string) {
    return this.http.post(`${this.uri}/reject`, { id });
  }

  getAllUsers() {
    return this.http.get<User[]>(`${this.uri}/all`);
  }

  adminUpdate(data: any) {
    return this.http.post<User>(`${this.uri}/adminUpdate`, data);
  }

  deleteUser(id: string) {
    return this.http.post(`${this.uri}/delete`, { id });
  }

  requestPasswordReset(identifier: string) {
    return this.http.post(`${this.uri}/requestPasswordReset`, { identifier });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.uri}/resetPassword`, { token, password });
  }
}
