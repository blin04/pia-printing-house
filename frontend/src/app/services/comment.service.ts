import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Comment } from '../models/comment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private http = inject(HttpClient);
  uri = 'http://localhost:4000/comments';

  // `data`: { proizvod, autorObjekat, narudzbina, reakcija, komentar }
  add(data: any) {
    return this.http.post(`${this.uri}/add`, data);
  }

  getByProduct(id: string) {
    return this.http.get<Comment[]>(`${this.uri}/byProduct/${id}`);
  }
}
