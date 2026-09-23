import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { Order } from '../models/order';
import { OrderService } from '../services/order.service';
import { CommentService } from '../services/comment.service';

// One product row in the archive (flattened from the client's orders).
interface ArchiveRow {
  proizvod: string; // product id (for commenting)
  naziv: string;
  kolicina: number;
  stamparija: string;
  grad: string;
  datum: string; // order createdAt
  status: string; // isporuceno | primljeno
  orderId: string;
  // Transient comment-form state (received products only).
  reakcija: string;
  komentar: string;
  message: string;
}

@Component({
  selector: 'app-archive',
  imports: [DatePipe, FormsModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.css',
})
export class ArchiveComponent implements OnInit {
  user: User = new User();
  rows: ArchiveRow[] = [];

  sortColumn: keyof ArchiveRow = 'datum';
  sortAsc = false; // default: newest first

  private orderService = inject(OrderService);
  private commentService = inject(CommentService);

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
    this.load();
  }

  load(): void {
    this.orderService.getArchive(this.user._id).subscribe({
      next: (orders) => {
        this.rows = this.flatten(orders);
        this.applySort();
      },
      error: () => {},
    });
  }

  // Each ordered product becomes its own row (spec sorts by product/quantity/…).
  private flatten(orders: Order[]): ArchiveRow[] {
    const rows: ArchiveRow[] = [];
    for (const o of orders) {
      for (const p of o.proizvodi) {
        rows.push({
          proizvod: p.proizvod,
          naziv: p.naziv,
          kolicina: p.kolicina,
          stamparija: o.stamparija,
          grad: o.grad,
          datum: o.createdAt,
          status: o.status,
          orderId: o._id,
          reakcija: 'like',
          komentar: '',
          message: '',
        });
      }
    }
    return rows;
  }

  sortBy(column: keyof ArchiveRow): void {
    if (this.sortColumn === column) this.sortAsc = !this.sortAsc;
    else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.applySort();
  }

  // Little ▲/▼ indicator on the active column header.
  arrow(column: keyof ArchiveRow): string {
    if (this.sortColumn !== column) return '';
    return this.sortAsc ? ' ▲' : ' ▼';
  }

  private applySort(): void {
    const col = this.sortColumn;
    const dir = this.sortAsc ? 1 : -1;
    this.rows = [...this.rows].sort((a, b) => {
      if (a[col] < b[col]) return -1 * dir;
      if (a[col] > b[col]) return 1 * dir;
      return 0;
    });
  }

  markReceived(row: ArchiveRow): void {
    this.orderService.markReceived(row.orderId).subscribe({
      next: () => this.load(),
      error: () => {},
    });
  }

  comment(row: ArchiveRow): void {
    row.message = '';
    if (!row.komentar) {
      row.message = 'Unesite komentar.';
      return;
    }
    const data = {
      proizvod: row.proizvod,
      autorObjekat: this.user._id,
      narudzbina: row.orderId,
      reakcija: row.reakcija,
      komentar: row.komentar,
    };
    this.commentService.add(data).subscribe({
      next: () => {
        row.message = 'Komentar je poslat.';
        row.komentar = '';
      },
      error: (err) => {
        row.message = err?.error?.message ?? 'Greška pri slanju komentara.';
      },
    });
  }
}
