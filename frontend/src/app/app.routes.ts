import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ClientComponent } from './client/client.component';
import { PrinterComponent } from './printer/printer.component';
import { RegisterComponent } from './register/register.component';
import { ProductComponent } from './product/product.component';
import { PreparationComponent } from './preparation/preparation.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminComponent } from './admin/admin.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const routes: Routes = [
    {path: "", component: HomeComponent},
    {path: "login", component: LoginComponent},
    {path: "client", component: ClientComponent},
    {path: "printer", component: PrinterComponent},
    {path: "register", component: RegisterComponent},
    {path: "product/:id", component: ProductComponent},
    {path: "prepare/:id", component: PreparationComponent},
    {path: "adminLogin", component: AdminLoginComponent},
    {path: "admin", component: AdminComponent},
    {path: "forgot", component: ForgotPasswordComponent},
    {path: "reset/:token", component: ResetPasswordComponent}
];
