import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../models/user';
import { Category } from '../models/category';
import { UserService } from '../services/user.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  pending: User[] = [];
  users: User[] = [];
  categories: Category[] = [];

  newCategoryName = '';
  // Per-category subcategory input, keyed by category id.
  newSub: { [id: string]: string } = {};

  message = '';

  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (!stored) {
      this.router.navigate(['adminLogin']);
      return;
    }
    const u = JSON.parse(stored);
    if (u.tip !== 'admin') {
      this.router.navigate(['']);
      return;
    }
    this.loadPending();
    this.loadUsers();
    this.loadCategories();
  }

  loadPending(): void {
    this.userService.getPending().subscribe({ 
      next: (p) => (this.pending = p), 
      error: () => {} 
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({ 
      next: (u) => (this.users = u), 
      error: () => {} 
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({ 
      next: (c) => (this.categories = c), 
      error: () => {} 
    });
  }

  approve(u: User): void {
    this.userService.approve(u._id).subscribe({
      next: () => {
        this.loadPending();
        this.loadUsers();
      },
      error: () => {},
    });
  }

  reject(u: User): void {
    this.userService.reject(u._id).subscribe({
      next: () => {
        this.loadPending();
        this.loadUsers();
      },
      error: () => {},
    });
  }

  // --- all users ---
  updateUser(u: User): void {
    this.message = '';
    const data = { id: u._id, ime: u.ime, prezime: u.prezime, telefon: u.telefon, email: u.email };
    this.userService.adminUpdate(data).subscribe({
      next: () => (this.message = 'Korisnik "' + u.username + '" je ažuriran.'),
      error: (err) => (this.message = err?.error?.message ?? 'Greška pri ažuriranju.'),
    });
  }

  deleteUser(u: User): void {
    this.userService.deleteUser(u._id).subscribe({
      next: () => {
        this.loadUsers();
        this.loadPending();
      },
      error: () => {},
    });
  }

  // --- categories ---
  addCategory(): void {
    if (!this.newCategoryName) return;
    this.categoryService.addCategory(this.newCategoryName).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.loadCategories();
      },
      error: (err) => (this.message = err?.error?.message ?? 'Greška pri dodavanju kategorije.'),
    });
  }

  addSubcategory(c: Category): void {
    const naziv = this.newSub[c._id];
    if (!naziv) return;
    this.categoryService.addSubcategory(c._id, naziv).subscribe({
      next: () => {
        this.newSub[c._id] = '';
        this.loadCategories();
      },
      error: (err) => (this.message = err?.error?.message ?? 'Greška pri dodavanju potkategorije.'),
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['']);
  }
}
