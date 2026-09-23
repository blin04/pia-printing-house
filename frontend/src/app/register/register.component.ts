import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  // Basic fields (required for everyone).
  username = '';
  password = '';
  ime = '';
  prezime = '';
  telefon = '';
  email = '';

  // Account category chosen by the registrant: natural person, legal person, or printer.
  kategorija: 'fizicko' | 'pravno' | 'stampar' = 'fizicko';

  // Institution fields — only for legal-person clients and printers.
  naziv = '';
  adresaSedista = '';
  grad = '';
  maticniBroj = '';
  pib = '';

  // Optional profile image chosen via the file input.
  profilePicture: File | null = null;

  error = '';
  success = '';

  private userService = inject(UserService);
  private router = inject(Router);

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.profilePicture = input.files && input.files.length ? input.files[0] : null;
  }

  register(): void {
    this.error = '';
    this.success = '';

    if (!this.username || !this.password || !this.ime || !this.prezime || !this.telefon || !this.email) {
      this.error = 'Niste popunili sva polja!';
      return;
    }

    const needsInstitution = this.kategorija !== 'fizicko';
    if (needsInstitution && (!this.naziv || !this.adresaSedista || !this.grad || !this.maticniBroj || !this.pib)) {
      this.error = 'Niste popunili polja vezana za instituciju!';
      return;
    }

    // Sent as multipart/form-data so the optional profile image can ride along.
    const data = new FormData();
    data.append('username', this.username);
    data.append('password', this.password);
    data.append('ime', this.ime);
    data.append('prezime', this.prezime);
    data.append('telefon', this.telefon);
    data.append('email', this.email);
    data.append('tip', this.kategorija === 'stampar' ? 'stampar' : 'klijent');
    data.append('lice', this.kategorija === 'stampar' ? 'pravno' : this.kategorija);

    if (needsInstitution) {
      data.append(
        'institucija',
        JSON.stringify({
          naziv: this.naziv,
          adresaSedista: this.adresaSedista,
          grad: this.grad,
          maticniBroj: this.maticniBroj,
          pib: this.pib,
        })
      );
    }

    if (this.profilePicture) data.append('profilna', this.profilePicture);

    this.userService.register(data).subscribe({
      next: () => {
        this.success =
          this.kategorija === 'fizicko'
            ? 'Registracija uspešna. Možete da se ulogujete.'
            : 'Registracija potvrđena. Morate da sačekate da admin odobri vaš zahtev.';
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Registracija neuspešna';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['login']);
  }
}
