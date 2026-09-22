import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ClientComponent } from './client/client.component';
import { PrinterComponent } from './printer/printer.component';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
    {path: "", component: HomeComponent},
    {path: "login", component: LoginComponent},
    {path: "client", component: ClientComponent},
    {path: "printer", component: PrinterComponent},
    {path: "register", component: RegisterComponent}
];
