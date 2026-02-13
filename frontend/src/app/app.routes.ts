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
import { AdminManagementComponent } from './components/dashboard/admin-management/admin-management.component';
import { AddAdminComponent } from './components/dashboard/admin-management/add-admin/add-admin.component';
import { SecuritySettingsComponent } from './components/dashboard/admin-management/security-settings/security-settings.component';
import { UsersListComponent } from './components/dashboard/admin-management/users-list/users-list.component';
import { AdminHomeComponent } from './components/dashboard/admin/home/admin-home.component';
import { AssignReclamationComponent } from './components/dashboard/admin/assign-reclamation/assign-reclamation.component';
import { ComplementRequestsComponent } from './components/dashboard/admin/complement-requests/complement-requests.component';
import { ConsumersListComponent } from './components/dashboard/admin/consumers-list/consumers-list.component';

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
            { path: 'reclamation/new', component: AddReclamationComponent },
            { path: 'admin-management', component: AdminManagementComponent },
            { path: 'admin-management/add', component: AddAdminComponent },
            { path: 'admin-management/security', component: SecuritySettingsComponent },
            { path: 'admin-management/users', component: UsersListComponent },
            { path: 'admin-home', component: AdminHomeComponent },
            { path: 'admin/assign', component: AssignReclamationComponent },
            { path: 'admin/complements', component: ComplementRequestsComponent },
            { path: 'admin/consumers', component: ConsumersListComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];
