import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/dashboard/profile/profile.component';
import { AddReclamationComponent } from './components/dashboard/reclamation/add-reclamation.component';
import { authGuard } from './guards/auth.guard';

import { ReclamationListComponent } from './components/dashboard/reclamation/reclamation-list.component';
import { DashboardHomeComponent } from './components/dashboard/home/dashboard-home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardHomeComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'reclamation', component: ReclamationListComponent },
            { path: 'reclamation/new', component: AddReclamationComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];
